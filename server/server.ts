import type { Server } from "node:http"
import App from "./src/app"
import { connectDB, disconnetDB } from "./src/config/db"
import { env } from "./src/config/env"

class ServerBootstrap {
    private readonly appInstance: App;
    private httpServer?: Server;

    constructor() {
        this.appInstance = new App();
    }

    public async start(): Promise<void> {
        await connectDB();

        this.httpServer = this.appInstance.app.listen(env.PORT, () => {
            console.log(`Server listening on http://localhost:${env.PORT}`)
        });

        process.on("SIGINT", () => this.shutdown());;
        process.on("SIGTERM", () => this.shutdown())
    }


    private shutdown(): void {
        console.log("Shutting down server...");
        this.httpServer?.close(async () => {
            await disconnetDB()
            process.exit(0)
        })
    }
}

new ServerBootstrap().start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
