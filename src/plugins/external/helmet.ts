import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

export default fp(async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(import("@fastify/helmet"), {
    // The crossOriginEmbedderPolicy needs to be false for Scalar to work
    crossOriginEmbedderPolicy: false,

    // contentSecurityPolicy must be a static object, not a function
    contentSecurityPolicy: {
      directives: {
        "default-src": [`'self'`],
        "img-src": [`'self'`, "data:", "https:"],

        // Policies relaxed for the Scalar UI to work correctly
        "script-src": [
          `'self'`,
          `'unsafe-inline'`, // Fixes: "Refused to execute inline script"
          `'unsafe-eval'`, // Fixes: "WebAssembly.Module()" compilation error
          "https://cdn.jsdelivr.net", // Allows loading scripts from Scalar's CDN
        ],
        "style-src": [
          `'self'`,
          `'unsafe-inline'`, // Scalar also requires this for styling
        ],
        "worker-src": [`'self'`, `blob:`], // Required for some Scalar background tasks
      },
    },
  });
});
