// @ts-check

/** @type {import('crx-monkey').CrxMonkeyManifest} */
const manifest = {
  name: "Twitter AI Illust Scanner",
  version: "1.1.0",
  manifest_version: 3,
  default_locale: "en",
  description: "It can scanning whether generated by AI what illust in tweet.",
  permissions: ["cookies", "storage"],
  host_permissions: [
    "https://x.com/*",
    "https://api.twitter.com/*",
    "https://twitter.com/*",
  ],
  content_scripts: [
    {
      matches: ["https://x.com/*", "https://twitter.com/*"],
      js: ["src/contentScripts/main_world/main.ts"],
      world: "MAIN",
      connection_isolated: true,
    },
  ],
  background: {
    service_worker: "src/sw/sw.ts",
  },
  icons: {
    16: "./public/16.png",
    48: "./public/48.png",
    128: "./public/128.png",
  },
};

export default manifest;
