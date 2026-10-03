const validator = require("validator");

const validate = (data)=>{

    const mandatoryfield = ["firstname" , 'emailID', "password"]

    const isAllowed = mandatoryfield.every((k)=> Object.keys(data).includes(k))

    if(!isAllowed)
        throw new Error("some field are missing");
    if(!validator.isEmail(data.emailID))
        throw new Error("Invalid Email");
    if(!validator.isStrongPassword(data.password))
        throw new Error("weak password");
}

module.exports = validate;