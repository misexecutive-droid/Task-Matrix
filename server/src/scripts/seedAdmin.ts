// Loads variables from a .env file (like the database connection string)
// into process.env before anything else runs, so connectDB() below can use
// them.
import 'dotenv/config'
// connectDB opens a connection to MongoDB; disconnectDB cleanly closes it.
// We need both because this is a short-lived script, not a long-running
// server - it should open the connection, do its work, then close the
// connection and exit.
import { connectDB , disconnectDB } from '../config/db.js'
// The User model lets us read/write documents in the "users" collection.
import { User } from "../models/User.js"

// This whole file is a one-off command-line script (run like:
// `npm run seed:admin -- someone@example.com`). It exists because public
// signup was removed from the app, so there's no normal way to create the
// very first ADMIN account through the UI. Instead, someone with server/DB
// access runs this script once to "promote" an already-registered user to
// ADMIN.
const run = async () => {
    // process.argv is the list of command-line arguments. argv[0] is the
    // node executable, argv[1] is this script's path, and argv[2] is the
    // first real argument the user typed - in this case, the email address
    // of the user we want to promote to ADMIN.
    const email = process.argv[2];
    // If no email was given on the command line, we can't do anything -
    // print a usage hint and stop the script (exit code 1 signals an error).
    if(!email){
        // note: this usage message has a typo/odd spacing ("seed : admin
        // ---<email>") - the real command is `npm run seed:admin -- <email>`.
        // Leaving it as-is since it's just a log message, not logic.
        console.error("Usage : npm run seed : admin ---<email>")
        process.exit(1)
    }

    // Open the connection to the database before trying to query it.
    await connectDB()

    // Look up the user by email (lower-cased, so the lookup isn't case
    // sensitive - "Foo@Bar.com" and "foo@bar.com" match the same account),
    // and update their role field to "ADMIN" in the same operation.
    // { new: true } tells Mongoose to return the *updated* document instead
    // of the one from before the update, so `user` below reflects the change.
    const user = await User.findOneAndUpdate(
        {email : email.toLowerCase()},
        { role  : "ADMIN"},
        { new : true},

    );

    // findOneAndUpdate returns null if no user matched that email - handle
    // that case so we don't crash trying to read properties off of null.
    if(!user){
        // Tell the operator that no matching account exists - they need to
        // sign up (or otherwise be created) as a normal user first, since
        // this script only promotes an *existing* user, it doesn't create
        // new ones.
        console.error(`No user found with email ${email} -- sign up first, then run this.`)
    }else {
        // Success - confirm which account is now an admin.
        console.log(`${user.email} is now ADMIN`)
    }

    // Close the database connection cleanly before the script ends, so we
    // don't leave a dangling connection open.
    await disconnectDB();
    // Exit with code 0 (success) so the npm script/terminal knows this
    // finished normally, whether or not a user was found above.
    process.exit(0)

}

// Actually kick off the script. Nothing above runs until this call, since
// `run` is just defined as a function until here.
run()
