/**
 * Global JavaScript error safety net.
 * Call setupGlobalErrorHandlers() once at app startup (in _layout.tsx).
 * Catches unhandled promise rejections and uncaught JS errors so the app
 * keeps running instead of crashing to a white screen.
 */

let isHandlerSetup = false;

export function setupGlobalErrorHandlers() {
  if (isHandlerSetup) return;
  isHandlerSetup = true;

  // Catch unhandled promise rejections (e.g. network failures, async bugs)
  const originalHandler = global.Promise;
  if (typeof global !== "undefined") {
    try {
      // React Native exposes this on the global error handler
      const original = (global as any).ErrorUtils?.getGlobalHandler?.();
      if (original) {
        (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          try {
            console.warn(
              `[ErrorGuard] ${isFatal ? "FATAL" : "Non-fatal"} error caught: ${error?.message ?? "Unknown error"}`
            );
            // For non-fatal errors, log and continue
            if (!isFatal) return;
          } catch {}
          // Let the original handler deal with fatal errors
          if (original) original(error, isFatal);
        });
      }
    } catch (e) {
      console.warn("[ErrorGuard] Could not set global error handler:", e);
    }
  }

  // Catch unhandled promise rejections
  try {
    const tracking = require("promise/setimmediate/rejection-tracking");
    if (tracking?.enable) {
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: any) => {
          console.warn("[ErrorGuard] Unhandled promise rejection:", error?.message ?? error);
        },
        onHandled: () => {},
      });
    }
  } catch {}
}

/**
 * Safe async wrapper — runs an async function and catches all errors.
 * Use for fire-and-forget operations where a crash is unacceptable.
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T | undefined> {
  return fn().catch(err => {
    console.warn(`[safeAsync${label ? `:${label}` : ""}] Error:`, err?.message ?? err);
    return undefined;
  });
}

/**
 * Safe try/catch wrapper for synchronous operations.
 */
export function safe<T>(fn: () => T, fallback: T, label?: string): T {
  try {
    return fn();
  } catch (err: any) {
    console.warn(`[safe${label ? `:${label}` : ""}] Error:`, err?.message ?? err);
    return fallback;
  }
}
