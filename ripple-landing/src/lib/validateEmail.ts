// Validates that a string looks like a real email address before waitlist submit.

/**
 * Returns true when the email has a basic user@domain format.
 * We keep this simple because the waitlist is UI-only for now.
 */
export function validateEmail(email: string): boolean {
  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(trimmedEmail);
}
