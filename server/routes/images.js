import express from "express";

import multer from "multer";
import cloudinary from "../config/cloudinary.js"

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'),async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'images'
                },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            stream.end(buffer
            )
        })
    }
     const result = await streamUpload(req.file.buffer);
     
     res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id
     })
})

export default router;