import { createStart } from "@tanstack/react-start";

// Import Tidewave only in development.
if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
  import("tidewave/tanstack");
}

export const startInstance = createStart(() => {
  return {};
});
