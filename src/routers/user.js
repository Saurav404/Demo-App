const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')

router.post("/users", async (req, res) => {
    const user = new User(req.body)
    try {
        const token = await user.generateAuthToken()
        await user.save()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})



router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ Update: 'You are successfully logout' })
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})



router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const updatesToBeDone = ['name', 'password', 'email']
    const isValidOperation = updates.every((update) => updatesToBeDone.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update' })
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/users/profile/public', auth, async (req, res) => {
    try {
        if (!req.user.privacy == 'private') {
            return res.status(404).send()
        }
        req.user.privacy = 'public'
        await req.user.save()
        res.send({ message: "set to public" })
    } catch (e) {
        res.status(400).send()
    }
})


router.patch('/users/profile/private', auth, async (req, res) => {
    try {
        if (!req.user.privacy == 'public') {
            return res.status(404).send()
        }
        req.user.privacy = 'private'
        await req.user.save()
        res.send({ message: "set to private" })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/:id/send',auth, async(req,res)=>{
    const id =  req.params.id
    try{
        
        const user = await User.findById(id)
        request = req.user.id
        user.requests = user.requests.concat({request})
        await user.save()
        res.send(user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/accept/:id',auth,async(req,res)=>{
    const id =  req.params.id
    try {
        const me = req.user
        const user = await User.findById(id)
        connection = user._id
        me.connections = me.connections.concat({connection})
        me.requests = me.requests.filter((request) => {
            return request.request.toString() !== id
        })
        await me.save()
        res.send(me)
    } catch (e) {
        res.status(500).send()
    }
 })

 router.delete('/users/remove/connection/:id',auth,async(req,res)=>{
    id = req.params.id
    try{
        const me = req.user
        me.connections = me.connections.filter((connection) => {
            return  connection.connection.toString() !== id
        })
        await me.save()
        res.send(me)
    }catch(e){
        res.status(400).send()
    }
 })


module.exports = router