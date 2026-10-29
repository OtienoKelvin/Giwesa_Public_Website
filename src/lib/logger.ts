type LogContext = Record<string, string | number | boolean | null | undefined>;

function line(level: string, message: string, context?: LogContext) {
  const suffix = context
    ? ` ${Object.entries(context)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(" ")}`
    : "";
  // Never pass request bodies, credentials, tokens or guest contact details here.
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `[giwesa-public] ${level.toUpperCase()} ${message}${suffix}`,
  );
}

export const logger = {
  info: (message: string, context?: LogContext) => line("info", message, context),
  warn: (message: string, context?: LogContext) => line("warn", message, context),
  error: (message: string, context?: LogContext) => line("error", message, context),
};
