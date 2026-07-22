import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "intro",
    "processo",
    {
      type: "category",
      label: "Guide",
      items: ["guides/quickstart", "guides/prompts", "guides/langchain", "guides/persistence"],
    },
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/overview",
        "api/ontology-extractor",
        "api/configuration",
        "api/types",
        "api/adapters",
        "api/job-progress",
        "api/store",
        "api/helpers",
        "api/import-model",
        "api/errors",
      ],
    },
  ],
};

export default sidebars;