import { defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "link-redirector",
		compatibilityDate: "2026-09-30",
		entrypoint,
		triggers: [
			triggers.fetch({
				pattern: "link.chebread.org/*",
				zone: "chebread.org",
			}),
			triggers.fetch({
				pattern: "qr.chebread.org/*",
				zone: "chebread.org",
			}),
		],
	},
});
