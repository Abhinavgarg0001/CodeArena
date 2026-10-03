const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");


const UserMiddleware = async(req,res,next)=>{
    
    try{

        const {token} = req.cookies;

        if(!token){
            throw new Error("Token is not present")
        }

        const payload = jwt.verify(token , process.env.SECRET_KEY)

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token")
        }

        const user = await User.findById(_id)

        if(!user){
            throw new Error("Invalid token")
        }

        const isBlocked = await redisClient.exists(`token:${token}`)
        
        if(isBlocked){
            throw new Error("Invalid token")
        }

        req.result = user

        next();



    }

    catch(err){
        res.status(401).send("Error "+err)
    }
}

module.exports = UserMiddleware;