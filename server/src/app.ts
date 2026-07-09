// Express is the web framework we use to build our REST API.
// "Application" is the TypeScript type for an Express app instance; "Request"/"Response" type the req/res objects in route handlers.
import express, { type Application, type Request, type Response } from "express"
// CORS = Cross-Origin Resource Sharing. It's middleware that controls which websites/origins are allowed to call this API from the browser.
import cors from "cors"
// Middleware that reads cookies sent by the browser and makes them available as `req.cookies`.
import cookieParser from "cookie-parser"
// Middleware that logs each incoming HTTP request to the console (method, URL, status code, response time, etc.) — handy for debugging.
import morgan from "morgan"
// Our validated environment variables (PORT, CLIENT_URL, NODE_ENV, etc.).
import { env } from "./config/env.js"
// Router containing login/logout/refresh-token style authentication endpoints.
import { authRouter } from "./middleware/auth/auth.routes.js"
// Router containing user-management endpoints (create/list/update users, etc.).
import { userRouter } from "./modules/users/user.routes.js"
// A centralized error-handling middleware — catches errors thrown anywhere in the app and turns them into a proper HTTP response.
import { errorHandler } from "./middleware/errorHandler/errorHandler.js"
// Router for store-related endpoints.
import { StoreRouter } from "./modules/stores/store.routes.js"
// Router for department-related endpoints.
import { departmentRouter } from "./modules/departments/department.routes.js"
// Router for category-related endpoints.
import { categoryRouter } from "./modules/categories/category.routes.js"
// Router for task-related endpoints.
import { taskRouter } from "./modules/tasks/task.routes.js"
// Router for project-related endpoints.
import { projectRouter } from "./modules/projects/project.routes.js"
// Router for audit-log endpoints (records of who did what, for tracking/history purposes).
import { auditRouter } from "./modules/audit/audit.routes.js"
// Router for support-ticket endpoints.
import { ticketRouter } from "./modules/tickets/ticket.routes.js"
// Two routers: one for checklists themselves, one for individual checklist items inside a checklist.
import { checklistRouter, checklistItemRouter } from "./modules/checklists/checklist.routes.js"
// Router for notification endpoints (e.g. fetching a user's notifications).
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
        // Enable CORS so that only our frontend (env.CLIENT_URL) is allowed to make requests to this API from a browser,
        // and allow cookies to be sent/received cross-origin (credentials: true) — needed for things like auth cookies.
        this.app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
        // Parse incoming JSON request bodies into `req.body` so we can read data sent by clients (e.g. form submissions as JSON).
        this.app.use(express.json())
        // Parse cookies from incoming requests into `req.cookies`.
        this.app.use(cookieParser())
        // Only log requests with morgan when we're NOT running tests — keeps test output clean.
        // 'dev' is a predefined morgan format meant for local development (colored, concise).
        if (env.NODE_ENV != 'test') this.app.use(morgan('dev'))
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

// Export the App class so server.ts can create an instance of it and attach it to a real HTTP server.
export default App;
