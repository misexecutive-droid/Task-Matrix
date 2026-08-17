import { useMemo } from 'react';
import { Building2, User } from 'lucide-react';
import { TicketCard } from '../TicketCard';
import { groupChecklistStats } from './ticketGrouping';
import type { Ticket } from '../../../api/ticket';

interface TicketGroup {
  key: string;
  label: string;
  tickets: Ticket[];
}

interface TicketGroupedListProps {
  groups: TicketGroup[];
  groupBy: 'department' | 'assignee';
  onSelectTicket: (ticket: Ticket) => void;
  departmentNames: Map<string, string>;
}

// Sub-component: Clean separation for group headers
interface GroupHeaderProps {
  label: string;
  groupBy: 'department' | 'assignee';
  ticketCount: number;
  stats: { total: number; done: number };
}

const GroupHeader = ({ label, groupBy, ticketCount, stats }: GroupHeaderProps) => {
  const Icon = groupBy === 'department' ? Building2 : User;

  return (
    <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-primary-500 shrink-0" />
        <h3 className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        {stats.total > 0 && (
          <span className="text-[11px] font-display font-medium px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-300">
            <span className="tabular-nums">{stats.done}/{stats.total}</span> checklist done
          </span>
        )}
        <span className="text-[11px] font-display font-medium px-2 py-0.5 rounded bg-surface-hover text-text-muted">
          <span className="tabular-nums">{ticketCount}</span> {ticketCount === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>
    </div>
  );
};

export const TicketGroupedList = ({
  groups,
  groupBy,
  onSelectTicket,
  departmentNames,
}: TicketGroupedListProps) => {
  const groupOffsets = useMemo(() => (
    groups.reduce<{ offsets: number[]; count: number }>((acc, group) => {
      acc.offsets.push(acc.count);
      acc.count += group.tickets.length;
      return acc;
    }, { offsets: [], count: 0 }).offsets
  ), [groups]);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, groupIdx) => {
        const stats = groupChecklistStats(group.tickets);
        const groupOffset = groupOffsets[groupIdx];

        return (
          <div key={group.key} className="flex flex-col gap-3">
            <GroupHeader
              label={group.label}
              groupBy={groupBy}
              ticketCount={group.tickets.length}
              stats={stats}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.tickets.map((ticket, ticketIdx) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={onSelectTicket}
                  index={groupOffset + ticketIdx}
                  departmentName={
                    departmentNames.get(ticket.departmentId ?? '') ?? 'Ticket'
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};