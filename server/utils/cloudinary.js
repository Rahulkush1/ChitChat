import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

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

const deleteFilesFromCloudinary = async (public_id) => {
  try {
    if (!public_id) {
      throw new ApiError(403, "Image not Found");
    }
    const response = await cloudinary.uploader.destroy(public_id);
    console.log("file deleted successfully", response);
    return response;
  } catch (error) {
    throw new ApiError(403, "Somthing went wrong when deleting files");
  }
};

export { uploadOnCludinary, deleteFilesFromCloudinary };
