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

router.get('/posts/view', auth, async (req, res) => {
    try {
        const post = await Post.find({})
        res.send(post)
    } catch (e) {
        res.status(500).send()
    }
})


router.post('/posts/like/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)
        const postUser = await User.findById(post.owner)
        if (postUser.privacy !== 'Public' && (req.user.connections.some(item => item.connection.toString() !== post.owner.toString())) === true){
            return res.status(400).send({Error: 'The profile is private'})
        }
        const like = req.user._id
        post.likes = post.likes.concat({like})
        await post.save()
        res.send(post)
    }catch(e){
        res.status(500).send(e)
    }
    
})

router.post('/posts/comment/:id',auth ,async(req,res)=>{
    try{
        const comment = req.body.comment
        console.log(comment)
        const commentUserId = req.user._id
        const postId = req.params.id
        const post = await Post.findById(postId)
        const postUser = await User.findById(post.owner)
        if (postUser.privacy !== 'Public' || (req.user.connections.some(item => item.connection.toString() !== post.owner.toString())) === true){
            return res.status(400).send({Error: 'The profile is private'})
        }
        post.comments = post.comments.concat({comment , commentUserId})
        await post.save()
        res.send(post)
    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/posts/update/:id',auth, async(req,res)=>{
        const postId =  req.params.id
        const postUser = await Post.findById(postId)
        const owner = postUser.owner
        if(owner.toString() != req.user._id.toString()){
            return res.status(404).send({Error :'You cannot update this post'})
        }
        const updates = Object.keys(req.body)
        const allowedUpdates = ['image','text']
        const isValidOperation = updates.every(update => allowedUpdates.includes(update))
        if(!isValidOperation){
            return res.status(400).send({error: 'Invalid Update'})
        }
    try{
        updates.forEach(update => postUser[update]=req.body[update])
        await postUser.save()
        res.send(postUser)
    }catch(e){
        res.status(500).send(e)
    }
})

router.delete('/posts/delete/:id',auth,async(req,res)=>{
    const postId =  req.params.id
    const postUser = await Post.findById(postId)
    const owner = postUser.owner
    if(owner.toString() != req.user._id.toString()){
        return res.status(404).send({Error :'You cannot Delete this post'})
    }
    try{
        await postUser.remove()
        res.send({Message :'The post has been deleted'})
    }catch(e){
        res.status(500).send(e)
    }
})



module.exports = router