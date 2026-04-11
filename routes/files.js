import express from 'express'
import path from 'node:path'
import Store from 'electron-store'
import fs from 'fs'

const store = new Store();
const router = express.Router()

router.get('/', (req, res) => {
    const ROOT_DIR = store.get("path");

    if (!req.session.loggedIn) {
        res.send("unauthorized access not allowed")
        return
    }
    let relativePath = req.query.path || "";

    // Prevent path traversal(security fix)
    relativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");

    const dirPath = path.join(ROOT_DIR, relativePath);


    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(err);
            return res.send(`<h3>❌ Error reading folder</h3><p>${err.message}</p>`);
        }

        let html = `<h2>📁 File Browser</h2> 
<style>
ul{
    all: unset;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: flex-start;
}
li{
    width: 100px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 10px;
    height: 150px;
}
a {
    all: unset;
}
</style>
<ul>`;

        // Back button
        if (relativePath) {
            const parent = path.dirname(relativePath);
            html += `<li><a href="?path=${parent === '.' ? '' : parent}">⬅ Back</a></li>`;
        }

        files.forEach(file => {
            const filePath = path.join(relativePath, file.name);
            const ext = path.extname(file.name)
            if (file.isDirectory()) {
                html += `<a href="?path=${filePath}"><li><img src="/folder.jfif" alt="folder"><span> ${file.name}</span></li></a>`;
            } else if (['.mkv', '.mp4'].includes(ext)) {
                html += `<a href="./files/video/?file=${filePath}"><li><img src="/videoicon.jpg" alt="folder"><span>${file.name}</span></li></a>`;
            } else if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'].includes(ext)) {
                html += `<a href="./files/image/?file=${filePath}"><li><img src="/image.png" alt="folder"><span>${file.name}</span></li></a>`;
            } else {
                html += `<a href="./files/video/${filePath}"><li><img src="/uknownFile.png" alt="folder"><span>${file.name}</span></li></a>`;
            }
        });

        html += `</ul>`;
        res.send(html);
    });
})


router.get('/video/', (req, res) => {
    if (!req.session.loggedIn) {
        res.send("unauthorized access is not allowed")
        return
    }
    const ROOT_DIR = store.get("path");
    const filePath = path.join(ROOT_DIR, req.query.file);
    const fileName = path.basename(req.query.file)
    const cleanName = fileName.replace(/[\r\n"]/g, "").trim();

    if (!fs.existsSync(filePath)) {
        return res.status(404).send(`File not found ${filePath}`);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

        const chunkSize = (end - start) + 1;
        const stream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
            "Content-Disposition": `inline;filename*=UTF-8''${encodeURIComponent(cleanName)}`
        });

        stream.pipe(res);
    } else {
        res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
            "Content-Disposition": `inline;filename*=UTF-8''${encodeURIComponent(cleanName)}`
        });

        fs.createReadStream(filePath).pipe(res);
    }
});

router.get('/image/', (req, res) => {
    if (!req.session.loggedIn) {
        res.send("unauthorized access is not allowed")
        return
    }
    res.sendFile(path.join(ROOT_DIR, req.query.file));

})
export default router
