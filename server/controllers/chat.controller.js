import { ALERT, REFETCH_CHAT } from "../constants/events.js";
import { Chat } from "../models/chat.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitEvent } from "../utils/features.js";

const newGroupChat = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  if (!name || !members) {
    throw new ApiError(404, "All fields are required");
  }

  if (members.length < 2) {
    throw new ApiError(422, "Members must be at least 3 members");
  }

  const allMembers = [...members, req.user];
  const chatGroup = await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
  });

  emitEvent(
    req,
    ALERT,
    req.user,
    allMembers,
    `Welcome to the ${name} group chat`
  );
  emitEvent(req, REFETCH_CHAT, members);
  return res.status(201).json(new ApiResponse(201, chatGroup, "Group Created"));
});

export { newGroupChat };
