// Node's built-in HTTP module — this lets us create a raw web server that Express will use under the hood.
import http from "node:http";
// Importing just the TypeScript "type" for Server, so we can type-annotate our httpServer variable (this import disappears at runtime).
import type { Server } from "node:http";

// Our custom Express application class (all routes/middleware live inside it).
import App from "./src/app.js";
// Functions to open and close the connection to our MongoDB database.
import { connectDB, disconnectDB } from "./src/config/db.js";
// Our validated environment variables (things like PORT, loaded from .env).
import { env } from "./src/config/env.js";
// Sets up Socket.IO (real-time/websocket communication) on top of our HTTP server.
import { initSocket } from "./src/sockets/socket.js";
// Starts a background job that periodically checks for SLA (service-level-agreement) breaches on tickets.
import { startSlaSweep } from "./src/jobs/slaSweep.job.js";

// This class is responsible for "bootstrapping" (starting up) our whole server:
// creating the app, connecting to the database, starting background jobs, and listening for shutdown signals.
class ServerBootstrap {
  // Holds an instance of our Express App wrapper class. "readonly" means it can only be set once (in the constructor).
  private readonly appInstance: App;
  // Will hold the actual Node HTTP server once we create it. The "?" means it's optional/undefined until start() runs.
  private httpServer?: Server;

  constructor() {
    // Create a new instance of our App class, which sets up middlewares, routes, and error handling.
    this.appInstance = new App();
  }

  // The main function that starts everything. It's "async" because connecting to the database takes time.
  public async start(): Promise<void> {
    // Wait for the MongoDB connection to be established before doing anything else.
    await connectDB();

    // http.createServer() wraps our Express app in a real Node.js HTTP server.
    // Express apps are technically just request-handler functions; Node needs an actual server object to listen on a port.
    this.httpServer = http.createServer(this.appInstance.app);
    // Attach Socket.IO to the same HTTP server so real-time features (like live notifications) can work alongside our REST API.
    initSocket(this.httpServer);

    // Kick off the recurring background job that checks tickets for SLA breaches.
    startSlaSweep();

    // Start listening for incoming HTTP requests on the configured port.
    this.httpServer.listen(env.PORT, () => {
      // This callback runs once the server has successfully started listening.
      console.log(`Server listening on http://localhost:${env.PORT}`);
    });

    // "SIGINT" is the signal sent when you press Ctrl+C in the terminal — we listen for it so we can shut down cleanly.
    process.on("SIGINT", () => this.shutdown());
    // "SIGTERM" is the signal sent by process managers (like Docker or a hosting platform) asking the app to stop.
    // Listening for both signals lets us do a "graceful shutdown" instead of the process just dying abruptly.
    process.on("SIGTERM", () => this.shutdown());
  }

  // Handles cleanly shutting the server down: stop accepting new requests, close the DB connection, then exit.
  private shutdown(): void {
    console.log("Shutting down server...");

    // server.close() stops the server from accepting new connections and waits for existing ones to finish,
    // then runs the callback we pass it.
    this.httpServer?.close(async () => {
      try {
        // Close the MongoDB connection cleanly so nothing is left hanging.
        await disconnectDB();
        console.log("Database disconnected.");
      } catch (error) {
        // If something goes wrong while disconnecting, log it instead of crashing silently.
        console.error("Error while disconnecting database:", error);
      } finally {
        // process.exit(0) stops the Node process entirely. Exit code 0 means "everything shut down successfully".
        // "finally" makes sure we always exit, whether or not disconnectDB() succeeded.
        process.exit(0);
      }
    });
  }
}

// Create a new ServerBootstrap and start it immediately.
new ServerBootstrap()
  .start()
  // If start() throws/rejects (e.g. the database connection fails), we land here instead of crashing with an unhandled error.
  .catch((err) => {
    console.error("Failed to start server:", err);
    // Exit code 1 signals to the OS/process manager that the app failed to start.
    process.exit(1);
  });
