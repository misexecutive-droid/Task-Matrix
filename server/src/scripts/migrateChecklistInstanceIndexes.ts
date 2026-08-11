import "dotenv/config"
import { connectDB, disconnectDB } from "../config/db.js"
import { ChecklistInstance } from "../models/ChecklistInstance.js"

const run = async () => {
    await connectDB()

    const collection = ChecklistInstance.collection
    const existing = await collection.indexes()


    const stale = existing.filter((idx)=> {
        const keys = Object.keys(idx.key)
        return idx.unique && keys.length === 2 && keys.includes("definitionId") && keys.includes("periodKey")
    })

    for(const idx of stale){
        console.log(`Dropping stale index "${idx.name}" on checklistinstances.`)
        await collection.dropIndex(idx.name!)
    }

    if(!stale.length){
        console.log("No stale (definitionId, periodKey) index found - nothing to do.")
    }

    await ChecklistInstance.syncIndexes()
    console.log("Indexes are now in sync with the current schema.")

    await disconnectDB()
    process.exit(0)
}

run()