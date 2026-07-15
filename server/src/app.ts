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
import { checklistImageRouter } from "./modules/checklistImages/checklistImage.routes.js"
import { checklistTemplateRouter, checklistTemplateItemRouter } from "./modules/checklistTemplates/checklistTemplate.routes.js"
import { notificationRouter } from "./modules/notifications/notification.routes.js"

class App {
    public app: Application;

    constructor() {
        this.app = express()
        this.initMiddlewares()
        this.initRoutes()
        this.initErrorHandling()
    }

    private initMiddlewares(): void {
        this.app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
        this.app.use(express.json())
        this.app.use(cookieParser())
        this.app.set("etag", false)
        if (env.NODE_ENV != 'test') this.app.use(morgan('dev'))
        this.app.use('/uploads', express.static(path.resolve('uploads')))
    }

    private initRoutes(): void {
        this.app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));
        this.app.use('/auth', authRouter);
        this.app.use('/users', userRouter);
        this.app.use('/stores', StoreRouter);
        this.app.use('/departments', departmentRouter);
        this.app.use('/categories', categoryRouter);

        this.app.use('/tasks', taskRouter);
        this.app.use('/projects', projectRouter)

        this.app.use('/tickets', ticketRouter);
        this.app.use('/checklists', checklistRouter);
        this.app.use('/checklist-items', checklistItemRouter);
        this.app.use('/checklist-images', checklistImageRouter);
        this.app.use('/checklist-templates', checklistTemplateRouter);
        this.app.use('/checklist-template-items', checklistTemplateItemRouter);

        this.app.use('/task-checklists', taskChecklistRouter);
        this.app.use('/task-checklist-items', taskChecklistItemRouter);
        this.app.use('/task-images', taskImageRouter);

        this.app.use("/audit-logs", auditRouter)

        this.app.use("/notifications", notificationRouter)
        this.app.use((_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Not found' }))
    }

    private initErrorHandling(): void {
        this.app.use(errorHandler)
    }
}

export default App;
