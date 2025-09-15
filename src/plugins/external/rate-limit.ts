import fp from "fastify-plugin";

export default fp(async function rateLimitPlugin(fastify) {
  await fastify.register(import("@fastify/rate-limit"), {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: function (request, context) {
      return {
        code: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded, retry in ${Math.round(
          context.ttl / 1000
        )} seconds.`,
        date: Date.now(),
        expiresIn: Math.round(context.ttl / 1000),
      };
    },
    skipOnError: true,
    keyGenerator: function (request) {
      // Use IP + User-Agent for better rate limiting
      const forwarded = request.headers["x-forwarded-for"];
      const ip = forwarded ? forwarded.toString().split(",")[0] : request.ip;
      return `${ip}-${request.headers["user-agent"]}`;
    },
  });
});
