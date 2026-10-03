const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, executeBatch } = require("../utils/problemUtility");

const submitCode = async(req,res)=>{

    try{

        const userId = req.result._id;
        const problemId = req.params.id;

        const{language , code} = req.body

        if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");

        const problem = await Problem.findById(problemId)

        if(!problem)
        return res.status(404).send("Problem not found");

        const submittedResult = await Submission.create({

            userId,
            problemId,
            code,
            language,
            status:"pending",
            testCasesTotal:problem.hiddenTestCases.length

        })

        const languageId = getLanguageById(language);

        if(!languageId)
        return res.status(400).send("Unsupported language");

        const submissions = problem.hiddenTestCases.map((testcase)=>({
                 source_code:code,
                 language,
                 stdin: testcase.input,
                 expected_output: testcase.output
             }));
         
         
        const testResult = await executeBatch(submissions);
             
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;         

        for (const test of testResult){

            if(test.status_id == 3){
               testCasesPassed++;
               runtime = runtime+(parseFloat(test.time)||0);
               memory = Math.max(memory , test.memory);
            }
           else{
                if(test.status_id == 4){
                    status = "error"
                    errorMessage = test.stderr
                }
                else{
                    status = "wrong"
                    errorMessage = test.stderr
                }
            }
        }


        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;

        await submittedResult.save()

        if(status === 'accepted'){
            // $addToSet: never store the same problem twice, no duplicates ever
            await User.updateOne({_id: req.result._id}, {$addToSet: {problemsolved: problemId}});
        }

        res.status(201).send("submission sucessfully")



    }

    catch(err){
        res.status(500).send("Internal server error"+ err)
    }
}


const runCode = async(req,res)=>{

    try{

        const userId = req.result._id;
        const problemId = req.params.id;

        const{language , code} = req.body

        if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");

        const problem = await Problem.findById(problemId)

        if(!problem)
        return res.status(404).send("Problem not found");

        const languageId = getLanguageById(language);

        if(!languageId)
        return res.status(400).send("Unsupported language");

        const submissions = problem.visibleTestCases.map((testcase)=>({
                 source_code:code,
                 language,
                 stdin: testcase.input,
                 expected_output: testcase.output
             }));
         
         
        const testResult = await executeBatch(submissions);
             
        res.status(201).send(testResult)



    }

    catch(err){
        res.status(500).send("Internal server error"+ err)
    }
}




module.exports  =  {submitCode,runCode}; 