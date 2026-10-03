const express = require("express");
const adminMiddleware = require("../middleware/adminmiddleware");
const userMiddleware = require("../middleware/usermiddleware");

const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem,mySubmissions,getSubmissionById} = require("../controllers/userProblem");

const problemRouter =  express.Router();

problemRouter.post("/create",adminMiddleware,createProblem);
problemRouter.put("/update/:id",adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);


problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get("/problemSolvedByUser",userMiddleware, solvedAllProblembyUser);
problemRouter.get("/mySubmissions",userMiddleware, mySubmissions);
problemRouter.get("/submission/:id",userMiddleware, getSubmissionById);
problemRouter.get("/problemSolved/:pid" , userMiddleware , submittedProblem)


module.exports = problemRouter;


