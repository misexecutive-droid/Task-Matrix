import { useState } from "react";
import { Users } from "lucide-react";
import { useUsersQuery } from "./hooks";
import { TaskList } from "../tasks";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ALL_USERS = "__all__";

export const AdminTaskList = () => {
    const { data : users = []} = useUsersQuery();
    const [userId , setUserId] = useState("")

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 max-w-xs">
                <Users size={14} className="text-text-muted shrink-0"/>
                <Select value={userId || ALL_USERS} onValueChange={v => setUserId(v === ALL_USERS ? "" : v)}>
                    <SelectTrigger className="flex-1 text-xs font-display h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_USERS}>All users</SelectItem>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName ?? ""}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <TaskList userId={ userId || undefined} />
        </div>
    )
}