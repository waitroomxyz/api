import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import closeWithGrace from "close-with-grace";
import app from "./app.js";

// Create the Fastify instance with TypeBox support
const fastify = Fastify({
  logger: {
    level: (process.env.LOG_LEVEL as any) || "info",
    ...(process.env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    }),
  },
  ajv: {
    customOptions: {
      coerceTypes: "array" as const,
      removeAdditional: "all" as const,
    },
  },
  requestIdHeader: "x-request-id",
  disableRequestLogging: process.env.NODE_ENV === "production",
  trustProxy: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register the main app plugin
await fastify.register(app);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    fastify.log.info(`Waitroom API running at http://${host}:${port}`);
    fastify.log.info(`Health check: http://${host}:${port}/health`);

    if (process.env.NODE_ENV === "development") {
      fastify.log.info(`API docs: http://${host}:${port}/docs`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown handler
closeWithGrace(async ({ err, signal, manual }) => {
  if (err) {
    fastify.log.error({ err }, "Server error during shutdown");
  } else if (signal) {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  } else if (manual) {
    fastify.log.info("Manual shutdown initiated");
  }

  try {
    await fastify.close();
    fastify.log.info("Server closed successfully");
  } catch (closeErr) {
    fastify.log.error({ err: closeErr }, "Error during server shutdown");
    process.exit(1);
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  fastify.log.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  fastify.log.fatal({ reason, promise }, "Unhandled rejection");
  process.exit(1);
});

start();
