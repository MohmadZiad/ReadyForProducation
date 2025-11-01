import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { createRequire } from "module";

const originalParse = postcss.parse;
const patchedParse = function patchedParse(css, opts) {
  const nextOpts = { ...(opts ?? {}) };

  if (!nextOpts.from) {
    nextOpts.from = "tailwind.css";
  }

  return originalParse.call(this, css, nextOpts);
};

postcss.parse = patchedParse;

const require = createRequire(import.meta.url);
const postcssCjs = require("postcss");
if (postcssCjs && typeof postcssCjs === "object" && "parse" in postcssCjs) {
  postcssCjs.parse = patchedParse;
}

const ensureFromPlugin = () => ({
  postcssPlugin: "ensure-postcss-from",
  OnceExit(root) {
    const fallbackFile =
      root.source?.input?.file ?? "virtual:tailwind.css";

    if (!root.source) {
      root.source = { input: { file: fallbackFile } };
    } else if (!root.source.input) {
      root.source = { ...root.source, input: { file: fallbackFile } };
    } else if (!root.source.input.file) {
      root.source.input.file = fallbackFile;
    }

    root.walk((node) => {
      if (!node.source) {
        node.source = { input: { file: fallbackFile } };
        return;
      }

      if (!node.source.input) {
        node.source = { ...node.source, input: { file: fallbackFile } };
        return;
      }

      if (!node.source.input.file) {
        node.source.input.file = fallbackFile;
      }
    });
  },
});

ensureFromPlugin.postcss = true;

const config = {
  plugins: [tailwindcss(), autoprefixer(), ensureFromPlugin],
};

export default config;
