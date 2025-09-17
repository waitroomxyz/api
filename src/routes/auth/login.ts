import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";

// Migration Note: The manual `if` checks for `email` and `password` format
// from the Next.js route are now handled automatically and declaratively by this schema.
// It's the schema for the request body. Just email and password are required for login.
const LoginBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String(),
});

// The response schema remains consistent with the signup endpoint.
const LoginResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
  }),
  token: Type.String(),
});

const loginRoute: FastifyPluginAsyncTypebox = async function (fastify) {
  fastify.post(
    "/login",
    {
      schema: {
        summary: "Authenticate a user",
        description:
          "Logs a user in with their email and password, returning their details and a new JWT.",
        tags: ["Auth"],
        body: LoginBodySchema,
        response: {
          200: LoginResponseSchema,
          // The `sensible` plugin handles the 401 (unauthorized) and 500 (server error) responses.
        },
      },
    },
    async function (request, reply) {
      const { email, password } = request.body;
      const { db, verifyPassword } = fastify;

      // 1. Find the user by their email address.
      // We select all user fields except for the password hash, which should never be sent to the client.
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          passwordHash: users.passwordHash,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      // Check for the user AND the presence of a password hash.
      // This prevents "user enumeration," where an attacker could guess valid emails.
      if (!user || !user.passwordHash) {
        return reply.unauthorized("Invalid email or password.");
      }
      // 2. Verify the provided password against the stored hash.
      // We use the `verifyPassword` decorator from our `auth` plugin.
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return reply.unauthorized("Invalid email or password.");
      }

      // 3. Generate a new JWT for the authenticated user.
      const token = await reply.jwtSign({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      // 4. Prepare the user object for the response (without the password hash).
      // This also handles the Date -> string conversion for `createdAt`.
      const userForResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      };

      // 5. Send the successful response.
      return reply.code(200).send({
        user: userForResponse,
        token,
      });
    }
  );
};

export default loginRoute;
