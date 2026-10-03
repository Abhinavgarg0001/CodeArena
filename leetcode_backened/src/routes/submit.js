const express = require("express");
const UserMiddleware = require("../middleware/usermiddleware");
const {submitCode,runCode} = require("../controllers/UserSubmission");
const submitCodeRateLimiter = require("../middleware/ratelimiter");

const submitRouter = express.Router();




submitRouter.post("/submit/:id" , UserMiddleware ,submitCodeRateLimiter, submitCode)
submitRouter.post("/run/:id" , UserMiddleware , runCode)

module.exports = submitRouter;