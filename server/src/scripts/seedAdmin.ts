import 'dotenv/config'
import { connectDB , disconnectDB } from '../config/db.js'
import { User } from "../models/User.js"

const run = async () => {
    const email = process.argv[2];
    if(!email){
        console.error("Usage : npm run seed : admin ---<email>")
        process.exit(1)
    }

    await connectDB()

    const user = await User.findOneAndUpdate(
        {email : email.toLowerCase()},
        { role  : "ADMIN"},
        { new : true},

    );

    if(!user){
        console.error(`No user found with email ${email} -- sign up first, then run this.`)
    }else {
        console.log(`${user.email} is now ADMIN`)
    }

    await disconnectDB();
    process.exit(0)

}

run()