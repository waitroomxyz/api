import fp from "fastify-plugin";
import { hash, compare } from "bcryptjs";

// The salt rounds to use for hashing. 12 is a strong, recommended default.
const SALT_ROUNDS = 12;

export default fp(
  async function authPlugin(fastify) {
    // Decorator for hashing passwords
    fastify.decorate(
      "hashPassword",
      async (password: string): Promise<string> => {
        return hash(password, SALT_ROUNDS);
      }
    );

    // Decorator for verifying a password against a hash
    fastify.decorate(
      "verifyPassword",
      async (password: string, hash: string): Promise<boolean> => {
        return compare(password, hash);
      }
    );
  },
  {
    name: "auth",
    dependencies: [], // This plugin has no dependencies on other plugins
  }
);

// Augment the FastifyInstance interface to add type safety for our new decorators.
// This is crucial for TypeScript to know about `fastify.hashPassword`.
declare module "fastify" {
  export interface FastifyInstance {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
  }
}
