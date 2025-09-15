import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function app(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  /* Explicitly load the env plugins first 
  (since fastify-autoload seems to be loading plugins by alphabetical order)
  */
  await fastify.register(import("./plugins/external/env.js"));

  // Then load all the other external plugins (cors, helmet, rate-limit, etc.)
  await fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, "plugins/external"),
    options: { ...opts },
    ignorePattern: /.*env\.(ts|js)$/, // Skip env.js since we already loaded it
  });

  // Load application-specific plugins (auth, db, custom utilities)
  await fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, "plugins/app"),
    options: { ...opts },
  });

  // Load routes with hooks support
  await fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { prefix: "/api", ...opts },
  });

  // Global error handler
  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
          headers: {
            "user-agent": request.headers["user-agent"],
            "x-forwarded-for": request.headers["x-forwarded-for"],
          },
        },
      },
      "Unhandled error occurred"
    );

    const statusCode = err.statusCode ?? 500;
    reply.code(statusCode);

    // To not expose internal errors in production
    if (statusCode >= 500 && process.env.NODE_ENV === "production") {
      return { message: "Internal Server Error" };
    }

    return {
      message: err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    };
  });

  // Rate-limited 404 handler (security best practice)
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
            ip: request.ip,
            "user-agent": request.headers["user-agent"],
          },
        },
        "Resource not found"
      );

      reply.code(404);
      return { message: "Not Found" };
    }
  );

  // Health check endpoint
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}
