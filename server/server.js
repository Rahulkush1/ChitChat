import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});
import connectDB from "./db/connectDB.js";
import {
  createGroupChats,
  createMessage,
  createMessageInChat,
  createSingleChats,
  createUser,
} from "./seeders/seed.js";
import { v2 as cloudinary } from "cloudinary";

const port = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB()
  .then(() => [
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${port}`);
    }),
  ])
  .catch((err) => console.log("MongoDB connection failed !!!", err));

// createUser(10);
// createSingleChats(5);
// createGroupChats(10);
// createMessage(10);
// createMessageInChat("66615786f5858f22f8dc8abb", 10)
