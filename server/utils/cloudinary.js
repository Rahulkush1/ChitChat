import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCludinary = async (localPath) => {
  try {
    if (!localPath) {
      console.log("No local path specified");
      return null;
    }
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    console.log("file uploaded successfully", response.url);
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath);
    return null;
  }
};

export { uploadOnCludinary };
