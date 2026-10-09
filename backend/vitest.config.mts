import { defineConfig } from "vitest/config";
import { config } from "dotenv";

const { parsed } = config({ path: ".env.test", quiet: true });

export default defineConfig({
  test: {
    env: { ...parsed, NODE_ENV: "test" },
    fileParallelism: false,
  },
});
