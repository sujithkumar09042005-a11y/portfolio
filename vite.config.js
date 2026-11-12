// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 8765, strictPort: true },
  preview: { host: true, port: 8765, strictPort: true },
});
