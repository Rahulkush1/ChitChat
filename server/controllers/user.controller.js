import { waitForDebugger } from "inspector";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    console.log(user);
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, password, bio } = req.body;

  if (!name || !username || !password || !avatar) {
    throw new ApiError(400, "All Fields required");
  }
  const avatar = {
    public_id: `sdff`,
    url: `sdfg`,
  };
  const user = await User.create({
    name,
    username,
    bio,
    password,
    avatar,
  });

  if (!user) {
    throw new ApiError(403, "Somthing went wrong while registering User");
  }

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
        { user: user, accessToken: accessToken, refreshToken: refreshToken },
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



export { registerUser, loginUser, getProfile, logoutUser };
