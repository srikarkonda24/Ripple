// Defines MVP GitHub webhook events and actions allowed for Stage 6.

export const MVP_PULL_REQUEST_EVENT = "pull_request" as const;

export type MvpPullRequestAction = "opened" | "synchronize";

export const MVP_PULL_REQUEST_ACTIONS: readonly MvpPullRequestAction[] = [
  "opened",
  "synchronize",
] as const;

/** Returns true when the GitHub event name is the MVP pull_request event. */
export function isMvpPullRequestEvent(eventName: string): boolean {
  return eventName === MVP_PULL_REQUEST_EVENT;
}

/** Returns true when the pull_request action is allowed for MVP analysis enqueue. */
export function isMvpPullRequestAction(
  action: string,
): action is MvpPullRequestAction {
  return (MVP_PULL_REQUEST_ACTIONS as readonly string[]).includes(action);
}
