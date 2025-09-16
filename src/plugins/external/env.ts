import fp from "fastify-plugin";
import { Static, Type } from "@sinclair/typebox";

const schema = Type.Object({
  NODE_ENV: Type.Union(
    [
      Type.Literal("development"),
      Type.Literal("production"),
      Type.Literal("test"),
    ],
    { default: "development" }
  ),

  DATABASE_URL: Type.String(),

  JWT_SECRET: Type.String(),
  JWT_EXPIRES_IN: Type.String({ default: "7d" }),

  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: "0.0.0.0" }),

  LOG_LEVEL: Type.Union(
    [
      Type.Literal("fatal"),
      Type.Literal("error"),
      Type.Literal("warn"),
      Type.Literal("info"),
      Type.Literal("debug"),
      Type.Literal("trace"),
    ],
    { default: "info" }
  ),

  // Rate limiting
  RATE_LIMIT_MAX: Type.Number({ default: 100 }),
  RATE_LIMIT_WINDOW: Type.String({ default: "1 minute" }),

  // Waitlist specific
  WAITLIST_RATE_LIMIT_MAX: Type.Number({ default: 5 }),
  WAITLIST_RATE_LIMIT_WINDOW: Type.String({ default: "1 hour" }),

  EMAILABLE_API_KEY: Type.Optional(Type.String()),
});

export type Config = Static<typeof schema>;

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(async function envPlugin(fastify) {
  await fastify.register(import("@fastify/env"), {
    schema,
    dotenv: true,
    data: process.env,
  });
});
