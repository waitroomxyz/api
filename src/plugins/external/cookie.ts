import fp from "fastify-plugin";

export default fp(async function cookiePlugin(fastify) {
  await fastify.register(import("@fastify/cookie"), {
    secret: fastify.config.JWT_SECRET,
    hook: "onRequest",
    parseOptions: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  });
});
