import fp from "fastify-plugin";
import scalarApiReference from "@scalar/fastify-api-reference";

export default fp(async function swaggerPlugin(fastify) {
  if (fastify.config.NODE_ENV === "production") {
    return;
  }

  // Generates the openapi.json file that Scalar will use
  await fastify.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "Waitroom API",
        description: "Waitlist management API for Waitroom",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [
        { name: "waitlist", description: "Waitlist management endpoints" },
        { name: "auth", description: "Authentication endpoints" },
        { name: "projects", description: "Project management endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  // 3. Serves the Scalar UI.
  await fastify.register(scalarApiReference, {
    // This is the URL path where the API documentation will be available.
    // e.g., http://localhost:3000/docs
    routePrefix: "/docs",
  });
});
