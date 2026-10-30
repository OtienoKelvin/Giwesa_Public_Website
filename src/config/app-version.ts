/**
 * Public build identity.
 *
 * `next.config.ts` inlines these values at build time (`env`), so they are safe
 * to read from Server Components and Route Handlers without a runtime lookup.
 * Neither value is secret: the version is in package.json and the commit SHA is
 * in the public repository / CI run.
 */
export const APP_VERSION = process.env.APP_VERSION ?? "0.0.0";
export const APP_COMMIT = process.env.APP_COMMIT ?? "dev";
