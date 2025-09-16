import fp from "fastify-plugin";
import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../../db/schema.js";

export type Db = NeonHttpDatabase<typeof schema>;

// Extend the Fastify type definition to include `db`.
// This enables type-safe access to `fastify.db` and `request.server.db`.
declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

/**
 * Fastify plugin that initializes a Drizzle ORM client (using Neon serverless)
 * and decorates the Fastify instance with it.
 *
 * @see Fastify Plugins: https://www.fastify.io/docs/latest/Reference/Plugins/
 * @see Drizzle + Neon: https://orm.drizzle.team/docs/get-started-postgresql#neon-serverless
 */
export default fp(async function dbPlugin(fastify) {
  // Read the database connection string from the validated env config.
  const { DATABASE_URL } = fastify.config;

  // Initialize Neon HTTP client.
  const sql = neon(DATABASE_URL);

  // Create a Drizzle ORM client with the schema.
  const db = drizzle(sql, { schema });

  // Make the Drizzle client available as `fastify.db`.
  fastify.decorate("db", db);
});
