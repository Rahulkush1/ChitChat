import express from "express";
import { singleAvatar } from "../middlewares/multer.middleware.js";
import {
  forgotPassword,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updatePassword,
  updateUserAvatar,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/new").post(singleAvatar, registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(isAuthenticated, getProfile);
router.route("/logout").post(isAuthenticated, logoutUser);
router.route("/edit/profile").put(isAuthenticated, updateUserDetails);
router
  .route("/edit/profile/image")
  .patch(isAuthenticated, singleAvatar, updateUserAvatar);
router.route("/edit/password").patch(isAuthenticated, updatePassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").patch(resetPassword);

export default router;
