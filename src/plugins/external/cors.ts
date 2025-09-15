import fp from "fastify-plugin";

export default fp(async function corsPlugin(fastify) {
  await fastify.register(import("@fastify/cors"), {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      const allowedOrigins = [
        "https://waitroom.xyz",
        "https://www.waitroom.xyz",
      ];

      if (allowedOrigins.some((allowed) => origin.includes(allowed))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  });
});
