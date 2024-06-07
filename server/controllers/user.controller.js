import { response } from "express";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFilesFromCloudinary,
  uploadOnCludinary,
} from "../utils/cloudinary.js";
import sendmail from "../utils/sendEmail.js";
import crypto from "crypto";

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
  const { name, username, password, bio, email } = req.body;
  const avatar = req.file.path;
  console.log(req.file);
  if (!name || !username || !password || !avatar || !email) {
    throw new ApiError(400, "All Fields required");
  }

  const user = await User.create({
    name,
    username,
    bio,
    password,
    email,
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

  user.coverImage = {
    public_id: "pfrsyfwgcx1ocxtywgof",
    url: "https://res.cloudinary.com/dmxouatnw/image/upload/v1717673906/pfrsyfwgcx1ocxtywgof.png",
  };

  await user.save({ validateBeforeSave: false });

  if (!user) {
    throw new ApiError(403, "Somthing went wrong while registering User");
  }

  await sendOtp(user);

  const transformedUser = {
    _id: user._id,
    email: user.email,
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

  if (!user.activated) {
    throw new ApiError(401, "Please activate your account");
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

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file?.path;

  if (!avatar) {
    throw new ApiError(404, "User avatar is required");
  }

  const avatarPublicId = req.user?.avatar?.public_id;

  if (!avatarPublicId) {
    throw new ApiError(404, "User avatar not found");
  }

  await deleteFilesFromCloudinary(avatarPublicId);
  const uploadedAvatar = await uploadOnCludinary(avatar);

  if (!uploadedAvatar) {
    throw new ApiError(403, "Failed to upload image");
  }

  const updatedAvatar = {
    public_id: uploadedAvatar.public_id,
    url: uploadedAvatar.url,
  };

  req.user.avatar = updatedAvatar;

  await req.user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Profile Image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.file?.path;

  if (!coverImage) {
    throw new ApiError(404, "User coverImage is required");
  }

  const coverImagePublicId = req.user?.coverImage?.public_id;

  if (!coverImagePublicId) {
    throw new ApiError(404, "User coverImage not found");
  }

  await deleteFilesFromCloudinary(coverImagePublicId);
  const uploadedcoverImage = await uploadOnCludinary(coverImage);

  if (!uploadedcoverImage) {
    throw new ApiError(403, "Failed to upload image");
  }

  const updatedcoverImage = {
    public_id: uploadedcoverImage.public_id,
    url: uploadedcoverImage.url,
  };

  req.user.coverImage = updatedcoverImage;

  await req.user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Profile Image updated successfully"));
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(404, "Please provide a valid email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(403, "User with this email does not exist");
  }

  const resetToken = await user.generateResetPasswordToken();

  if (!resetToken) {
    throw new ApiError(500, "Somthing went wrong while generating reset token");
  }

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/password/reset/${resetToken}`;

  const options = {
    email: user.email,
    subject: "Reset Your Password",
    message: `Hello ${user.name},\n\nPlease reset your password by clicking the link below:\n\n${resetPasswordUrl}\n\nIf you did not make this request, please ignore this email and your password will remain unchanged.\n\nSincerely,\n${process.env.FRONTEND_NAME}`,
  };
  try {
    await sendmail(options);
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, `Email sent to ${user.email} successfully`)
      );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, error.message);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token;

  if (!token) {
    throw new ApiError(404, "Invalid resent password url");
  }

  const { password } = req.query;

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  if (!resetPasswordToken) {
    throw new ApiError(404, "Invalid resent password url");
  }

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Password reset token is invalid or has expired");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password reset successfully"));
});

const sendOtp = async (user) => {
  const otp = Math.floor(Math.random() * 900000);

  console.log(otp);

  if (!otp) {
    throw new ApiError(500, "Somthing went wrong");
  }

  user.otp = otp;
  user.otpExpiry = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const options = {
    email: user.email,
    subject: "Your OTP Code for Account Verification",
    message: `Dear ${user.name},\n\nThank you for registering with ChitChat. To complete your account verification, please use the One-Time Password (OTP) provided below:\n\nYour OTP Code: ${otp}\n\nThis code is valid for the next 10 minutes. For security reasons, please do not share this code with anyone.\n\nIf you did not request this verification, please ignore this email or contact our support team immediately.\n\nThank you for choosing ChitChat.\n\nWe look forward to serving you.\n\nBest regards,\nChitChat\nchitchat.help.gmail.com`,
  };
  await sendmail(options);
};

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, username } = req.body;
  const currentDate = new Date(Date.now());
  if (!otp) {
    throw new ApiError(403, "Please Enter your otp");
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not Found");
  }

  if (otp !== user.otp) {
    throw new ApiError(400, "Incorrect OTP");
  }

  if (user.otpExpiry < currentDate) {
    throw new ApiError(400, "OTP Expired");
  }

  if (otp === user.otp && user.otpExpiry >= currentDate) {
    user.activated = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "OTP verified"));
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await sendOtp(user);

  return res
    .status(200)
    .json(new ApiResponse(200, user.otp, "Otp sent successfully"));
});

export {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateUserAvatar,
  updateUserCoverImage,
  verifyOtp,
  resendOtp,
};
