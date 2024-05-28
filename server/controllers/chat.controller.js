import { ALERT, REFETCH_CHAT } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
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

const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "name avatar"
  );

  if (!chats) {
    throw new ApiError(404, "Chats not found");
  }

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, req.user);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user._id.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  res.status(200).json(new ApiResponse(200, transformedChats, "Chat fetched"));
});

const getMyGroups = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    members: req.user,
    groupChat: true,
    creator: req.user,
  }).populate("members", "name avatar");

  if (!chats) {
    throw new ApiError(404, "Group not found");
  }
  const groups = chats.map(({ _id, groupChat, members, name }) => ({
    _id,
    groupChat,
    name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));
  res
    .status(200)
    .json(new ApiResponse(200, groups, "Group Fetched Successfully"));
});

export { newGroupChat, getMyChats, getMyGroups };
