import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Request } from "../models/request.model.js";

const createRequest = asyncHandler(async (req, res) => {
  const { receiver } = req.body;

  if (!receiver) {
    throw new ApiError(400, "Receiver is required");
  }

  // Check if there is already a request between the users
  const existingRequest = await Request.findOne({
    $or: [
      { receiver: req.user._id, sender: receiver },
      { sender: req.user._id, receiver: receiver },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "accepted") {
      throw new ApiError(400, "User is already your friend");
    }

    if (existingRequest.sender.toString() === req.user._id.toString()) {
      // The current user is the sender of an existing request, do nothing
      throw new ApiError(400, "Request is already sent");
    } else if (
      existingRequest.receiver.toString() === req.user._id.toString()
    ) {
      // The current user is the receiver and can accept the request
      existingRequest.status = "accepted";
      await existingRequest.save({ validateBeforeSave: true });

      return res
        .status(200)
        .json(
          new ApiResponse(200, existingRequest, "Request Accepted successfully")
        );
    }
  } else {
    // No existing request, create a new one
    const newRequest = await Request.create({
      sender: req.user._id,
      receiver: receiver,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newRequest, "Request Sent successfully"));
  }
});

export { createRequest };
