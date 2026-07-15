import { useState } from "react";
import { Users } from "lucide-react";
import { useUsersQuery } from "./hooks";
import { TaskList } from "../tasks";

export const AdminTaskList = () => {
    const { data : users = []} = useUsersQuery();
    const [userId , setUserId] = useState("")

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 max-w-xs">
                <Users size={14} className="text-text-muted shrink-0"/>
                <select 
                   value={userId}
                   onChange={ e => setUserId(e.target.value)}
                   className="flex-1 px-2.5 py-1.5 text-xs font-display bg-surface text-text rounded-md border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
                   >
                    <option value="">All users</option>
                    { users.map(u => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName?? "" }</option>
                    ))}
                   </select>
            </div>
            <TaskList userId={ userId || undefined} />
        </div>
    )
}