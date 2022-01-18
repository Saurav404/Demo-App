const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Post = require('../models/post')
const User = require('../models/user')


router.post("/posts", auth, async (req, res) => {
    const post = new Post({
        ...req.body,
        owner: req.user._id
    })
    try {
        await post.save()
        res.status(201).send(post)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.get('/posts/view/:id', auth, async (req, res) => {
    try {
        const Id = req.params.id
        const posts = await Post.find({})
        const check = req.user.connections.some(item => item.toString() === req.params.id.toString())
        const user  = await User.findById(Id)
        if(user.privacy !== 'Public' && check === false){
            res.status(400).send({Error:'You cannot view the posts'})
        }else if(user.privacy === 'Public' || check === true){
            const checkPost =  posts.filter(item => item.owner.toString()=== Id.toString())
            res.send(checkPost)
        }
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/posts/me', auth, async (req, res) => {
    try {
        const me = req.user._id
        const posts = await Post.find({})
        const myPost = posts.filter(item => item.owner.toString() === me.toString())
        res.send(myPost)
    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/posts/like/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)
        const postUser = await User.findById(post.owner)
        const checkId = post.likes.some(item => item.like.toString() === req.user._id.toString())
        if (checkId === true) {
            res.status(404).send({ Error: 'You have already liked the photo' })
        }
        else {
            if (post.owner.toString() === req.user._id.toString()) {
                const like = req.user._id
                post.likes = post.likes.concat({ like })
                await post.save()
                res.send(post)
            }
            else {
                const checkUser = req.user.connections.some(item => item.toString() === post.owner.toString())
                if (postUser.privacy !== 'Public' && checkUser == false) {
                    return res.status(400).send({ Error: 'The profile is private' })
                } else if (postUser.privacy === 'Public' || checkUser == true) {
                    const like = req.user._id
                    post.likes = post.likes.concat({ like })
                    await post.save()
                    res.send(post)
                }
            }

        }
    } catch (e) {
        res.status(500).send(e)
    }

})

router.post('/posts/comment/:id', auth, async (req, res) => {
    try {
        const comment = req.body.comment
        const commentUserId = req.user._id
        const postId = req.params.id
        const post = await Post.findById(postId)

        const postUser = await User.findById(post.owner)
        const check = req.user.connections.some(item => item.toString() === post.owner.toString())
        if (postUser.privacy !== 'Public' && check == false) {
            return res.status(400).send({ Error: 'The profile is private' })
        } else if (postUser.privacy === 'Public' || check == true) {

            post.comments = post.comments.concat({ comment, commentUserId })
            await post.save()
            res.send(post)
        }
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/posts/update/:id', auth, async (req, res) => {
    const postId = req.params.id
    const postUser = await Post.findById(postId)
    const owner = postUser.owner
    if (owner.toString() != req.user._id.toString()) {
        return res.status(404).send({ Error: 'You cannot update this post' })
    }
    const updates = Object.keys(req.body)
    const allowedUpdates = ['image', 'text']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update' })
    }
    try {
        updates.forEach(update => postUser[update] = req.body[update])
        await postUser.save()
        res.send(postUser)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/posts/delete/:id', auth, async (req, res) => {
    const postId = req.params.id
    const postUser = await Post.findById(postId)
    const owner = postUser.owner
    if (owner.toString() != req.user._id.toString()) {
        return res.status(404).send({ Error: 'You cannot Delete this post' })
    }
    try {
        await postUser.remove()
        res.send({ Message: 'The post has been deleted' })
    } catch (e) {
        res.status(500).send(e)
    }
})



module.exports = router