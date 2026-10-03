const express = require("express");
const app = express();
require('dotenv').config();
const cookieparser = require("cookie-parser");
const userauth = require("./routes/UserAuth");
const redisClient = require("./config/redis");
const main = require("./config/db");
const problemRouter = require("./routes/ProbemCreator");
const submitRouter = require("./routes/submit");
const cors = require("cors")

app.use(cors({
    origin:["http://localhost:5173","http://localhost:5174"],
    credentials:true
}))
app.use(express.json());
app.use(cookieparser());


app.use("/auth" , userauth)
app.use("/problem" , problemRouter)
app.use("/code" ,submitRouter )

const InitializeConnection = async()=>{

    try{

        await Promise.all([main() , redisClient.connect()])
        console.log("DB Connected");

        app.listen(process.env.PORT , ()=>{
            console.log("listening at port number"+ process.env.PORT)
        })         
        
    }

    catch(err){
        throw new Error("Error "+err)
    }
}

InitializeConnection();
