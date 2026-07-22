import type { Config } from "@docusaurus/types";
import type { Preset } from "@docusaurus/preset-classic";

const config: Config = {
  title: "Ontology Extractor",
  tagline: "Documentazione tecnica della libreria TypeScript provider-agnostic",
  favicon: "img/favicon.svg",
  url: "https://andbet39.github.io",
  baseUrl: "/OntologyExtractor/",
  organizationName: "andbet39",
  projectName: "OntologyExtractor",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "it",
    locales: ["it"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Ontology Extractor",
      items: [
        { type: "docSidebar", sidebarId: "tutorialSidebar", position: "left", label: "Documentazione" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Libreria",
          items: [
            { label: "API", to: "/api/overview" },
            { label: "Processo", to: "/processo" },
          ],
        },
      ],
    },
    prism: {
      additionalLanguages: ["typescript", "json", "bash"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;