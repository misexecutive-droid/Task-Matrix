import { useState } from 'react';
import { Contact, Users, Building2, Store } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserList } from '../users';
import { DepartmentList } from '../department';
import { StoreList } from '../store';
import { useUsersQuery, useDepartmentsQuery } from '../hook';
import { useStoresQuery } from '../../tickets/hook';

const TABS = [
  { value: 'users', label: 'Users', icon: Users },
  { value: 'departments', label: 'Departments', icon: Building2 },
  { value: 'stores', label: 'Stores', icon: Store },
] as const;

type TabValue = (typeof TABS)[number]['value'];

// One home for the three entities that make up the org ladder (see Org Structure for the
// read-only combined view of how they relate) — each tab is the existing, self-contained
// List component as-is, just no longer scattered across three separate sidebar pages.
export const DirectoryPage = () => {
  const [tab, setTab] = useState<TabValue>('users');

  const { data: users } = useUsersQuery();
  const { data: departments } = useDepartmentsQuery();
  const { data: stores } = useStoresQuery();

  const counts: Record<TabValue, number | undefined> = {
    users: users?.length,
    departments: departments?.length,
    stores: stores?.length,
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <header className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <Contact className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-lg font-display font-bold tracking-tight text-text">Directory</h1>
          <p className="text-xs font-display text-text-muted max-w-lg leading-relaxed">
            Manage users, departments, and stores in one place.
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="bg-surface-hover p-1 rounded-lg gap-1 h-auto w-fit">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 px-3 py-1.5 text-sm rounded-md font-display data-[state=active]:bg-primary-700 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {counts[value] !== undefined && (
                <span className="text-xs font-semibold opacity-70">{counts[value]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" className="pt-4">
          <UserList />
        </TabsContent>
        <TabsContent value="departments" className="pt-4">
          <DepartmentList />
        </TabsContent>
        <TabsContent value="stores" className="pt-4">
          <StoreList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
