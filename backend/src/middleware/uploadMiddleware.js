import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the local uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// const fileFilter = (req, file, cb) => {
//   // Allow common formats: pictures, videos, documents
//   const allowedExtensions = /jpeg|jpg|png|gif|webp|mp4|webm|pdf|docx|txt|zip|xls|xlsx|ppt|pptx/;
//   const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = allowedExtensions.test(file.mimetype);

//   if (extName && mimeType) {
//     cb(null, true);
//   } else {
//     cb(new Error('File extension or MIME type not supported!'));
//   }
// };

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
        ".jpeg",
        ".jpg",
        ".png",
        ".gif",
        ".webp",
        ".mp4",
        ".webm",
        ".pdf",
        ".docx",
        ".txt",
        ".zip",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
    ];

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/zip",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const mimeType = file.mimetype.toLowerCase();

    if (
        allowedExtensions.includes(extension) &&
        allowedMimeTypes.includes(mimeType)
    ) {
        cb(null, true);
    } else {
        console.log("Rejected file:", {
            extension,
            mimeType,
        });

        cb(new Error("File extension or MIME type not supported!"));
    }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Megabyte limit
  fileFilter: fileFilter,
});

export default upload;
