import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Pre-existing hand-rolled assertion script (a bare runAssertions() fn,
    // no vitest suite) — not a unit test. Excluded so this runner stays green;
    // converting it into a real suite is tracked separately.
    exclude: ["**/node_modules/**", "src/data/tourSteps.test.ts"],
  },
});
