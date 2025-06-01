import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前模块的文件路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前模块所在目录
const __dirname = path.dirname(__filename);

// 解析入口文件路径
const entryPath = path.resolve(__dirname, "core/index.js");
console.log("Resolved entry path:", entryPath);

export default defineConfig({
  server: {
    port: 3000, // 指定端口号
    open: true, // 启动时自动打开浏览器
    cors: true, // 允许跨域
    host: "0.0.0.0", // 监听所有地址，方便局域网内访问
  },
  resolve: {
    extensions: [".js"],
    // 配置路径别名
    alias: {
      "@": __dirname,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        qrs: entryPath,
        qrsStore: path.resolve(__dirname, "core/store.js"),
        qrsRouter: path.resolve(__dirname, "core/router.js"),
        qrsFetch: path.resolve(__dirname, "core/fetch.js"),
        main: path.resolve(__dirname, "main.js"),
        index: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith("qrs")) {
            return "qrs/[name].[hash].js";
          }
          return "js/[name].[hash].js";
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === "qrs") {
            return "qrs/chunks/[name].[hash].js";
          }
          return "chunks/[name].[hash].js";
        },
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
  },
});
