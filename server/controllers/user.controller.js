import { waitForDebugger } from "inspector";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCludinary } from "../utils/cloudinary.js";

const generateTokens = async (user_id) => {
  try {
    const user = await User.findById(user_id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, password, bio } = req.body;
  const avatar = req.file.path;
  console.log(req.file);
  if (!name || !username || !password || !avatar) {
    throw new ApiError(400, "All Fields required");
  }

  const user = await User.create({
    name,
    username,
    bio,
    password,
    avatar: {
      public_id: "demo",
      url: "demo",
    },
  });

  const response = await uploadOnCludinary(avatar);

  user.avatar = {
    public_id: response.public_id,
    url: response.url,
  };

  await user.save({ validateBeforeSave: false });

  if (!user) {
    throw new ApiError(403, "Somthing went wrong while registering User");
  }

  const transformedUser = {
    _id: user._id,
    name: user.name,
    username: username,
    bio: user.bio,
    avatar: user.avatar.url,
  };

  const options = {
    maxAge: 4 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(201)
    .cookie("access-token", accessToken, options)
    .cookie("refresh-token", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          user: transformedUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username or Password required");
  }
  const user = await User.findOne({ username: username }).select(" +password");

  if (!user) {
    throw new ApiError(400, "Inavalid user credentials");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user Credentials");
  }
  const options = {
    maxAge: 4 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loginUser = await User.findOne({ username: user.username });

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User Login successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );
  const options = {
    maxAge: 4 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(" -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "profile fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { name, username, bio } = req.body;

  if (!name || !username || !bio) {
    throw new ApiError(404, "All Feilds are required!");
  }

  const updateUserDetails = await User.findByIdAndUpdate(
    req.user._id,
    { name, username, bio },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  if (!updateUserDetails) {
    throw new ApiError(500, "Somthiong went wrong while updating user details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateUserDetails, "User details updated"));
});

const updatePassword = asyncHandler(async (req, res) => {
  const { password, oldPassword, confirmPassword } = req.body;

  if (!password) {
    throw new ApiError(400, "Invalid password");
  }

  const user = await User.findById(req.user?._id).select("+password");

  if (!user) {
    throw new ApiError(500, "Somthing went wrong wile updating password");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old Password is Incorrect");
  }

  if (password === oldPassword) {
    throw new ApiError(403, "New Passwword can not be same as old password");
  }

  if (password !== confirmPassword) {
    throw new ApiError(403, "Password do not match");
  }

  user.password = password;
  await user.save();

  return res.status(200).json(new ApiResponse(200, user, "Password updated"));
});

export {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  updateUserDetails,
  updatePassword,
};
