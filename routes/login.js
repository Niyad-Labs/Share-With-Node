import express from 'express'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import Store from 'electron-store'
import { sendToRenderer } from '../src/main'
import { app } from 'electron';


const router = express.Router()
const store = new Store();
let count = 0

router.get('/', (req, res) => {
    const isDev = !app.isPackaged;
    const basePath = isDev ? path.join(process.cwd(), "public") : path.join(process.resourcesPath, "public")

    res.sendFile(path.join(basePath, "pages", "login.html"))
})

router.post('/', (req, res) => {
    const { password } = req.body


    const storedHash = store.get("password")

    bcrypt.compare(password, storedHash, (err, isMatch) => {
        if (err) {
            console.log(err);
        } else if (isMatch) {
            if (!req.session.user) {
                req.session.user = `connecton-${++count}`
                sendToRenderer("connected-user", req.session.user)
            }
            req.session.loggedIn = true
            res.redirect(`./home`)
        } else {
            res.send("wrong password")
        }
    })

})
export default router

