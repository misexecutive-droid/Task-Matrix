import { useMemo, useState } from 'react';
import { Network, Search, Maximize2, Minimize2, AlertCircle, Inbox, Store, Layers, Users, TriangleAlert } from 'lucide-react';
import { Input, OrbitDecoration } from '../../../components';
import { useDepartmentsQuery, useUsersQuery } from '../hook';
import { useStoresQuery } from '../../tickets/hook';
import { StoreSection } from './StoreSection';
import { DepartmentSection } from './DepartmentSection';
import { UserRow } from './UserRow';
import { buildOrgTree, filterOrgTree, countUsersInTree } from './orgStructureDisplay';

const OrgStructureSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-20 rounded-2xl border border-border bg-surface animate-pulse" />
    ))}
  </div>
);

export const OrgStructurePage = () => {
  const { data: stores, isPending: storesPending, isError: storesError } = useStoresQuery();
  const { data: departments, isPending: deptsPending, isError: deptsError } = useDepartmentsQuery();
  const { data: users, isPending: usersPending, isError: usersError } = useUsersQuery();

  const [query, setQuery] = useState('');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const isPending = storesPending || deptsPending || usersPending;
  const isError = storesError || deptsError || usersError;

  const tree = useMemo(
    () => buildOrgTree(stores ?? [], departments ?? [], users ?? []),
    [stores, departments, users]
  );
  const visibleTree = useMemo(() => filterOrgTree(tree, query), [tree, query]);
  const forceOpen = query.trim().length > 0;

  const toggleInSet = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const toggleStore = (id: string) => setExpandedStores((prev) => toggleInSet(prev, id));
  const toggleDept = (id: string) => setExpandedDepts((prev) => toggleInSet(prev, id));

  const expandAll = () => {
    setExpandedStores(new Set(tree.stores.map((s) => s.store.id)));
    setExpandedDepts(
      new Set([
        ...tree.stores.flatMap((s) => s.departments.map((d) => d.department.id)),
        ...tree.unassignedDepartments.map((d) => d.department.id),
      ])
    );
  };
  const collapseAll = () => {
    setExpandedStores(new Set());
    setExpandedDepts(new Set());
  };

  const totalMembers = countUsersInTree(tree);
  const unassignedCount = tree.unassignedDepartments.length + tree.unassignedUsers.length;
  const hasAnyResults =
    visibleTree.stores.length > 0 || visibleTree.unassignedDepartments.length > 0 || visibleTree.unassignedUsers.length > 0;

  const stats = [
    { label: 'Stores', value: stores?.length ?? 0, icon: Store, tone: 'coral' as const },
    { label: 'Departments', value: departments?.length ?? 0, icon: Layers, tone: 'primary' as const },
    { label: 'People', value: totalMembers, icon: Users, tone: 'primary' as const },
    { label: 'Unassigned', value: unassignedCount, icon: TriangleAlert, tone: 'warn' as const },
  ];

  return (
    <div className="relative isolate overflow-hidden flex flex-col gap-5 w-full">
      <OrbitDecoration corner="top-left" tone="coral" className="w-72 h-72" />
      <OrbitDecoration corner="top-right" tone="primary" />
      <OrbitDecoration corner="bottom-left" tone="primary" className="w-28 h-28" />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm ring-1 ring-primary-900/10 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-display font-bold tracking-tight text-text">Organization structure</h1>
            <p className="text-xs font-display text-text-muted">
              The ladder, laid out — every store, its departments, and who sits where.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-display font-bold rounded-lg text-text-secondary bg-surface border border-border hover:bg-surface-hover hover:text-primary-600 hover:border-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-display font-bold rounded-lg text-text-secondary bg-surface border border-border hover:bg-surface-hover hover:text-primary-600 hover:border-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Collapse all
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <div className="flex flex-wrap gap-2.5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isWarn = stat.tone === 'warn' && stat.value > 0;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden flex items-center gap-2.5 rounded-xl border border-border bg-surface pl-3 pr-4 py-2 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200"
            >
              <div
                style={{ animationDelay: `${i * 0.6}s` }}
                className={`animate-float-blob absolute -right-4 -top-4 w-16 h-16 rounded-full blur-md opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-300 ${
                  isWarn ? 'bg-warning' : stat.tone === 'coral' ? 'bg-coral-500' : 'bg-primary-500'
                }`}
              />
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                  isWarn
                    ? 'bg-warning/10 text-warning'
                    : stat.tone === 'coral'
                    ? 'bg-coral-500/10 text-coral-600 dark:text-coral-400'
                    : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="relative">
                <p className="text-[10px] font-display font-bold text-text-muted leading-tight">{stat.label}</p>
                <p className={`text-base font-display font-bold leading-tight ${isWarn ? 'text-warning' : 'text-text'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <Input
        id="org-search"
        icon={Search}
        placeholder="Search stores, departments, or people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Content */}
      {isPending ? (
        <OrgStructureSkeleton />
      ) : isError ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-display font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load the organization structure. Please check your connection and try again.</p>
        </div>
      ) : !hasAnyResults ? (
        <section className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-surface-hover/40 text-center">
          <div className="mb-5 text-text-muted">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-display font-bold text-text mb-2">
            {query ? 'No matches' : 'Nothing set up yet'}
          </h3>
          <p className="text-sm text-text-muted max-w-sm">
            {query
              ? 'Try a different store, department, or person name.'
              : 'Add stores and departments, then assign people to them to see the structure here.'}
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleTree.stores.map((node) => (
            <StoreSection
              key={node.store.id}
              node={node}
              isOpen={expandedStores.has(node.store.id)}
              forceOpen={forceOpen}
              onToggle={() => toggleStore(node.store.id)}
              isDeptOpen={(id) => expandedDepts.has(id)}
              onToggleDept={toggleDept}
            />
          ))}

          {visibleTree.unassignedDepartments.length > 0 && (
            <div className="rounded-2xl border border-dashed border-warning/40 bg-warning/5 p-4 sm:p-5 space-y-2">
              <p className="text-xs font-display font-bold text-warning mb-1">
                Departments without a store
              </p>
              {visibleTree.unassignedDepartments.map((d) => (
                <DepartmentSection
                  key={d.department.id}
                  node={d}
                  isOpen={expandedDepts.has(d.department.id)}
                  forceOpen={forceOpen}
                  onToggle={() => toggleDept(d.department.id)}
                  showUnassignedStoreHint
                />
              ))}
            </div>
          )}

          {visibleTree.unassignedUsers.length > 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-surface-hover/60 p-4 sm:p-5">
              <p className="text-xs font-display font-bold text-text-muted mb-1">
                People without a department or store
              </p>
              <div className="flex flex-col gap-0.5">
                {visibleTree.unassignedUsers.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
