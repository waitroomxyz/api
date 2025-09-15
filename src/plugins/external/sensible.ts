import fp from "fastify-plugin";

export default fp(async function sensiblePlugin(fastify) {
  await fastify.register(import("@fastify/sensible"));
});
