import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react";
import ViteYaml from "@modyfi/vite-plugin-yaml";

export default defineConfig(({command}) => {
  let plugins = [
    react(),
    ViteYaml(),
    viteStaticCopy({
      targets: [
        {
          src: "configuration.js",
          dest: ""
        }
      ]
    })
  ];

  return {
    plugins,
    server: {
      port: 8080,
      host: true
    },
    resolve: {
      alias: {
        "@/assets": fileURLToPath(new URL("./src/static", import.meta.url)),
        "@/components": fileURLToPath(new URL("./src/components", import.meta.url)),
        "@/stores": fileURLToPath(new URL("./src/stores", import.meta.url)),
        "@/utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      }
    },
    build: {
      manifest: true
    }
  };
});
