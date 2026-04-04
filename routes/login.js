import express from 'express'
import path from 'path'
const router = express.Router()

router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "pages", "login.html"))
})

export default router