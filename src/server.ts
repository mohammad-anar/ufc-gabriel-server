import app from "./app.js";
import { PlatformDataService } from "./app/modules/platformData/platformData.services.js";
import config from "./config/index.js";
import { seedSuperAdmin } from "./db/seedSuperAdmin.js";
import { initSocket } from "./helpers/socketHelper.js";

let server: any;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception detected. Shutting down...");
  console.error(error);
  process.exit(1);
});

async function bootstrap() {
  try {
    // seeding admin
    await seedSuperAdmin();

    const result = await PlatformDataService.getPlatformData();

    // seed platform data
    if (!result) {
      await PlatformDataService.createPlatformData({
        platformFee: 10,
        maximumJobRadius: 100,
      });
    } else {
      console.log("Platform data already exist.");
    }
    //
    server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
    });
    // socket
    //socket
    initSocket(server);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection detected. Shutting down...");
  console.error(error);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received.");
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT received.");
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

bootstrap();
