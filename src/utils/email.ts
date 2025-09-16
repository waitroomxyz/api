/**
 * @file This file contains utilities for advanced email validation,
 * including real-time deliverability checks via the Emailable API.
 * This approach was migrated from the original Next.js project's /lib/validation/email.ts.
 */

import { FastifyBaseLogger } from "fastify";

// Type definition for the Emailable API response
// This tells TypeScript the expected shape of the JSON data we get back
// from the fetch call, resolving the "'data' is of type 'unknown'" error.
interface EmailableApiResponse {
  state: "deliverable" | "risky" | "undeliverable" | "unknown";
  reason: EmailValidationReason;
}

// Define the possible reasons for validation failure, aligned with Emailable's API.
export type EmailValidationReason =
  | "invalid_email"
  | "invalid_domain"
  | "rejected_email"
  | "unknown";

// Define the structure of our validation result.
export type EmailValidationResult = {
  isValid: boolean;
  isDeliverable: boolean;
  reason?: EmailValidationReason;
  error?: string; // A user-friendly error message.
};

/**
 * Validates an email address using the Emailable API for deliverability.
 * This is a powerful step to prevent signups from disposable or fake email addresses.
 *
 * @param email The email address to validate.
 * @param apiKey The API key for the Emailable service.
 * @param isDevelopment A flag to determine if we should bypass the API call for development.
 * @returns A promise that resolves to an EmailValidationResult.
 */
export async function validateEmailWithApi(
  email: string,
  apiKey: string | undefined,
  isDevelopment: boolean,
  // Accept the logger as an argument
  // Instead of using `console.error`, we can accept Fastify's logger instance.
  // This is a best practice that makes the function pure, easier to test,
  // and integrates it perfectly with the application's logging system.
  log: FastifyBaseLogger
): Promise<EmailValidationResult> {
  // Migration Note:
  // In the old code, this function read directly from `process.env`.
  // Here, we've made it a "pure function" by having the API key and environment
  // passed in as arguments. This makes it more explicit, reusable, and much easier to test.

  // If the API key is missing or we are in a development environment,
  // we fall back to a simple regex check to avoid using API credits during development.
  if (!apiKey || isDevelopment) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    // Using a clear if/else handles the strict type checking correctly
    // and is more readable than conditional spreading.
    if (isValidFormat) {
      return { isValid: true, isDeliverable: true };
    } else {
      return {
        isValid: false,
        isDeliverable: false,
        reason: "invalid_email",
        error: "The email format is invalid.",
      };
    }
  }

  try {
    const url = `https://api.emailable.com/v1/verify?email=${encodeURIComponent(
      email
    )}&api_key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      // It's good practice to set a timeout on external API calls.
      signal: AbortSignal.timeout(10000), // 10-second timeout
    });

    if (!response.ok) {
      log.error(
        { email, status: response.status },
        "Emailable API request failed"
      );
      // Don't expose detailed internal errors to the user.
      return {
        isValid: false,
        isDeliverable: false,
        reason: "unknown",
        error: "An issue occurred while validating the email address.",
      };
    }

    // Cast the unknown JSON data to our defined interface.
    const data = (await response.json()) as EmailableApiResponse;

    // Per Emailable's documentation, 'deliverable' and 'risky' are acceptable states for allowing a signup.
    const isValid = data.state === "deliverable" || data.state === "risky";

    if (isValid) {
      return { isValid: true, isDeliverable: data.state === "deliverable" };
    } else {
      log.warn(
        { email, reason: data.reason },
        "Rejected a signup due to undeliverable email"
      );

      // If not valid, provide a clear reason for the rejection.
      return {
        isValid: false,
        isDeliverable: false,
        reason: data.reason,
        error:
          "This email address is not considered deliverable. Please use a different one.",
      };
    }
  } catch (err) {
    log.error(err, "Caught exception during email validation");
    return {
      isValid: false,
      isDeliverable: false,
      reason: "unknown",
      error: "A timeout or network error occurred while validating the email.",
    };
  }
}
