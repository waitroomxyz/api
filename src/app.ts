import Fastify from "fastify";
import autoload from "@fastify/autoload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Register plugins (only if folder exists)
  const pluginsDir = path.join(__dirname, "plugins");
  if (fs.existsSync(pluginsDir)) {
    app.register(autoload, { dir: pluginsDir });
  }

  // Register routes
  const routesDir = path.join(__dirname, "routes");
  if (fs.existsSync(routesDir)) {
    app.register(autoload, { dir: routesDir });
  }

  return app;
}
