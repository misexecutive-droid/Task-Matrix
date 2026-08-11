import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import { PendingTaskConversation } from '../models/PendingTaskConversation.js'

const run = async () => {
    const phone = process.argv[2];
    if (!phone) {
        console.error('Usage: npx tsx src/scripts/checkPendingConversation.ts <phone>');
        process.exit(1);
    }

    await connectDB();

    const conversation = await PendingTaskConversation.findOne({ phone });

    if (!conversation) {
        console.log(`No pending conversation for "${phone}".`);
    } else {
        console.log('Pending conversation found:');
        console.log(`  pendingSlot: ${conversation.pendingSlot}`);
        console.log(`  slotQueue:   ${JSON.stringify(conversation.slotQueue)}`);
        console.log(`  expiresAt:   ${conversation.expiresAt}`);
        console.log(`  draft:       ${JSON.stringify(conversation.draft, null, 2)}`);
    }

    await disconnectDB();
    process.exit(0);
}

run();
