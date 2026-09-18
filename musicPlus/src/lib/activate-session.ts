import type { useClerk } from "@clerk/clerk-react";

type SetActive = ReturnType<typeof useClerk>["setActive"];

const guidance = "This form cannot complete that step yet. Contact the application administrator for access to a supported authentication flow; do not disable the requirement.";

export function sessionTaskMessage(key: string): string {
  switch (key) {
    case "setup-mfa": return `Multi-factor authentication (MFA) setup is required. ${guidance}`;
    case "reset-password": return `A required session password reset is pending. ${guidance}`;
    case "choose-organization": return `Organization selection is required. ${guidance}`;
    default: return `An additional account requirement is pending. ${guidance}`;
  }
}

/** Inspect the actual session supplied by Clerk, not just the completed attempt. */
export async function activateCompletedSession(
  setActive: SetActive,
  sessionId: string,
  onReady: () => void,
  onBlocked: (message: string) => void,
): Promise<void> {
  let ready = false;
  let message = "Your session is not ready. Please try again or contact the application administrator.";
  await setActive({
    session: sessionId,
    navigate: ({ session }) => {
      if (session.currentTask) {
        message = sessionTaskMessage(session.currentTask.key);
      } else if (session.status === "active") {
        ready = true;
      }
    },
  });
  // Await activation as well as checking requirements; activation failures must
  // never navigate, even if Clerk has already called the navigation callback.
  if (ready) onReady();
  else onBlocked(message);
}
