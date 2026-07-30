// vite.config.js
import { defineConfig } from "file:///sessions/happy-adoring-mccarthy/mnt/portfolio/portfolio/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/happy-adoring-mccarthy/mnt/portfolio/portfolio/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    proxy: {
      // /api/projects, /api/projects/refresh → FastAPI (keep path as-is)
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      },
      // Legacy endpoints that don't have the /api prefix
      "/chat": { target: "http://localhost:8000", changeOrigin: true },
      "/session": { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
      "/generate-cv": { target: "http://localhost:8000", changeOrigin: true }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvaGFwcHktYWRvcmluZy1tY2NhcnRoeS9tbnQvcG9ydGZvbGlvL3BvcnRmb2xpby9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2hhcHB5LWFkb3JpbmctbWNjYXJ0aHkvbW50L3BvcnRmb2xpby9wb3J0Zm9saW8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2hhcHB5LWFkb3JpbmctbWNjYXJ0aHkvbW50L3BvcnRmb2xpby9wb3J0Zm9saW8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgIC8vIC9hcGkvcHJvamVjdHMsIC9hcGkvcHJvamVjdHMvcmVmcmVzaCBcdTIxOTIgRmFzdEFQSSAoa2VlcCBwYXRoIGFzLWlzKVxuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAvLyBMZWdhY3kgZW5kcG9pbnRzIHRoYXQgZG9uJ3QgaGF2ZSB0aGUgL2FwaSBwcmVmaXhcbiAgICAgICcvY2hhdCc6IHsgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJywgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXG4gICAgICAnL3Nlc3Npb24nOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgJy9oZWFsdGgnOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgJy9nZW5lcmF0ZS1jdic6IHsgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJywgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFYLFNBQVMsb0JBQW9CO0FBQ2xaLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQTtBQUFBLE1BRUEsU0FBUyxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQy9ELFlBQVksRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUNsRSxXQUFXLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDakUsZ0JBQWdCLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsSUFDeEU7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
