// One-off command-line script (run like: `npm run seed:demo`) that fills the app with random
// but realistic Delegations, Issues, Tickets, and Checklist runs against your EXISTING users,
// departments, stores, and categories — so the dashboard, task lists, ticket lists, and the
// Today's Runs checklist page all have something to show while testing.
//
// It never touches real accounts/org structure — it only reads them to attach realistic
// relations, then creates new Task/Ticket/ChecklistDefinition/ChecklistInstance documents.
// Safe to run more than once (each run just adds another batch).
import 'dotenv/config'
import { connectDB, disconnectDB } from '../config/db.js'
import { User } from '../models/User.js'
import { Department } from '../models/Department.js'
import { Store } from '../models/Store.js'
import { Category } from '../models/Category.js'
import { Task, TASK_STATUSES, TASK_PRIORITIES, type TaskStatus } from '../models/Task.js'
import { TaskChecklist } from '../models/TaskChecklist.js'
import { TaskChecklistItem } from '../models/TaskChecklistItem.js'
import { Ticket, TICKET_STATUSES, PRIORITIES as TICKET_PRIORITIES } from '../models/Ticket.js'
import { ChecklistDefinition } from '../models/ChecklistDefinition.js'
import { ChecklistInstance } from '../models/ChecklistInstance.js'
import { ChecklistInstanceItem } from '../models/ChecklistInstanceItem.js'

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000)

const DELEGATION_TITLES = [
  'Follow up with vendor on delayed shipment', 'Prepare monthly stock reconciliation',
  'Update store signage for the new promotion', 'Coordinate staff schedule for the weekend',
  'Review CCTV footage for the storage area', 'Submit expense report for last month',
  'Onboard new hire on POS system', 'Restock display counters before opening',
  'Call back customer about warranty claim', 'Audit petty cash drawer',
  'Prepare quarterly sales presentation', 'Schedule AC maintenance for the showroom',
  'Verify insurance documents for new inventory', 'Coordinate with logistics on delivery route',
  'Finalize vendor contract renewal', 'Train staff on new checklist app',
  'Reconcile discrepancy in billing software', 'Plan festive season inventory',
  'Update employee handbook section 4', 'Inspect fire safety equipment',
]

const ISSUE_TITLES = [
  'POS terminal freezing intermittently', 'AC not cooling in the east wing',
  'Broken glass display case in showroom 2', 'Wi-Fi router needs replacement',
  'Water leakage near the storeroom', 'Security camera offline since morning',
  'Billing software throwing checkout errors', 'Backup generator failed test run',
  'Flickering lights in the main hall', 'Damaged flooring near the entrance',
]

const CHECKLIST_ITEM_LABELS = [
  'Check entrance cleanliness', 'Verify cash drawer count', 'Inspect fire extinguisher',
  'Confirm display lighting is on', 'Check AC temperature setting', 'Verify CCTV is recording',
  'Inspect staff uniform compliance', 'Confirm inventory count matches system',
  'Check restroom cleanliness', 'Verify signage is up to date',
]

