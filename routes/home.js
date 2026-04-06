import express from 'express'
import path from 'node:path'


const router = express.Router()

router.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(process.cwd(), "public", "pages", "home.html"))
        return
    }
    return res.redirect('/')

})

export default router
