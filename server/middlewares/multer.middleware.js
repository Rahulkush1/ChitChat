import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });


const singleAvatar = upload.single("avatar");
const sendAttachmentMulter = upload.array("files", 5);

export { singleAvatar, sendAttachmentMulter };
