import express from "express";
import { singleAvatar } from "../middlewares/multer.middleware.js";
import {
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/new").post(singleAvatar, registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(isAuthenticated, getProfile);
router.route("/logout").post(isAuthenticated, logoutUser);

export default router;
