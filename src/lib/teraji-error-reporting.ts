type TerajiErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type TerajiEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: TerajiErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __terajiEvents?: TerajiEvents;
  }
}

export function reportTerajiError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__terajiEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
