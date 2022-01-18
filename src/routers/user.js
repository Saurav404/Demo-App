const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const { connections } = require('mongoose')

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
        res.status(400).send({Error : 'No such User found'})
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


router.get('/users/connections', auth, async (req, res) => {
    const user = req.user
    const connections = user.connections
    res.send(connections)
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
        if (!req.user.privacy == 'Private') {
            return res.status(404).send()
        }
        req.user.privacy = 'Public'
        await req.user.save()
        res.send({ message: "set to public" })
    } catch (e) {
        res.status(400).send()
    }
})


router.patch('/users/profile/private', auth, async (req, res) => {
    try {
        if (!req.user.privacy == 'Public') {
            return res.status(404).send()
        }
        req.user.privacy = 'Private'
        await req.user.save()
        res.send({ message: "set to private" })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/send/:id', auth, async (req, res) => {
    const id = req.params.id
    try {

        const user = await User.findById(id)
        if (id.toString() === req.user._id.toString()) {
            res.status(404).send({ Errpr: 'You cannot send request to yourself' })
        } else {
            const check = req.user.connections.some(item => item.toString() === user._id.toString())
            if (check == true) {
                res.status(404).send({ Error: 'You are already in connection with this person' })
            } else {
                user.connections = user.connections.concat(req.user._id)
                req.user.connections = req.user.connections.concat(user._id)
                await user.save()
                await req.user.save()
                res.send(req.user)
            }
        }


    } catch (e) {
        res.status(400).send({Error : 'No such Id found'})
    }
})



router.delete('/users/remove/connection/:id', auth, async (req, res) => {
    id = req.params.id
    try {
        const user = await User.findById(id)
        const me = req.user
        if(me.connections.some(item => item.toString()===id)){
            me.connections = me.connections.filter((connection) => connection.toString() !== id)
            user.connections = user.connections.filter((connection)=> connection.toString() !== me._id.toString())
        }else{
            res.status(404).send({Error: 'No such user to delete'})
        }
        await me.save()
        await user.save()
        res.send(me)
    } catch (e) {
        res.status(400).send()
    }
})


module.exports = router