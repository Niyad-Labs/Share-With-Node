import express from 'express'
import path from 'node:path'
import os from 'os'
import multer from 'multer'

const router = express.Router()
const downloadPath = path.join(os.homedir(), "Downloads")
console.log(downloadPath);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, downloadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB
});

router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "pages", "upload.html"))
})

router.post("/", (req, res) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            console.log(err);
        }
        res.status(200).json({
            message: "File uploaded successfully",
            file: req.file.filename
        });
    })
});

export default router