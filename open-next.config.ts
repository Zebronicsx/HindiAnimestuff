import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Use the default incremental cache (Cloudflare KV under the hood when configured)
});
