const User = require("../models/user");
const validate = require("../utils/validator"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const Submission = require("../models/submission");

const register = async(req,res)=>{

    try{

        validate(req.body)

        const {firstname , emailID , password} = req.body;

        req.body.password = await bcrypt.hash(password , 10);

        req.body.role = "user";

        const user = await User.create(req.body)

        const ans = {
            firstname:user.firstname,
            emailID:user.emailID,
            _id:user._id,
            role:user.role
        }

        const token = jwt.sign({_id:user._id , emailID:user.emailID , role:"user"} , process.env.SECRET_KEY ,{expiresIn:60*60*12});

        res.cookie("token",token,{maxAge:60*60*12*1000});

        res.status(201).json({
            user:ans,
            meesage:"user registered succesfully"
        })


    }

    catch(err){
        res.status(400).send("Error  "+err);
    }
}


const login = async(req,res)=>{

    try{

        const {emailID , password} = req.body;

        if(!emailID){
            throw new Error("Invalid Crendentials"); 
        }
        if(!password){
            throw new Error("Invalid Crendentials");
        }

        const user = await User.findOne({emailID:emailID})

        if(!user){
            throw new Error ("Invalid Credentials")
        }

        const match = await bcrypt.compare(password,user.password);

        if(!match){
            throw new Error("Invalid Credentials")
        }

        const ans = {
            firstname:user.firstname,
            emailID:user.emailID,
            _id:user._id,
            role:user.role
        }


        const token = jwt.sign({_id:user._id , emailID:emailID , role:user.role} , process.env.SECRET_KEY ,{expiresIn:60*60*12});

        res.cookie("token",token,{maxAge:60*60*12*1000});

        res.status(201).json({
            user:ans,
            meesage:"user login succesfully"
        })

    }
    catch(err){
        res.status(503).send("Error "+err);
    }
}


const logout = async(req,res)=>{

    try{

        const {token} = req.cookies;

        const payload = jwt.decode(token)

        await redisClient.set(`token:${token}` , "blocked");

        await redisClient.expireAt(`token:${token}` , payload.exp);
        
        res.cookie("token" , null , {expires: new Date(Date.now())});

        res.send("logout sucessfully")



    }

    catch(err){
        res.send("Error "+err)
    }
}

const adminregister = async(req,res)=>{

    try{

        validate(req.body)

        const {firstname , emailID , password} = req.body;

        req.body.password = await bcrypt.hash(password , 10);

        req.body.role = "admin";

        const user = await User.create(req.body)

        const token = jwt.sign({_id:user._id , emailID:emailID , role:"user"} , process.env.SECRET_KEY ,{expiresIn:60*60*12});

        res.cookie("token",token,{maxAge:60*60*12*1000});

        res.status(201).send("Admin registered sucessfully");


    }

    catch(err){
        res.status(400).send("Error "+err);
    }

}

const deleteProfile = async(req,res)=>{
 

    try{

    const userId = req.result._id

    const {password} = req.body || {};

    if(!password){
        return res.status(400).send("Password is required to delete your account");
    }

    const match = await bcrypt.compare(password, req.result.password);

    if(!match){
        return res.status(401).send("Incorrect password");
    }
    
    await User.findByIdAndDelete(userId)

    await Submission.deleteMany({userId})
    
    res.status(200).send("profile deleted succesfully")

    }

    catch(err){
        res.status(500).send("internal server error"+err)
    }
}

const check = async(req,res)=>{
    
    try{
        const ans = {
            firstname:req.result.firstname,
            emailID:req.result.emailID,
            _id:req.result._id,
            role:req.result.role
        }

        res.status(200).json({
            user:ans,
            message:"valid user"
        })
   } 

   catch(err){
    res.status(500).send("inter server error")
   }

}

// Soft check: never returns 401, so the browser doesn't log
// "GET /auth/check 401 (Unauthorized)" for logged-out visitors.
// Returns 200 with { user: null } instead.
const softCheck = async(req,res)=>{

    try{
        const {token} = req.cookies;

        if(!token){
            return res.status(200).json({user:null});
        }

        const payload = jwt.verify(token , process.env.SECRET_KEY);

        if(!payload || !payload._id){
            return res.status(200).json({user:null});
        }

        const user = await User.findById(payload._id);

        if(!user){
            return res.status(200).json({user:null});
        }

        const isBlocked = await redisClient.exists(`token:${token}`);

        if(isBlocked){
            return res.status(200).json({user:null});
        }

        return res.status(200).json({
            user:{
                firstname:user.firstname,
                emailID:user.emailID,
                _id:user._id,
                role:user.role
            },
            message:"valid user"
        });
    }
    catch(err){
        return res.status(200).json({user:null});
    }
}
module.exports = {register , login , logout ,adminregister, deleteProfile,check,softCheck};

