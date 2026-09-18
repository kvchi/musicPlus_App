import { isClerkAPIResponseError } from "@clerk/clerk-react/errors";

/** Allowlisted feedback only: Clerk error text can contain account data or URLs. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (!isClerkAPIResponseError(error)) return fallback;
  switch (error.errors[0]?.code) {
    case "form_password_incorrect":
    case "form_identifier_not_found": return "Invalid email or password.";
    case "form_code_incorrect": return "The verification code is incorrect. Please try again.";
    case "verification_expired": return "The verification code has expired. Request a new code.";
    case "form_password_pwned": return "Choose a different password; this password has appeared in a data breach.";
    case "too_many_requests": return "Too many attempts. Please wait before trying again.";
    default: return fallback;
  }
}

export function incompleteSignInMessage(status: string | null): string {
  switch (status) {
    case "needs_second_factor": return "Additional verification (MFA) is required. This form cannot complete that step yet; your session has not been activated. Contact the application administrator for a supported authentication flow; do not disable the requirement.";
    case "needs_new_password": return "A new password is required. Use the password reset page to continue.";
    case "needs_first_factor": return "Additional identity verification is required. This form cannot complete that step yet; your session has not been activated. Contact the application administrator for a supported authentication flow; do not disable the requirement.";
    case "needs_identifier": return "Enter your email address to continue signing in.";
    default: return "Sign-in could not be completed. Please try again; your session has not been activated. Contact the application administrator for a supported authentication flow; do not disable the requirement.";
  }
}
