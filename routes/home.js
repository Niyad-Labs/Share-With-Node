import express from 'express'
import { app } from 'electron';
import path from 'node:path'


const router = express.Router()

router.get('/', (req, res) => {
    if (req.session.loggedIn) {
        const isDev = !app.isPackaged;
        const basePath = isDev ? path.join(process.cwd(), "public") : path.join(process.resourcesPath, "public")
        res.sendFile(path.join(basePath, "pages", "home.html"))
        return
    }
    return res.redirect('/')

})

export default router
