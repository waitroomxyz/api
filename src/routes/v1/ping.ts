import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const ping: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    "/ping",
    {
      schema: {
        description:
          "A simple ping/pong endpoint to check if the API is responsive.",
        tags: ["Healthcheck"],

        response: {
          200: Type.Object({
            status: Type.String(),
          }),
        },
      },
    },
    async () => {
      return { status: "ok" };
    }
  );
};

export default ping;
