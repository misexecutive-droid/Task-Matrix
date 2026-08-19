import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Layers, Store as StoreIcon, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EntityIconTile, MetricPill } from '../../../components';
import type { DepartmentNode } from './orgStructureDisplay';
import { UserRow } from './UserRow';
import { TreeTrunk, TreeNode } from './TreeConnector';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DepartmentSectionProps {
  node: DepartmentNode;
  isOpen: boolean;
  forceOpen: boolean;
  onToggle: () => void;
  /** Shown only in the "Unassigned Departments" bucket, where the store link itself is the point. */
  showUnassignedStoreHint?: boolean;
}

export const DepartmentSection = ({ node, isOpen, forceOpen, onToggle, showUnassignedStoreHint }: DepartmentSectionProps) => {
  const open = isOpen || forceOpen;

  return (
    <div className="rounded-xl border border-border/70 bg-surface overflow-hidden transition-colors duration-200 hover:border-primary-200">
      <button
        type="button"
        onClick={forceOpen ? undefined : onToggle}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-surface-hover cursor-pointer disabled:cursor-default"
        disabled={forceOpen}
      >
        <EntityIconTile icon={Layers} tone="primary" />
        <span className="text-sm font-display font-bold text-text truncate">{node.department.name}</span>
        {showUnassignedStoreHint && (
          <span className="flex items-center gap-1 text-[10px] font-display font-bold px-2 py-0.5 rounded-full shrink-0 bg-warning/10 text-warning">
            <StoreIcon className="w-3 h-3" /> No store
          </span>
        )}
        <span className="ml-auto shrink-0">
          <MetricPill icon={Users}>
            {node.users.length} {node.users.length === 1 ? 'member' : 'members'}
          </MetricPill>
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-text-light shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              {node.users.length === 0 ? (
                <p className="px-3 py-2 text-xs font-display text-text-light italic">No members in this department yet.</p>
              ) : (
                <TreeTrunk>
                  {node.users.map((u) => (
                    <TreeNode key={u.id}>
                      <UserRow user={u} />
                    </TreeNode>
                  ))}
                </TreeTrunk>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
