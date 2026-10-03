const express = require("express");
const userauth = express.Router();
const {register,login,logout,adminregister,deleteProfile,softCheck} = require("../controllers/UserAuthent");
const UserMiddleware = require("../middleware/usermiddleware");
const AdminMiddleware = require("../middleware/adminmiddleware")



userauth.post("/register" , register);
userauth.post("/login" , login);
userauth.post("/logout" ,UserMiddleware ,  logout);
// userauth.get("/getprofile" , getprofile);
userauth.post("/admin/register" ,AdminMiddleware ,  adminregister);
userauth.delete("/deleteProfile" ,UserMiddleware ,  deleteProfile);
userauth.get("/check" , softCheck)

module.exports = userauth;