const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true
    },
    picture:{
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post