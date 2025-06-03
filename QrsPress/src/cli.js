#!/usr/bin/env node
import { program } from "commander";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { marked } from "marked";
import { Component, createApp } from "../../core/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { JSDOM } from "jsdom";
import * as sass from "sass";
import httpServer from "http-server";

// 获取当前模块的文件路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前模块所在目录
const __dirname = dirname(__filename);

// 读取模板文件
const readTemplate = (templatePath) => {
  return fs.readFileSync(templatePath, "utf-8");
};

// 编译 SCSS 文件
const compileScss = (scssPath) => {
  const result = sass.compile(scssPath);
  return result.css;
};

// 生成导航菜单
const generateNavMenu = (markdownFiles, docsDir, currentOutputPath) => {
  const outputDir = path.join(__dirname, "../dist");
  const currentDir = path.dirname(currentOutputPath);
  let navItems = "";
  // 对 markdownFiles 进行排序，确保导航顺序一致
  markdownFiles.sort().forEach((file) => {
    const relativePath = path.relative(docsDir, file);
    const outputPath = relativePath.replace(".md", ".html");
    const targetFullPath = path.join(outputDir, outputPath);
    const linkText = path.basename(relativePath, ".md") || "Home";
    let relativeLink = path.relative(currentDir, targetFullPath);
    // 确保路径分隔符为正斜杠
    relativeLink = relativeLink.replace(/\\/g, "/");
    navItems += `<li class="nav-item"><a href="${relativeLink}" class="nav-link">${linkText}</a></li>`;
  });

  return `
      <ul class="navbar-nav" style="flex-direction:row">
        ${navItems}
      </ul>
  `;
};

// 生成侧边栏菜单
const generateSidebarMenu = (markdownFiles, docsDir, currentOutputPath) => {
  const outputDir = path.join(__dirname, "../dist");
  const currentDir = path.dirname(currentOutputPath);
  let navItems = "";
  // 对 markdownFiles 进行排序，确保导航顺序一致
  markdownFiles.sort().forEach((file) => {
    const relativePath = path.relative(docsDir, file);
    const outputPath = relativePath.replace(".md", ".html");
    const targetFullPath = path.join(outputDir, outputPath);
    const linkText = path.basename(relativePath, ".md") || "Home";
    let relativeLink = path.relative(currentDir, targetFullPath);
    // 确保路径分隔符为正斜杠
    relativeLink = relativeLink.replace(/\\/g, "/");
    navItems += `<li class="nav-item"><a href="${relativeLink}" class="nav-link">${linkText}</a></li>`;
  });

  return `
    <div class="sidebar navbar navbar-dark">
      <ul class="navbar-nav">
        ${navItems}
      </ul>
    </div>
  `;
};

// 生成单个页面
const generatePage = (
  markdownContent,
  template,
  navMenu,
  sidebarMenu,
  cssContent
) => {
  const htmlContent = marked(markdownContent);
  const message = "QrsPress Demo";

  // 创建模拟的 DOM 环境
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const { window } = dom;
  const { document } = window;

  const PageComponent = new Component(
    {
      template: `
      <div>
        <style>${cssContent}</style>
        <nav class="navbar navbar-dark fixed">
          <a href="#" class="navbar-brand">${message}</a>
          
        </nav>
        <div class="container" style="display:flex;margin-top:4.5rem;">
          <div class="row">
            <div class="col-3" style="width:140px">
              ${sidebarMenu}
            </div>
            <div class="col-8" style="width:960px">
              <div class="main-content">
                ${template}
                <div id="content">${htmlContent}</div>
              </div>
            </div>
          </div>
        </div>
        <footer class="footer">
          <div class="container" style="text-align:center;">&copy;Copyright. QrsPress 2025.</div>
        </footer>
      </div>
    `,
      data() {
        return {
          message: "Hello from QrsPress!",
        };
      },
    },
    document
  );

  const app = createApp(PageComponent);

  const rootElement = document.createElement("div");
  // 将模拟的 document 对象传递给 mount 方法
  app.mount(rootElement, document);
  return rootElement.innerHTML;
};

// 生成整个网站
const generateSite = async () => {
  const docsDir = path.join(__dirname, "../docs");
  const outputDir = path.join(__dirname, "../dist");
  const templatePath = path.join(__dirname, "templates/default.html");
  const scssPath = path.join(__dirname, "../../core/ui/base.scss");

  // 读取模板
  const template = readTemplate(templatePath);
  // 编译 SCSS
  const cssContent = compileScss(scssPath);

  // 清空输出目录
  await fs.emptyDir(outputDir);

  // 查找所有 Markdown 文件
  const markdownFiles = glob.sync(`${docsDir}/**/*.md`);

  for (const file of markdownFiles) {
    const markdownContent = await fs.readFile(file, "utf-8");
    const relativePath = path.relative(docsDir, file);
    const outputPath = path.join(
      outputDir,
      relativePath.replace(".md", ".html")
    );

    // 生成导航菜单，传入当前输出文件路径
    const navMenu = generateNavMenu(markdownFiles, docsDir, outputPath);
    // 生成侧边栏菜单
    const sidebarMenu = generateSidebarMenu(markdownFiles, docsDir, outputPath);

    const html = generatePage(
      markdownContent,
      template,
      navMenu,
      sidebarMenu,
      cssContent
    );

    // 创建输出目录
    await fs.ensureDir(path.dirname(outputPath));
    // 写入 HTML 文件
    await fs.writeFile(outputPath, html);
  }

  console.log("Site generated successfully!");
};

program
  .command("build")
  .description("Build the static site")
  .action(() => {
    generateSite();
  });

// 启动本地预览服务
const startPreviewServer = () => {
  const outputDir = path.join(__dirname, "../dist");
  const port = 8080;
  const server = httpServer.createServer({
    root: outputDir,
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

program
  .command("serve")
  .description("Start local preview server")
  .action(() => {
    startPreviewServer();
  });
// eslint-disable-next-line no-undef
program.parse(process.argv);
