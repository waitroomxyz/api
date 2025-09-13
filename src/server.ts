import { buildApp } from "./app.js";

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Waitroom API running at http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