// Item sets for department-flavored daily checklists — keyed by department name (uppercased) so
// real departments like "IT"/"MDO" get on-topic items instead of generic store-ops language;
// anything else falls back to GENERIC_DEPT_ITEMS below.
const DEPARTMENT_CHECKLIST_ITEMS: Record<string, string[]> = {
  IT: [
    'Check server room temperature', 'Verify overnight backup completed', 'Test POS network connectivity',
    'Inspect CCTV recording status', 'Confirm Wi-Fi router uptime', 'Check UPS battery health',
  ],
  MDO: [
    'Verify daily sales report generated', 'Reconcile petty cash drawer', 'Check staff attendance log',
    'Confirm vendor deliveries logged', 'Review pending customer complaints', 'Update inventory variance sheet',
  ],
}
const GENERIC_DEPT_ITEMS = [
  'Review pending tasks for the day', 'Check team attendance', 'Verify daily target tracking sheet',
  'Inspect work area cleanliness', 'Confirm equipment is functioning', 'Log any incidents from the shift',
]

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const run = async () => {
  await connectDB()

  // Not filtered by isActive — this dev database's real Department/Store/Category rows are
  // sometimes toggled inactive while testing other features, but they're still perfectly fine to
  // attach demo Tasks/Tickets/Checklists to for a manual smoke test.
  const [users, departments, stores, categories] = await Promise.all([
    User.find({}),
    Department.find({}),
    Store.find({}),
    Category.find({}),
  ])

  if (!users.length || !departments.length || !stores.length) {
    console.error('Need at least one active user, department, and store already in the database before seeding demo data.')
    await disconnectDB()
    process.exit(1)
  }

  const admin = users.find((u) => u.role === 'ADMIN') ?? users[0]

  // ── Delegations + Issues (Task model — "issue"/"delegation" are its two categories) ──────────
  const taskCount = randomInt(10, 20)
  const createdTasks: string[] = []

  for (let i = 0; i < taskCount; i++) {
    const isIssue = Math.random() < 0.3
    const status: TaskStatus = pick([...TASK_STATUSES])
    const raiser = pick(users)
    const assignee = pick(users)
    const department = pick(departments)
    // Spread due dates on both sides of "now" so overdue (past, not done) and upcoming tasks both
    // exist — useful for eyeballing the Mark badge/Target gauge and the overdue counts.
    const dueDate = Math.random() < 0.4 ? daysFromNow(-randomInt(1, 10)) : daysFromNow(randomInt(1, 14))

    const task = await Task.create({
      title: isIssue ? pick(ISSUE_TITLES) : pick(DELEGATION_TITLES),
      description: 'Seeded demo record for testing.',
      category: isIssue ? 'issue' : 'delegation',
      status,
      priority: pick([...TASK_PRIORITIES]),
      dueDate,
      userId: raiser.id,
      assigneeId: assignee.id,
      departmentId: department.id,
      ...(status === 'done' ? { verifiedBy: admin.id, verifiedAt: new Date() } : {}),
    })
    createdTasks.push(task.id)

    // Give ~60% of tasks a small checklist so completion/photo-compliance reporting has real data.
    if (Math.random() < 0.6) {
      const checklist = await TaskChecklist.create({ title: 'Sub-tasks', taskId: task.id })
      const itemCount = randomInt(3, 5)
      // Tasks further along their status get a higher chance of each sub-item being checked off.
      const doneChance = status === 'done' ? 1 : status === 'pending_verification' ? 0.9 : status === 'in_progress' ? 0.5 : 0.1
      for (let j = 0; j < itemCount; j++) {
        await TaskChecklistItem.create({
          label: pick(CHECKLIST_ITEM_LABELS),
          isDone: Math.random() < doneChance,
          taskChecklistId: checklist.id,
        })
      }
    }
  }

  // ── Tickets ("Issue tickets") ──────────────────────────────────────────────────────────────
  const ticketCount = randomInt(10, 20)
  const createdTickets: string[] = []

  for (let i = 0; i < ticketCount; i++) {
    const status = pick([...TICKET_STATUSES])
    const category = categories.length ? pick(categories) : null
    const raiser = pick(users)
    const assignee = pick(users)
    const store = pick(stores)
    const department = category ? category.departmentId : pick(departments).id
    const tatHours = pick([12, 24, 48, 72])
    const overdue = status !== 'CLOSED' && Math.random() < 0.35

    const ticket = await Ticket.create({
      title: pick(ISSUE_TITLES),
      description: 'Seeded demo record for testing.',
      status,
      priority: pick([...TICKET_PRIORITIES]),
      tatHours,
      userId: raiser.id,
      assigneeId: assignee.id,
      storeId: store.id,
      categoryId: category?.id ?? null,
      departmentId: department,
      ...(status === 'CLOSED' ? { closedAt: new Date(), verifiedBy: admin.id, verifiedAt: new Date() } : {}),
    })

    // Ticket's pre('save') hook always recomputes tatDueAt as "now + tatHours" on create, so
    // backdating it to simulate an overdue ticket has to bypass that hook with a raw update.
    if (overdue) {
      await Ticket.updateOne({ _id: ticket.id }, { tatDueAt: daysFromNow(-randomInt(1, 5)), isOverdue: true })
    }
    createdTickets.push(ticket.id)
  }

  // ── Checklist templates + runs (ChecklistDefinition/ChecklistInstance — powers "Today's Runs",
  // the Checklist Templates grid, and each template's completion/compliance rate) ──────────────
  // One store-wide opening checklist, plus one department-flavored operations checklist per real
  // department in the DB — so "store wise" and "department wise" checklists actually exist as
  // distinct templates, each with their own item set and its own completion/compliance track
  // record (doneBias varies per checklist so the rates on the grid actually differ from each other).
  const pad2 = (n: number) => String(n).padStart(2, '0')

  type ChecklistSpec = { name: string; description: string; assigneeRoles: string[]; items: string[]; doneBias: number; storeIds: string[] }

  const checklistSpecs: ChecklistSpec[] = [
    {
      name: 'Store Opening Walkthrough',
      description: 'Daily opening procedure before the store opens to customers.',
      assigneeRoles: ['STORE_MANAGER'],
      items: [
        'Unlock front entrance and disable alarm', 'Turn on all display lighting',
        'Verify cash drawer opening float', 'Check AC/HVAC is running',
        'Inspect entrance for cleanliness', 'Confirm POS terminals are online',
      ],
      doneBias: 0.85,
      storeIds: stores.map((s) => s.id), // genuinely store-wide — live in every store
    },
    ...departments.slice(0, 4).map((dept, i): ChecklistSpec => ({
      name: `${dept.name} Daily Operations Check`,
      description: `Daily operational checklist for the ${dept.name} department.`,
      assigneeRoles: ['OPERATIONS'],
      items: DEPARTMENT_CHECKLIST_ITEMS[dept.name.toUpperCase()] ?? GENERIC_DEPT_ITEMS,
      doneBias: randomInt(35, 90) / 100, // spread completion health across checklists on purpose
      storeIds: [stores[i % stores.length].id], // store-wise: pinned to one store, rotated round-robin
    })),
  ]

  const createdInstances: string[] = []

  for (const spec of checklistSpecs) {
    let definition = await ChecklistDefinition.findOne({ name: spec.name })
    if (!definition) {
      definition = await ChecklistDefinition.create({
        name: spec.name,
        description: spec.description,
        storeIds: spec.storeIds,
        recurrence: 'DAILY',
        startDate: daysFromNow(-30),
        assigneeRoles: spec.assigneeRoles,
        createdBy: admin.id,
      })
    }

    const runCount = randomInt(10, 20)
    for (let i = 0; i < runCount; i++) {
      const store = pick(spec.storeIds)
      const dayOffset = -i // one run per day going backward, so this reads as a real run history
      const periodStart = daysFromNow(dayOffset)
      periodStart.setHours(0, 0, 0, 0)
      const periodEnd = new Date(periodStart.getTime() + 86_400_000 - 1)
      const periodKey = `${periodStart.getFullYear()}-${pad2(periodStart.getMonth() + 1)}-${pad2(periodStart.getDate())}`

      // Older runs lean further toward this checklist's baseline "health"; today's/yesterday's
      // run is more likely still mid-flight, regardless of how healthy the checklist normally is.
      const doneChance = clamp01(dayOffset <= -3 ? spec.doneBias + 0.1 : dayOffset === 0 ? spec.doneBias - 0.3 : spec.doneBias)

      let instance
      try {
        instance = await ChecklistInstance.create({
          definitionId: definition.id,
          title: definition.name,
          recurrence: 'DAILY',
          storeId: store,
          periodKey,
          periodStart,
          periodEnd,
          assigneeIds: [pick(users).id],
          generatedAt: periodStart,
        })
      } catch {
        // (definitionId, storeId, periodKey) already exists from a previous run of this script —
        // skip rather than crash the whole batch.
        continue
      }
      createdInstances.push(instance.id)

      const itemCount = randomInt(4, spec.items.length)
      const items = []
      for (let j = 0; j < itemCount; j++) {
        items.push(
          await ChecklistInstanceItem.create({
            label: spec.items[j] ?? pick(CHECKLIST_ITEM_LABELS),
            order: j,
            isDone: Math.random() < doneChance,
            instanceId: instance.id,
          }),
        )
      }

      const allDone = items.every((it) => it.isDone)
      if (allDone) {
        const verificationStatus = pick(['PENDING', 'PENDING', 'APPROVED', 'REJECTED'])
        await ChecklistInstance.updateOne(
          { _id: instance.id },
          {
            verificationStatus,
            ...(verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED'
              ? { verifiedBy: admin.id, verifiedAt: new Date() }
              : {}),
          },
        )
      }
    }
  }

  console.log(`Seeded ${createdTasks.length} delegations/issues, ${createdTickets.length} tickets, ${checklistSpecs.length} checklist templates with ${createdInstances.length} total runs.`)

  await disconnectDB()
  process.exit(0)
}

run().catch(async (err) => {
  console.error('Seed failed:', err)
  await disconnectDB()
  process.exit(1)
})
