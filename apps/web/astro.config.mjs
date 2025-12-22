// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vue from '@astrojs/vue';
import { config } from "@growserver/config";


// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    envDir: "../../",
    server: {
      allowedHosts: [
        config.web.loginUrl
      ]
    }
  },

  integrations: [vue()],

  env: {
    schema: {
      // API_URL: envField.string({ context: "client", access: "public", optional: true }),
      // PORT: envField.number({ context: "server", access: "public", default: 4321 }),
      // API_SECRET: envField.string({ context: "server", access: "secret" }),
      DATABASE_URL: envField.string({ context: "server", access: "secret" }),
    }
  },

  
  adapter: node({
    mode: "standalone",
  }),
});
