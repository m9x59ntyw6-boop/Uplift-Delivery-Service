/**
 * Global error safety system for Uplift.
 * Prevents hard crashes in Expo Go by catching all unhandled JS errors.
 *
 * Usage: call setupGlobalErrorHandlers() at the very top of _layout.tsx
 */

// ─── 1. Global Error Handler ──────────────────────────────────────────────────
// Catches crashes instead of letting Expo Go close the app.
export function setupGlobalErrorHandlers() {
  try {
    // Ensure ErrorUtils exists (some environments may not have it)
    if (!(global as any).ErrorUtils) {
      (global as any).ErrorUtils = {};
    }

    // Install the global handler — this intercepts ALL unhandled JS errors
    (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.log("[Uplift] Global error caught:", error?.message ?? error);

      if (isFatal) {
        // Fatal crash — log it but don't alert (alert can itself crash on some RN versions)
        console.error("[Uplift] FATAL error — app may need restart:", error?.message ?? error);
      } else {
        // Non-fatal — log and keep running
        console.warn("[Uplift] Non-fatal error recovered:", error?.message ?? error);
      }
    });
  } catch (e) {
    // Handler setup itself failed — fail silently so the app still runs
    console.warn("[Uplift] Could not install global error handler:", e);
  }

  // ─── 2. Unhandled Promise Rejections ────────────────────────────────────────
  // Catches async errors (fetch failures, storage errors, etc.)
  try {
    const tracking = require("promise/setimmediate/rejection-tracking");
    if (tracking?.enable) {
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: any) => {
          console.warn("[Uplift] Unhandled promise rejection:", error?.message ?? error);
        },
        onHandled: () => {},
      });
    }
  } catch {
    // promise rejection tracking not available — fine, carry on
  }
}

// ─── Safe async wrapper ───────────────────────────────────────────────────────
// Use for fire-and-forget calls where a crash is unacceptable.
// Example: safeAsync(() => AsyncStorage.setItem(key, val), "save-order")
export function safeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T | undefined> {
  return fn().catch(err => {
    console.warn(`[safeAsync${label ? `:${label}` : ""}]`, err?.message ?? err);
    return undefined;
  });
}

// ─── Safe synchronous wrapper ─────────────────────────────────────────────────
// Use when reading data that might be undefined/malformed.
// Example: safe(() => JSON.parse(stored), [], "parse-orders")
export function safe<T>(fn: () => T, fallback: T, label?: string): T {
  try {
    return fn();
  } catch (err: any) {
    console.warn(`[safe${label ? `:${label}` : ""}]`, err?.message ?? err);
    return fallback;
  }
}

// ─── Null-safe navigation helper ──────────────────────────────────────────────
// Prevents "cannot navigate on undefined router" errors.
export function safeNavigate(
  router: { replace?: (path: any) => void; push?: (path: any) => void } | null | undefined,
  method: "replace" | "push",
  path: string
) {
  try {
    if (router && typeof router[method] === "function") {
      router[method]!(path as any);
    }
  } catch (e: any) {
    console.warn(`[safeNavigate] Failed to ${method} to ${path}:`, e?.message);
  }
}

// ─── Null-safe data access ────────────────────────────────────────────────────
// Prevents "cannot read property of undefined" crashes.
// Example: safeGet(user, "name", "Guest")
export function safeGet<T>(
  obj: any,
  key: string,
  fallback: T
): T {
  try {
    const val = obj?.[key];
    return val !== undefined && val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}
