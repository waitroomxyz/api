import fp from "fastify-plugin";

export default fp(async function sessionPlugin(fastify) {
  if (fastify.config.NODE_ENV === "test") {
    return; // Skip sessions in tests
  }

  await fastify.register(import("@fastify/session"), {
    secret: fastify.config.JWT_SECRET,
    cookie: {
      secure: fastify.config.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  });
});
