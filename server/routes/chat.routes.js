import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { newGroupChat } from "../controllers/chat.controller.js";

const router = express.Router();

router.route("/new").post(isAuthenticated, newGroupChat);

export default router;
