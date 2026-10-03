const axios = require("axios")

// Which code runner to use:
//   "wandbox" (default: free, no key needed, supports C++/Java/JavaScript)
//   "judge0"  (needs a subscribed RAPIDAPI_KEY)
// Set CODE_EXECUTOR=judge0 in .env to switch back to Judge0.
const EXECUTOR = String(process.env.CODE_EXECUTOR || 'wandbox').toLowerCase();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'ab99c6ec42mshfd636ec7c6687efp1b9043jsna684835b0591';
const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
const WANDBOX_LIST_URL = 'https://wandbox.org/api/list.json';


const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "cpp":54,
        "java":62,
        "javascript":63
    }

    return language[String(lang || '').toLowerCase()];

}

const normalizeOutput = (s)=> String(s ?? '').replace(/\r\n?/g, '\n').trimEnd();

const sleep = (ms)=> new Promise((resolve)=> setTimeout(resolve, ms));

// Run at most `limit` promises at a time (be polite to the free service)
async function mapPool(items, limit, fn){
    const out = new Array(items.length);
    let next = 0;
    async function worker(){
        while(next < items.length){
            const idx = next++;
            out[idx] = await fn(items[idx], idx);
        }
    }
    const workers = Array.from({length: Math.min(limit, items.length)}, ()=> worker());
    await Promise.all(workers);
    return out;
}

// ---- Wandbox (free, no key) ----

// Pinned compilers (verified working); refreshed from list.json when possible.
const PINNED_COMPILERS = {
    cpp: "gcc-head",
    java: "openjdk-jdk-21+35",
    javascript: "nodejs-20.17.0"
};

let compilerCache = null;
let compilerCacheAt = 0;

async function resolveCompiler(lang){
    const key = String(lang || '').toLowerCase();
    const now = Date.now();
    try {
        if(!compilerCache || (now - compilerCacheAt) > 1000*60*60){
            const { data } = await axios.get(WANDBOX_LIST_URL, { timeout: 15000 });
            if(Array.isArray(data)){
                compilerCache = data;
                compilerCacheAt = now;
            }
        }
    } catch (e) {
        // fall through to pinned names
    }
    if(compilerCache){
        const wantLang = key === 'cpp' || key === 'c++' ? 'C++' : (key === 'java' ? 'Java' : 'JavaScript');
        if(key === 'cpp' || key === 'c++'){
            const gcc = compilerCache.find((c)=> c.name === 'gcc-head');
            if(gcc) return gcc.name;
        }
        const match = compilerCache.find((c)=> c.language === wantLang);
        if(match) return match.name;
    }
    return PINNED_COMPILERS[key] || PINNED_COMPILERS.cpp;
}

// Judge0 compiles Java as Main.java, so `public class Main` is common in
// stored solutions. Wandbox compiles as prog.java, where a public Main is
// illegal — drop the modifier (same program, runs identically).
function adaptCodeForWandbox(code, lang){
    if(String(lang || '').toLowerCase() === 'java'){
        return String(code).replace(/public\s+class\s+Main\b/, 'class Main');
    }
    return code;
}

async function wandboxOne({ source_code, language, stdin, expected_output }){
    const compiler = await resolveCompiler(language);
    const started = Date.now();

    let data;
    try {
        const res = await axios.post(WANDBOX_URL, {
            compiler,
            code: adaptCodeForWandbox(source_code, language),
            stdin: stdin || ""
        }, { timeout: 120000 });
        data = res.data || {};
    } catch (error) {
        const detail = error.response?.data
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : error.message;
        throw new Error("Code runner request failed: " + detail);
    }
    const elapsed = ((Date.now() - started) / 1000).toFixed(3);

    const base = {
        stdout: data.program_message || "",
        stderr: data.program_error || "",
        time: elapsed,
        memory: 0
    };

    // Compile failure -> status 4 (treated as "error" by callers)
    if(data.compiler_error){
        return {
            ...base,
            status_id: 4,
            stdout: "",
            stderr: [data.compiler_output, data.compiler_error].filter(Boolean).join("\n")
        };
    }

    // Non-zero status (exit code / signal) -> runtime error -> status 4
    if(String(data.status) !== "0"){
        return {
            ...base,
            status_id: 4,
            stderr: data.program_error || ("Program exited with status " + data.status)
        };
    }

    // Correct output -> accepted (status 3)
    if(normalizeOutput(data.program_message) === normalizeOutput(expected_output)){
        return { ...base, status_id: 3 };
    }

    // Ran fine but output differs -> wrong answer (status 5)
    return { ...base, status_id: 5 };
}

async function wandboxBatch(submissions){
    return mapPool(submissions, 3, (s)=> wandboxOne(s));
}

// ---- Judge0 fallback (needs RAPIDAPI_KEY subscription) ----

const judge0Batch = async (submissions)=>{

    const options = {
      method: 'POST',
      url: `https://${RAPIDAPI_HOST}/submissions/batch`,
      params: { base64_encoded: 'false' },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      },
      data: {
        submissions: submissions.map((s)=>({
          source_code: s.source_code,
          language_id: s.language_id || getLanguageById(s.language),
          stdin: s.stdin,
          expected_output: s.expected_output
        }))
      }
    };

    let submitResult;
    try {
        const response = await axios.request(options);
        if(!response.data){
            throw new Error("Empty response from code runner");
        }
        submitResult = response.data;
    } catch (error) {
        const detail = error.response?.data
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : error.message;
        throw new Error("Code runner request failed: " + detail);
    }

    const resultToken = submitResult.map((value)=> value.token);

    const getOptions = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}/submissions/batch`,
      params: {
        tokens: resultToken.join(","),
        base64_encoded: 'false',
        fields: '*'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };

    const MAX_ATTEMPTS = 30;
    for(let attempt = 0; attempt < MAX_ATTEMPTS; attempt++){
      let result;
      try {
        const response = await axios.request(getOptions);
        if(!response.data || !Array.isArray(response.data.submissions)){
            throw new Error("Unexpected response from code runner");
        }
        result = response.data;
      } catch (error) {
        const detail = error.response?.data
            ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
            : error.message;
        throw new Error("Code runner request failed: " + detail);
      }

      if(result.submissions.every((k)=>k.status_id>2)){
        return result.submissions;
      }

      await sleep(1000);
    }

    throw new Error("Code runner timed out waiting for results");
}

// Runs every submission ({source_code, language, stdin, expected_output})
// and returns Judge0-shaped results [{status_id, stdout, stderr, time, memory}].
// status_id: 3 = accepted, 4 = error, anything else = wrong answer.
const executeBatch = async (submissions)=>{
    if(EXECUTOR === 'judge0'){
        return judge0Batch(submissions);
    }
    return wandboxBatch(submissions);
}


module.exports = {getLanguageById, executeBatch};