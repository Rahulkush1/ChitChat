import { ALERT, ATTACHMENT_ALERT, NEW_ATTACHMENT, REFETCH_CHAT } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCludinary } from "../utils/cloudinary.js";
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

const addMembers = asyncHandler(async (req, res) => {
  const { chatId, members } = req.body;
  if (!chatId) {
    throw new ApiError(404, "Chat is not Found!");
  }

  if (!members || members.length < 1) {
    throw new ApiError(400, "Please provide members");
  }
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.groupChat) {
    throw new ApiError(400, "This is not a group chat!");
  }

  if (chat.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to add members to this group");
  }
  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  const alreadyAddedMembers = allNewMembers.filter((i) =>
    chat.members.includes(i._id)
  );

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 50) {
    throw new ApiError(400, "Group members limit reached");
  }

  await chat.save();
  const allUsersName = allNewMembers.map((i) => i.name).join(",");
  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUsersName} has been added in the group`
  );

  emitEvent(req, REFETCH_CHAT, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Members added successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.body;

  const chat = await Chat.findById(chatId);
  const userThatWillRemoved = await User.findById(userId, "name");

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (!chat.groupChat) {
    throw new ApiError(400, "This is not a group chat!");
  }

  if (chat.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to add members to this group");
  }

  if (chat.members.length <= 3) {
    throw new ApiError(400, "Gruop must have at least 3 members");
  }
  chat.members = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );

  await chat.save();

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${userThatWillRemoved.name} has been removed from the group`
  );
  emitEvent(req, REFETCH_CHAT, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed successfully"));
});

const leaveGroup = asyncHandler(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  if (!chat.groupChat) {
    throw new ApiError(400, "This is not a group chat!");
  }
  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== req.user._id.toString()
  );

  if (remainingMembers.length < 3) {
    throw new ApiError(400, "Group must have at least 3 members");
  }
  if (chat.creator.toString() === req.user._id.toString()) {
    const randomElement = Math.floor(Math.random() * remainingMembers.length);
    const newCreator = remainingMembers[randomElement];
    chat.creator = newCreator;
  }
  chat.members = remainingMembers;

  await chat.save();

  emitEvent(req, ALERT, chat.members, `${req.user.name} has left the group`);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member leave successfully"));
});

const sendAttachment = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  let imagesObject = [];
  const files = req.files || [];
  if (files.length < 1) {
    throw new ApiError(400, "Please provide attachments");
  }

  for (let i = 0; i < req.files.length; i++) {
    let localFilePath = req.files[i].path;
    if (!localFilePath) {
      throw new ApiError(400, "Please upload images");
    }
    const image = await uploadOnCludinary(localFilePath);
    if (!image) {
      throw new ApiError(400, "Something went wrong while uploading");
    }

    imagesObject.push({
      public_id: image.public_id,
      url: image.secure_url,
    });
  }
  const attachments = imagesObject;
  const messageForRealTime = {
    content: "",
    attachments,
    sender: {
      _id: req.user._id,
      name: req.user.name,
    },
    chat: chatId,
  };
  const messageForDB = {
    content: "",
    attachments: attachments,
    sender: req.user?._id,
    chat: chatId,
  };

  const message = await Message.create(messageForDB);

  emitEvent(req, NEW_ATTACHMENT, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, ATTACHMENT_ALERT, chat.members, {
    chatId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Attachment sent successfully"));
});

const getChatDetails = asyncHandler(async (req, res) => {
  if (req.query.populate === "true") {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId)
      .populate("members", "name avatar")
      .lean();

    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }

    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, chat, "Chat Details fetched successfully"));
  } else {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, chat, "Chat Details fetched Successfully"));
  }
});

const renameGroupName = asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const { name } = req.query;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not Found");
  }

  if (!chat.groupChat) {
    throw new ApiError(400, "This is not a group chat!");
  }

  if (chat.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to rename the group name");
  }

  chat.name = name;

  await chat.save();

  emitEvent(req, REFETCH_CHAT, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group rename successfully"));
});

export {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachment,
  getChatDetails,
  renameGroupName,
};
