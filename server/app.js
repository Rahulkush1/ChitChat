import express from "express";
const app = express();
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// Routes

import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";

app.use("/api/v1/users", userRoutes);
export { app };
