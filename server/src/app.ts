import express, { type Application, type Request, type Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import path from "node:path"
import { env } from "./config/env.js"
import { authRouter } from "./middleware/auth/auth.routes.js"
import { userRouter } from "./modules/users/user.routes.js"
import { errorHandler } from "./middleware/errorHandler/errorHandler.js"
import { StoreRouter } from "./modules/stores/store.routes.js"
import { departmentRouter } from "./modules/departments/department.routes.js"
import { categoryRouter } from "./modules/categories/category.routes.js"
import { taskRouter } from "./modules/tasks/task.routes.js"
import { projectRouter } from "./modules/projects/project.routes.js"
import { auditRouter } from "./modules/audit/audit.routes.js"
import { ticketRouter } from "./modules/tickets/ticket.routes.js"
import { checklistRouter, checklistItemRouter } from "./modules/checklists/checklist.routes.js"
import { taskChecklistRouter, taskChecklistItemRouter } from "./modules/taskChecklists/taskChecklist.routes.js"
import { taskImageRouter } from "./modules/taskImages/taskImage.routes.js"
import { notificationRouter } from "./modules/notifications/notification.routes.js"


// This class wraps up our whole Express application: creating it, wiring up middleware, routes, and error handling.
// Using a class here (instead of just a bunch of top-level code) keeps setup organized and makes the app easy to import/reuse (e.g. in tests).
class App {
    // The actual Express application instance. It's public so other files (like server.ts) can access it, e.g. to pass it to http.createServer().
    public app: Application;

    constructor() {
        // Create the underlying Express app.
        this.app = express()
        // Set up all the "middleware" — functions that run on every request before it reaches a route (e.g. CORS, JSON parsing, logging).
        this.initMiddlewares()
        // Register all our route handlers (the actual API endpoints).
        this.initRoutes()
        // Register the error-handling middleware. This MUST be added after the routes,
        // because Express runs middleware/routes in the order they're added — errors need something already listening to catch them.
        this.initErrorHandling()
    }

    // Sets up middleware that should run on (almost) every incoming request.
    private initMiddlewares(): void {
        this.app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
        this.app.use(express.json())
        this.app.use(cookieParser())
        this.app.set("etag", false)
        // Only log requests with morgan when we're NOT running tests — keeps test output clean.
        // 'dev' is a predefined morgan format meant for local development (colored, concise).
        if (env.NODE_ENV != 'test') this.app.use(morgan('dev'))
        this.app.use('/uploads', express.static(path.resolve('uploads')))
    }

    // Registers all the actual API routes/endpoints, each handled by its own router imported above.
    private initRoutes(): void {
        // A simple health-check endpoint — useful for uptime monitors or load balancers to verify the server is alive.
        this.app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));
        // Mount the auth router so its routes are reachable under the /auth path (e.g. /auth/login).
        this.app.use('/auth', authRouter);
        // Mount the user router under /users.
        this.app.use('/users', userRouter);
        // Mount the store router under /stores.
        this.app.use('/stores', StoreRouter);
        // Mount the department router under /departments.
        this.app.use('/departments', departmentRouter);
        // Mount the category router under /categories.
        this.app.use('/categories', categoryRouter);

        // Mount the task router under /tasks.
        this.app.use('/tasks', taskRouter);
        // Mount the project router under /projects.
        this.app.use('/projects', projectRouter)

        // Mount the ticket router under /tickets.
        this.app.use('/tickets', ticketRouter);
        // Mount the checklist router under /checklists.
        this.app.use('/checklists', checklistRouter);
        // Mount the checklist-item router under /checklist-items.
        this.app.use('/checklist-items', checklistItemRouter);

        // NEW — mount the task checklist routers under /task-checklists and /task-checklist-items.
        this.app.use('/task-checklists', taskChecklistRouter);
        this.app.use('/task-checklist-items', taskChecklistItemRouter);
        // NEW — mount the task image router (currently just DELETE /task-images/:id) under /task-images.
        this.app.use('/task-images', taskImageRouter);

        // Mount the audit-log router under /audit-logs.
        this.app.use("/audit-logs", auditRouter)

        // Mount the notification router under /notifications.
        this.app.use("/notifications", notificationRouter)
        // Catch-all middleware: if no route above matched the request, respond with a 404 "Not found" JSON response.
        // Because it's added last (and has no path), Express only reaches it when nothing else handled the request.
        this.app.use((_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Not found' }))
    }

    // Registers the final error-handling middleware.
    private initErrorHandling(): void {
        // Express recognizes this as an "error-handling middleware" because errorHandler has 4 parameters (err, req, res, next).
        // It runs whenever something calls next(err) or throws inside a route/middleware, letting us send a consistent error response.
        this.app.use(errorHandler)
    }
}

export default App;
