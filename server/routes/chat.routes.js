import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  getMyChats,
  getMyGroups,
  newGroupChat,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.route("/new").post(isAuthenticated, newGroupChat);
router.route("/my").get(isAuthenticated, getMyChats);
router.route("/my/group").get(isAuthenticated, getMyGroups);

export default router;
