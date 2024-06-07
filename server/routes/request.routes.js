import express from "express";
import { createRequest } from "../controllers/request.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, createRequest);

export default router;
