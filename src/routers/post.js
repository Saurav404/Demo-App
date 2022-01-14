const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Post = require('../models/post')
const multer = require('multer')


router.post("/posts",auth, async (req, res) => {
    const post = new Post({
        owner : req.user._id
    })
    try {
        await post.save()
        res.status(201).send(post)
    } catch (e) {
        res.status(400).send(e)
    }

})


module.exports = router