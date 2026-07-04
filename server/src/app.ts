import express, { type Application } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import { env } from "./config/env.js"
import { authRouter } from "./middleware/auth/auth.routes.js"
import { userRouter } from "./modules/users/user.routes.js"
import { errorHandler } from "./middleware/errorHandler/errorHandler.js"
import { StoreRouter } from "./modules/stores/store.routes.js"
import { departmentRouter } from "./modules/departments/department.routes.js"
import { categoryRouter } from "./modules/categories/category.routes.js"

class App {
    public app = Application;

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
        if (env.NODE_ENV != 'test') this.app.use(morgan('dev'))
    }

    private initRoutes(): void {
        this.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
        this.app.use('/auth', authRouter);
        this.app.use('/users', userRouter);
        this.app.use('/stores', StoreRouter);
        this.app.use('/departments', departmentRouter);
        this.app.use('/categories', categoryRouter);
        this.app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }))
    }

    private initErrorHandling(): void {
        this.app.use(errorHandler)
    }
}

export default App;