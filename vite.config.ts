import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split diagram renderers into separate chunks by type
          if (id.includes('diagrams/bpmn')) return 'diagram-bpmn';
          if (id.includes('diagrams/class')) return 'diagram-class'; // Includes Class and Enumeration shapes
          if (id.includes('diagrams/sequence')) return 'diagram-sequence';
          if (id.includes('diagrams/architecture')) return 'diagram-architecture';
        },
      },
    },
  },
});
