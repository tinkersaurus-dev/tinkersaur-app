import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        // Only apply manual chunking to client builds - SSR builds have module
        // initialization order issues with manual chunks
        manualChunks: isSsrBuild ? undefined : (id) => {
          // Shared diagram code must be in its own chunk
          if (id.includes('diagrams/shared')) return 'diagram-shared';
          // Split diagram renderers into separate chunks by type
          if (id.includes('diagrams/bpmn')) return 'diagram-bpmn';
          if (id.includes('diagrams/class')) return 'diagram-class';
          if (id.includes('diagrams/sequence')) return 'diagram-sequence';
          if (id.includes('diagrams/architecture')) return 'diagram-architecture';
        },
      },
    },
  },
}));
