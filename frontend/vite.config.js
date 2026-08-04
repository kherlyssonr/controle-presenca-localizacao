import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        aluno: resolve(import.meta.dirname, "painelAluno.html"),
        supervisor: resolve(import.meta.dirname, "painelSupervisor.html"),
      },
    },
  },
});