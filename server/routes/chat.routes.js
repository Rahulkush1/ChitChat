import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  addMembers,
  getChatDetails,
  getMyChats,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroupName,
  sendAttachment,
} from "../controllers/chat.controller.js";
import { sendAttachmentMulter } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/new").post(isAuthenticated, newGroupChat);
router.route("/my").get(isAuthenticated, getMyChats);
router.route("/my/group").get(isAuthenticated, getMyGroups);
router.route("/add/members").put(isAuthenticated, addMembers);
router.route("/remove/member").put(isAuthenticated, removeMember);
router.route("/leave/:id").delete(isAuthenticated, leaveGroup);
router
  .route("/message")
  .post(isAuthenticated, sendAttachmentMulter, sendAttachment);
router
  .route("/:id")
  .get(isAuthenticated, getChatDetails)
  .put(isAuthenticated, renameGroupName)
  .delete();

export default router;
