import { defineConfig } from "vitepress";

export default defineConfig({
  title: "uplnk",
  description: "Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.",
  base: "/uplnk/",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/guide/api" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Advanced usage", link: "/guide/advanced" },
          { text: "API reference", link: "/guide/api" },
        ],
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/your-org/uplnk",
      },
    ],
  },
  outDir: "./.vitepress/dist",
});
