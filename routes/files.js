import express from 'express'
import path from 'node:path'

const router = express.Router()

router.get('/', (req, res) => {
    let relativePath = req.query.path || "";

    // Prevent path traversal(security fix)
    relativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");

    const dirPath = path.join(ROOT_DIR, relativePath);

    console.log("Opening folder:", dirPath);

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
            html += `<li><a href="/?path=${parent === '.' ? '' : parent}">⬅ Back</a></li>`;
        }

        files.forEach(file => {
            const filePath = path.join(relativePath, file.name);
            const ext = path.extname(file.name)
            if (file.isDirectory()) {
                html += `<a href="/?path=${filePath}"><li><img src="/folder.jfif" alt="folder"><span> ${file.name}</span></li></a>`;
            } else if (['.mkv', '.mp4'].includes(ext)) {
                html += `<a href="/video?file=${filePath}"><li><img src="/videoicon.jpg" alt="folder"><span>${file.name}</span></li></a>`;
            } else {
                html += `<a href="/video?file=${filePath}"><li><img src="/uknownFile.png" alt="folder"><span>${file.name}</span></li></a>`;
            }
        });

        html += `</ul>`;
        res.send(html);
    });
})

export default router
