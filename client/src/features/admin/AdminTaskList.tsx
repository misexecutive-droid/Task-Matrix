import { useState } from "react";
import { ClipboardList, Users, FileDown } from "lucide-react";
import { useUsersQuery } from "./hook";
import { TaskList } from "../tasks";
import { ExportDialog } from "../reports";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ALL_USERS = "__all__";

export const AdminTaskList = () => {
  const { data: users = [] } = useUsersQuery();
  const [userId, setUserId] = useState("");
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-text">Tasks</h1>
            <p className="text-sm text-text-muted mt-0.5">Every task across the team, optionally filtered by assignee.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none sm:w-56">
            <Users size={14} className="text-text-muted shrink-0" />
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

          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-display font-medium rounded-full border border-border/60 text-text-secondary hover:bg-surface-hover hover:text-text transition-all duration-200 cursor-pointer"
          >
            <FileDown size={14} />
            <span className="tracking-wide">Export</span>
          </button>
        </div>
      </div>

      <TaskList userId={userId || undefined} hideHeader />

      {showExport && (
        <ExportDialog
          reportModule="tasks"
          title="Export Tasks"
          description="Every task created in the selected period — status, priority, department, and assignee."
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};