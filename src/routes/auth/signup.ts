import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { validateEmailWithApi } from "../../utils/email.js";

// Schema for request body
// Fastify checks incoming requests against this before calling the handler.
// This prevents bad input (e.g. missing fields, wrong types) from reaching the app.
const SignupBodySchema = Type.Object({
  email: Type.String({ format: "email", examples: ["sourav@waitroom.xyz"] }),
  password: Type.String({ minLength: 8, examples: ["aStrongPassword123"] }),
  name: Type.Optional(Type.String({ examples: ["Sourav Nanda"] })),
});

// Schema for successful response
// Ensures the handler only sends responses in the expected format.
// Also feeds into OpenAPI/Scalar docs.
const SignupResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
  }),
  token: Type.String(),
});

const signupRoute: FastifyPluginAsyncTypebox = async function (fastify) {
  fastify.post(
    "/signup",
    {
      // In Fastify, a hook is basically a function that runs at any specific point in the
      // request lifecycle.
      // `preHandler` runs AFTER validation but BEFORE the main handler.
      // This is the perfect place for steps that need validated input but should
      // happen before the main business logic, like complex validation or authorization.
      preHandler: async (request, reply) => {
        const { email } = request.body;
        const { EMAILABLE_API_KEY, NODE_ENV } = fastify.config;

        // Call our dedicated email validation utility.
        // We pass `request.log` here, which is the Pino logger instance scoped to this
        // specific request. It automatically includes context like the `requestId`,
        // which is valuable for structured, production-grade logging.
        const validationResult = await validateEmailWithApi(
          email,
          EMAILABLE_API_KEY,
          NODE_ENV === "development",
          request.log
        );

        // If the email is not valid, we stop the request here and send a response.
        // The main handler below will NEVER run for an invalid email. This is a key
        // design pattern in Fastify for keeping handlers clean.
        if (!validationResult.isValid) {
          // `reply.badRequest` comes from the `@fastify/sensible` plugin.
          return reply.badRequest(validationResult.error);
        }
      },

      schema: {
        // Schemas here describe the whole route: request + response.
        // Fastify uses this for validation, type inference, and auto-generated docs.
        summary: "Create a new user account",
        description:
          "Registers a new user and returns their details along with a JWT for session management.",
        tags: ["Auth"],
        body: SignupBodySchema,
        response: {
          201: SignupResponseSchema,
        },
      },
    },
    async function (request, reply) {
      // Main Handler Logic
      // By the time this handler runs, we can be confident about three things:
      // 1. The request body matches `SignupBodySchema` (Fastify's validation).
      // 2. The email address is deliverable (our `preHandler` hook that uses the Emailable api).
      // 3. The `db` and `hashPassword` decorators are available on `fastify`.
      const { email, password, name } = request.body;
      const { db, hashPassword } = fastify;

      // Normalize the email so duplicates can't sneak in via case/spacing.
      // Check if a user with this email already exists.
      const normalizedEmail = email.toLowerCase().trim();
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser) {
        return reply.conflict("An account with this email already exists.");
      }

      // Hash the password using the auth plugin's helper.
      // Keeps hashing logic consistent and reusable across the app.
      const passwordHash = await hashPassword(password);

      // Insert the new user into the database.
      // `.returning()` gives back only the fields we want to expose.
      const [newUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          name: name?.trim() || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
        });

      // Safety check in case insert fails unexpectedly.
      if (!newUser) {
        return reply.internalServerError("Failed to create user account.");
      }

      // Generate a JWT for the user using Fastify's jwt plugin.
      // The token is used by the client for authenticated requests.
      const token = await reply.jwtSign({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      });

      const userForResponse = {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
      };

      // Respond with the new user and token. 201 signals resource creation.
      return reply.code(201).send({
        user: userForResponse,
        token,
      });
    }
  );
};

export default signupRoute;
