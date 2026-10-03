const mongoose =  require("mongoose");

async function main() {
    await mongoose.connect(process.env.DB_STRING)

    // One-time cleanup: older schema versions created a UNIQUE index on the
    // problemsolved array, which rejects the same problem id twice
    // (E11000 duplicate key). The schema no longer declares it, so drop it.
    try {
        await mongoose.connection.collection("users").dropIndex("problemsolved_1");
        console.log("Dropped legacy problemsolved_1 index");
    } catch (e) {
        // IndexNotFound (code 27) or missing collection on first boot — safe to ignore
        if(e?.code !== 27){
            console.log("Index cleanup skipped: " + e.message);
        }
    }
}

module.exports=  main;