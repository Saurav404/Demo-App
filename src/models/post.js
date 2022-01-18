const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true
    },
    picture: {
        type: String
    },
    likes: [{
        like: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
    }],
    comments: [{
        comment: {
            type: String,
            default: null
        },
        commentUserId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})
postSchema.methods.toJSON = function () {
    const post = this
    const postObject = post.toObject()
    return postObject
}
const Post = mongoose.model('Post', postSchema)

module.exports = Post