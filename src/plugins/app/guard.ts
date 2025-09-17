import fp from "fastify-plugin";
import { onRequestHookHandler } from "fastify";

// This plugin implements our global authentication hook.
// It follows the Fastify's official demo repo docs (`src/plugins/README.md`), where it says
// cross-cutting concerns like authentication are handled by plugins that set hooks.

// Define the routes that DO NOT require authentication.
const publicRoutes = new Set([
  "/api/auth/signup",
  "/api/auth/login",
  "/api/health",
]);

const authenticateHook: onRequestHookHandler = async (request, reply) => {
  // If the requested URL is in our set of public routes, we do nothing
  // and let the request proceed.
  if (publicRoutes.has(request.raw.url!)) {
    return;
  }

  // For all other routes, we enforce JWT authentication.
  try {
    // `request.jwtVerify()` checks for the header, verifies the token,
    // and throws an error if anything is invalid.
    await request.jwtVerify();
  } catch (err) {
    // If verification fails, we catch the error and send a 401 response.
    reply.unauthorized("Authentication required. Please log in.");
  }
};

export default fp(async function guardPlugin(fastify) {
  // Register the authenticateHook to run on every request.
  fastify.addHook("onRequest", authenticateHook);
});

// We still need to tell TypeScript what our JWT payload contains
// to ensure `request.user` is fully typed.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      name: string | null;
    };
    user: {
      userId: string;
      email: string;
      name: string | null;
      iat: number; // Issued at (timestamp)
      exp: number; // Expires at (timestamp)
    };
  }
}
