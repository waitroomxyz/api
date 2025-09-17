import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";

const MeResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
});

const meRoute: FastifyPluginAsyncTypebox = async function (fastify) {
  fastify.get(
    // This route is now automatically protected by our global `onRequest` hook.
    "/me",
    {
      schema: {
        summary: "Get current user profile",
        description:
          "Returns the profile of the currently authenticated user based on their JWT.",
        tags: ["Auth"],
        response: {
          200: MeResponseSchema,
        },
      },
    },
    async function (request, reply) {
      // The logic here remains the same. Because the global hook has already run,
      // we can be certain that `request.user` exists and is valid.
      const { userId } = request.user;
      const { db } = fastify;

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return reply.notFound("User associated with this token was not found.");
      }

      const userForResponse = {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
      };

      return reply.code(200).send(userForResponse);
    }
  );
};

export default meRoute;
