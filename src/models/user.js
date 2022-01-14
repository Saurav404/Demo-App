const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Post = require('./post')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    email:{
        type:String,
        unique:true,
        require: true,
        trim:true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength: 7 ,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Please type a different password')
            }
        }
    },
    privacy:{
        type:String,
        default:'Private',
        required:true
    },
    requests:[{
        request:{
        type:mongoose.Schema.Types.ObjectId,
        default:null
        }
    }],
    connections:[{
        connection:{
        type:mongoose.Schema.Types.ObjectId,
        default:null
        }
    }],
   
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})


userSchema.virtual('posts',{
    ref:'Post',
    localField:'_id',
    foreignField:'Owner'
})



userSchema.methods.toJSON= function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    // delete userObject._id
    delete userObject.__v
    return userObject
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()}, 'Thisismydemoapp')
    user.tokens =user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async(email,password)=>{
    const user = await User.findOne({email})
    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

userSchema.pre('save',async function(next){
    const user=this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

userSchema.pre('remove',async function(next){
    const user = this
    await Post.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User' , userSchema)

module.exports= User