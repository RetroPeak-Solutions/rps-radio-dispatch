import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";


// https://vite.dev/config/
export default defineConfig({
  server: {
    port: '5174'
  },
  base: "./",
  publicDir: 'public',
  plugins: [react(),tailwindcss()],
  root: "./",
  resolve: {
    alias: {
      // "@root": path.resolve(__dirname, ""),
      // "@public": path.resolve(__dirname, "public"),
      // "@src": path.resolve(__dirname, "src"),
      // "@components": path.resolve(__dirname, "src/components"),
      // "@context": path.resolve(__dirname, "src/context"),
      // "@assets": path.resolve(__dirname, "public/assets"),

      "@root": path.resolve(__dirname, ""),
      "@public": path.resolve(__dirname, "public"),
      "@src": path.resolve(__dirname, "src"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@components": path.resolve(__dirname, "src/components"),
      "@context": path.resolve(__dirname, "src/context"),
      "@assets": path.resolve(__dirname, "public/assets"),
      "@layouts": path.resolve(__dirname, "src/Layouts"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@wrappers": path.resolve(__dirname, "src/Wrappers"),
    },
  },
});

// export default defineConfig({
  
//   plugins: [tailwindcss()],
  

//   resolve: {
//     alias: [
//       {
//         customResolver: "@assets",
//         find: path.resolve(__dirname, "public/assets"),
//       }
//     ]
//     // alias: {
//     //   '@': path.resolve(__dirname, './src'),
//     //   '@assets': path.resolve(__dirname, './public/assets'),
//     // }
//   }
// });
