import fp from "fastify-plugin";

export default fp(async function jwtPlugin(fastify) {
  await fastify.register(import("@fastify/jwt"), {
    secret: fastify.config.JWT_SECRET,
    sign: {
      expiresIn: fastify.config.JWT_EXPIRES_IN,
    },
    verify: {
      maxAge: fastify.config.JWT_EXPIRES_IN,
    },
  });
});
