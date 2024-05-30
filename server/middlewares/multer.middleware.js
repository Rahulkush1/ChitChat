import multer from "multer";

const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

const singleAvatar = multerUpload.single("avatar");

const sendAttachmentMulter = multerUpload.array("files", 5);

export { singleAvatar, sendAttachmentMulter };
