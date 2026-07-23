import http from "node:http";
import type { Server } from "node:http";

import App from "./src/app.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { initSocket } from "./src/sockets/socket.js";
import { startSlaSweep } from "./src/jobs/slaSweep.job.js";
import { startChecklistInstanceGenerator } from "./src/jobs/checklistInstanceGenerator.job.js";
import { settingsService } from "./src/modules/settings/settings.service.js";

class ServerBootstrap {
  private readonly appInstance: App;
  private httpServer?: Server;

  constructor() {
    this.appInstance = new App();
  }

  public async start(): Promise<void> {
    await connectDB();
    await settingsService.init()
    this.httpServer = http.createServer(this.appInstance.app);
    initSocket(this.httpServer);

    startSlaSweep();
    startChecklistInstanceGenerator();

    this.httpServer.listen(env.PORT, () => {
      console.log(`Server listening on http://localhost:${env.PORT}`);
    });

    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  private shutdown(): void {
    console.log("Shutting down server...");

    this.httpServer?.close(async () => {
      try {
        await disconnectDB();
        console.log("Database disconnected.");
      } catch (error) {
        console.error("Error while disconnecting database:", error);
      } finally {
        process.exit(0);
      }
    });
  }
}

new ServerBootstrap()
  .start()
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
