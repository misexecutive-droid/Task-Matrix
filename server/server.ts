import http from "node:http"
import type { Server } from "node:http"
import App from "./src/app.js"
import { connectDB, disconnectDB } from "./src/config/db.js"
import { env } from "./src/config/env.js"
import { initSocket } from "./src/sockets/socket.js"

class ServerBootstrap {
    private readonly appInstance: App;
    private httpServer?: Server;

    constructor() {
        this.appInstance = new App();
    }

    public async start(): Promise<void> {
        await connectDB();

        this.httpServer = this.appInstance.app.listen(env.PORT, () => {
            initSocket(this.httpServer)
        });

        process.on("SIGINT", () => this.shutdown());;
        process.on("SIGTERM", () => this.shutdown())
    }


    private shutdown(): void {
        console.log("Shutting down server...");
        this.httpServer?.close(async () => {
            await disconnectDB()
            process.exit(0)
        })
    }
}

new ServerBootstrap().start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
