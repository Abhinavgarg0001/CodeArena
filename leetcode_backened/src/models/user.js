const mongoose = require("mongoose");
const {Schema} = mongoose;

const UserSchema = new Schema({

    firstname:{
        type:String,
        required:true,
        minLength:3,
        maxLengtf:10,
    },

    lastname:{
        type:String,
        minLength:3,
        maxLength:10
    },

    emailID:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        immutable:true
    },

    age:{
        type:Number,
        min:10,
        max:80,
    },

    role:{
        type:String,
        enum:['user' , 'admin'],
        default:'user'
    },

    problemsolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:"problem"
        }],
        default:[]
    },

    password:{
        type:String
    }

   
} , {
    timestamps:true
});


const User = mongoose.model("user" , UserSchema);

module.exports = User;