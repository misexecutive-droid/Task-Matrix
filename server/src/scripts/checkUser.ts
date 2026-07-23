// One-off diagnostic script (run like: `npx tsx src/scripts/checkUser.ts someone@example.com`).
// Read-only — reports whether an account exists for the given email and whether it's active,
// without ever printing the password hash. Used to distinguish "no such account" / "deactivated"
// from "wrong password" when a login is failing with the generic "Invalid credentials" message.
import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import { User } from '../models/User.js'

const run = async () => {
    const rawEmail = process.argv[2];
    if (!rawEmail) {
        console.error('Usage: npx tsx src/scripts/checkUser.ts <email>');
        process.exit(1);
    }

    const email = rawEmail.trim().toLowerCase();

    await connectDB();

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
        console.log(`No account found for "${email}".`);
    } else {
        console.log('Account found:');
        console.log(`  email:      ${user.email}`);
        console.log(`  role:       ${user.role}`);
        console.log(`  isActive:   ${user.isActive}`);
        console.log(`  hasPassword: ${!!user.passwordHash}`);
        console.log(`  createdAt:  ${(user as any).createdAt}`);
    }

    await disconnectDB();
    process.exit(0);
}

run();
