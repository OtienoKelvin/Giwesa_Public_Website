type Bucket = { count: number; resetAt: number };

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Small fixed-window limiter for a single Node process.
 *
 * This is intentionally dependency-free. It protects the public forms and the
 * admin sign-in from casual abuse; a multi-instance deployment should move the
 * same interface to a shared store (for example the database or Redis) if the
 * threat model requires it.
 */
export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const buckets = new Map<string, Bucket>();
  const now = options.now ?? Date.now;
  let lastSweep = 0;

  function sweep(nowMs: number) {
    if (nowMs - lastSweep < options.windowMs) return;
    lastSweep = nowMs;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= nowMs) buckets.delete(key);
    }
  }

  function peek(key: string): RateLimitDecision {
    const nowMs = now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= nowMs) {
      return { allowed: true, remaining: options.limit, retryAfterSeconds: 0 };
    }
    const remaining = Math.max(0, options.limit - bucket.count);
    return {
      allowed: bucket.count < options.limit,
      remaining,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - nowMs) / 1000)),
    };
  }

  function consume(key: string): RateLimitDecision {
    const nowMs = now();
    sweep(nowMs);
    const current = buckets.get(key);
    if (!current || current.resetAt <= nowMs) {
      buckets.set(key, { count: 1, resetAt: nowMs + options.windowMs });
      return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
    }
    current.count += 1;
    return {
      allowed: current.count <= options.limit,
      remaining: Math.max(0, options.limit - current.count),
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - nowMs) / 1000)),
    };
  }

  function reset(key: string) {
    buckets.delete(key);
  }

  return { peek, consume, reset };
}
