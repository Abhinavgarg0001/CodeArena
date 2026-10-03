const {getLanguageById,executeBatch} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const snippet = (s)=>{
    const t = String(s ?? '');
    return JSON.stringify(t.length > 200 ? t.slice(0,200)+'…' : t);
};

const createProblem = async(req,res)=>{

    const{title , description , difficult , tags , visibleTestCases , hiddenTestCases , startCode , referenceCode , problemCreato} = req.body;

    try{

        for(const {language,completeCode} of referenceCode){

            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase)=>({

                source_code:completeCode,
                language,
                stdin:testcase.input,
                expected_output:testcase.output

            }));

            const testResult = await executeBatch(submissions)


            for(let i = 0; i < testResult.length; i++) {

                if(testResult[i].status_id!=3){
                    const errOut = snippet(testResult[i].stderr);
                    return res.status(400).send(
                        `Reference solution (${language}) failed visible test ${i+1}: expected ${snippet(visibleTestCases[i]?.output)}, got ${snippet(testResult[i].stdout)}` +
                        (testResult[i].stderr ? ` | error: ${errOut}` : "")
                    );
                }

            }

        }

        const userProblem = await Problem.create({

            ...req.body,
            problemCreator: req.result._id
        });

        res.status(201).send("problem created succesfully")

    }

    
    catch(err){
        res.status(400).send("error "+err);

    }

    
}

const updateProblem = async(req,res)=>{

    const {id} = req.params ;

    const{title , description , difficult , tags , visibleTestCases , hiddenTestCases , startCode , referenceCode , problemCreato} = req.body;

    try{

        if(!id){
            return res.status(400).send("ID is missing")
        }

        const dsaProblem = await Problem.findById(id);
        if(!dsaProblem){
            return res.status(404).send("ID is not present in server")
        }

        for(const {language,completeCode} of referenceCode){
                 
        
              // source_code:
              // language_id:
              // stdin: 
              // expectedOutput:
        
              const languageId = getLanguageById(language);
                
              // I am creating Batch submission
              const submissions = visibleTestCases.map((testcase)=>({
                  source_code:completeCode,
                  language,
                  stdin: testcase.input,
                  expected_output: testcase.output
              }));
        
        
              const testResult = await executeBatch(submissions);
        
            //  console.log(testResult);
        
             for(let i = 0; i < testResult.length; i++){
              if(testResult[i].status_id!=3){
               const errOut = snippet(testResult[i].stderr);
               return res.status(400).send(
                   `Reference solution (${language}) failed visible test ${i+1}: expected ${snippet(visibleTestCases[i]?.output)}, got ${snippet(testResult[i].stdout)}` +
                   (testResult[i].stderr ? ` | error: ${errOut}` : "")
               );
              }
             }
        
            }
        
        const newProblem = await Problem.findByIdAndUpdate(id , {...req.body} , {runValidators:true, new:true})

        res.status(200).send("problem updated succesfully")

    }

    catch(err){
        res.status(500).send("Error: "+err);
    }


}

const deleteProblem = async(req,res)=>{

    const {id} = req.params;

    try{

        if(!id){
            return res.status(400).send("ID is missing")
        }

        const deletedProblem = await Problem.findByIdAndDelete(id)

        if(!deletedProblem){
            return res.status(404).send("Problem is missing")
        }

        res.status(200).send("Successfully deleted")

    }

    catch(err){
        res.status(500).send("Error: "+err);
    }
}

const getProblemById = async(req,res)=>{

    const {id} = req.params;

    try{

        if(!id){
            return res.status(400).send("ID is missing")
        }

        const getProblem = await Problem.findById(id).select("_id title description difficult tags visibleTestCases startCode referenceCode")

        if(!getProblem){
            return res.status(404).send("Problem is missing")
        }

        res.status(200).send(getProblem)

    }        

    

    catch(err){
        res.status(500).send("Error: "+err);
    }

}

const getAllProblem = async(req,res)=>{

    try{

        const getProblem = await Problem.find({}).select("_id title description difficult tags");

        if(getProblem.length==0)
            return res.status(200).send([]);


        res.status(200).send(getProblem);

    }

    catch(err){
        res.status(500).send("Error: "+err);
    }


}

const solvedAllProblembyUser = async(req,res)=>{

    try{
        
        const user = await User.findById(req.result._id).populate({
            path:"problemsolved",
            select:"_id title difficult tags"
        })




        res.status(201).send(user.problemsolved)

    }
    catch(err){
        res.status(400).send("error"+ err)
    }
}

const submittedProblem = async(req,res)=>{

    try{
        
        const userId = req.result._id;
        const problemId = req.params.pid;

        const ans = await Submission.find({userId , problemId}).sort({createdAt:-1})

        if(ans.length == 0){
            return res.status(200).send("No Submission is Present")
        }

        return res.status(200).send(ans);
    }

    catch(err){
        res.status(500).send("Internal Server Error "+err)
    }

}

// All submissions of the logged-in user (for the Submissions page)
const mySubmissions = async(req,res)=>{

    try{

        const ans = await Submission.find({userId: req.result._id})
            .populate({path:"problemId", select:"_id title difficult tags"})
            .sort({createdAt:-1})

        return res.status(200).send(ans);
    }

    catch(err){
        res.status(500).send("Internal Server Error "+err)
    }

}
// Single submission of the logged-in user (for the detail page)
const getSubmissionById = async(req,res)=>{

    try{

        const sub = await Submission.findOne({_id: req.params.id, userId: req.result._id})
            .populate({path:"problemId", select:"_id title difficult tags"})

        if(!sub){
            return res.status(404).send("Submission not found");
        }

        return res.status(200).send(sub);
    }

    catch(err){
        res.status(500).send("Internal Server Error "+err)
    }

}
module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem,mySubmissions,getSubmissionById};

