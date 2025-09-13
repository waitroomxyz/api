import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const ping: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    "/ping",
    {
      schema: {
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
