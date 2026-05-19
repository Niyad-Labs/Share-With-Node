import express from 'express'
import path from 'node:path'
import os from 'os'
import { app } from 'electron';
import multer from 'multer'
import fs from "fs";

const router = express.Router()
const downloadPath = path.join(os.homedir(), "Downloads")



const upload = multer({
    dest: "temp/",
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB
});

router.get('/', (req, res) => {
    const isDev = !app.isPackaged;
    const basePath = isDev ? path.join(process.cwd(), "public") : path.join(process.resourcesPath, "public")
    res.sendFile(path.join(basePath, "pages", "upload.html"))
})



router.post("/", upload.single("chunk"), (req, res) => {

    try {

        // console.log(req.body);
        // console.log(req.file);

        const body = req.body || {};

        const chunkIndex =
            body.chunkIndex;

        const totalChunks =
            body.totalChunks;

        const fileName =
            body.fileName;

        if (
            chunkIndex === undefined ||
            totalChunks === undefined ||
            !fileName
        ) {
            return res.status(400).send(
                "Missing chunk data"
            );
        }

        const chunkDir = path.join(
            "chunks",
            fileName
        );

        if (!fs.existsSync(chunkDir)) {

            fs.mkdirSync(chunkDir, {
                recursive: true
            });
        }

        const chunkPath = path.join(
            chunkDir,
            `chunk-${chunkIndex}`
        );

        fs.renameSync(
            req.file.path,
            chunkPath
        );

        console.log(
            `Chunk ${chunkIndex} received`
        );

        // Final chunk
        if (
            Number(chunkIndex) + 1 ===
            Number(totalChunks)
        ) {

            const finalPath = path.join(
                downloadPath,
                fileName
            );

            const writeStream =
                fs.createWriteStream(finalPath);

            for (let i = 0; i < Number(totalChunks); i++) {

                const currentChunk =
                    path.join(
                        chunkDir,
                        `chunk-${i}`
                    );

                const data =
                    fs.readFileSync(
                        currentChunk
                    );

                writeStream.write(data);

                fs.unlinkSync(
                    currentChunk
                );
            }

            writeStream.end();

            fs.rmdirSync(chunkDir);

            console.log(
                "File merged"
            );
        }

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
}
);

export default router