import express from "express";
const app = express();
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config({
  path: "./.env",
});

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

// Routes

import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import requestRoutes from "./routes/request.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/request", requestRoutes);

// error middleware
import errorMiddleware from "./middlewares/error.middleware.js";
app.use(errorMiddleware);

export { app };
