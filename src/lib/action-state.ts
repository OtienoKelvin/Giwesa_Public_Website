export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: Record<string, string[]>;
  values?: Record<string, string>;
};

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };
