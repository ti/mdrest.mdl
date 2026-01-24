const esbuild = require('esbuild')
const sass = require('sass')
const fs = require('fs')
const path = require('path')
const { minify } = require('html-minifier-terser')

const SRC = 'src'
const DIST = 'dist'

// JS 文件列表 (按依赖顺序，与原 index.html 中的 script 顺序一致)
const jsFiles = [
  // 第三方库
  'node_modules/material-design-lite/src/mdlComponentHandler.js',
  'node_modules/material-design-lite/src/menu/menu.js',
  'node_modules/mustache/mustache.js',
  'node_modules/moment/moment.js',
  'node_modules/moment/locale/zh-cn.js',
  // 项目脚本
  `${SRC}/assets/scripts/config.js`,
  `${SRC}/assets/scripts/blog.js`,
  `${SRC}/assets/scripts/app.js`,
  `${SRC}/assets/views/cache.js`,
  `${SRC}/assets/scripts/disqus.js`,
  `${SRC}/assets/scripts/search.js`,
  `${SRC}/assets/scripts/oauth.js`
]

// HTML 压缩配置 (参考原 gulp htmlmin 选项)
const htmlMinifyOptions = {
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: false,
  removeComments: true,
  minifyJS: true,
  minifyCSS: true
}

// 简单压缩 Mustache 模板 (模拟 gulp-htmlclean 行为)
function minifyMustacheTemplate(html) {
  return html
    // 移除 HTML 注释 (但保留 IE 条件注释和 Mustache 注释)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // 移除多余空白行
    .replace(/^\s*[\r\n]/gm, '')
    // 合并多个空白为单个空格
    .replace(/\s+/g, ' ')
    // 移除标签之间的空白
    .replace(/>\s+</g, '><')
    // 移除开头和结尾空白
    .trim()
}

async function build() {
  console.log('Building...')
  const startTime = Date.now()

  // 1. 清理 dist 目录 (保留被占用的 .nfs* 临时文件)
  if (fs.existsSync(DIST)) {
    cleanDir(DIST)
  }
  fs.mkdirSync(DIST, { recursive: true })

  // 2. 生成 cache.js (从 blog.html 生成模板缓存)
  generateCacheJs()

  // 3. 构建 JS (拼接 + 压缩)
  // 按顺序拼接所有 JS 文件 (保持全局变量)
  let combinedJs = ''
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    combinedJs += content + '\n'
  }
  
  // 使用 esbuild 压缩合并后的 JS (替代 gulp-uglify)
  const minifiedJs = await esbuild.transform(combinedJs, {
    loader: 'js',
    minify: true,
    target: 'chrome140'
  })
  
  fs.mkdirSync(`${DIST}/assets/scripts`, { recursive: true })
  fs.writeFileSync(`${DIST}/assets/scripts/app.min.js`, minifiedJs.code)
  console.log('  ✓ JS bundled')

  // 4. 构建 CSS (SCSS 编译 + 合并第三方 CSS + 压缩)
  // 先读取第三方 CSS
  const prismCss = fs.readFileSync('node_modules/prismjs/themes/prism.css', 'utf-8')
  
  // 编译 app.scss (使用 compressed 输出，替代 gulp-clean-css)
  const scssResult = sass.compile(`${SRC}/assets/styles/app.scss`, {
    loadPaths: ['node_modules', `${SRC}/assets/styles`],
    style: 'compressed',
    silenceDeprecations: ['import', 'global-builtin', 'slash-div']
  })
  
  // 修正 CSS 中的相对路径
  // SCSS 源文件在 inc/ 子目录，使用 ../../ 引用资源
  // 编译后 CSS 在 styles/ 目录，需要改为 ../
  let fixedCss = scssResult.css.replace(/url\(["']?\.\.\/\.\.\/([^"')]+)["']?\)/g, 'url(../$1)')
  
  // 合并 CSS (prism.css + app.css)
  const combinedCss = prismCss + '\n' + fixedCss
  
  // 使用 esbuild 压缩合并后的 CSS (替代 gulp-clean-css)
  const minifiedCss = await esbuild.transform(combinedCss, {
    loader: 'css',
    minify: true,
    target: 'chrome140'
  })
  
  fs.mkdirSync(`${DIST}/assets/styles`, { recursive: true })
  fs.writeFileSync(`${DIST}/assets/styles/app.min.css`, minifiedCss.code)
  console.log('  ✓ CSS compiled')

  // 5. 压缩 index.html (使用 html-minifier-terser，替代 gulp-htmlmin)
  const indexHtml = fs.readFileSync(`${SRC}/index.html`, 'utf-8')
  const minifiedIndex = await minify(indexHtml, htmlMinifyOptions)
  fs.writeFileSync(`${DIST}/index.html`, minifiedIndex)
  console.log('  ✓ index.html minified')

  // 6. 压缩 views HTML 文件 (使用简单压缩，模拟 gulp-htmlclean)
  const viewsDir = `${SRC}/assets/views`
  const distViewsDir = `${DIST}/assets/views`
  fs.mkdirSync(distViewsDir, { recursive: true })
  const viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'))
  for (const file of viewFiles) {
    const content = fs.readFileSync(path.join(viewsDir, file), 'utf-8')
    const minified = minifyMustacheTemplate(content)
    fs.writeFileSync(path.join(distViewsDir, file), minified)
  }
  console.log(`  ✓ ${viewFiles.length} view files minified`)

  // 7. 复制静态资源
  copyDir(`${SRC}/assets/fonts`, `${DIST}/assets/fonts`)
  copyDir(`${SRC}/assets/images`, `${DIST}/assets/images`)
  copyDir(`${SRC}/assets/json`, `${DIST}/assets/json`)
  copyDir(`${SRC}/assets/mdrest`, `${DIST}/assets/mdrest`)
  console.log('  ✓ Static assets copied')

  // 8. 复制动态加载的脚本
  const dynamicScripts = ['prism.min.js', 'mermaid.min.js', 'arale-qrcode.min.js']
  for (const script of dynamicScripts) {
    const srcFile = `${SRC}/assets/scripts/${script}`
    const destFile = `${DIST}/assets/scripts/${script}`
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile)
    }
  }
  console.log('  ✓ Dynamic scripts copied')

  const elapsed = Date.now() - startTime
  console.log(`\nBuild completed in ${elapsed}ms`)
}

// 生成 cache.js (模板缓存，模拟 gulp-angular-templatecache)
function generateCacheJs() {
  const blogHtml = fs.readFileSync(`${SRC}/assets/views/blog.html`, 'utf-8')
  // 使用 htmlclean 风格压缩
  const minified = minifyMustacheTemplate(blogHtml)
  // 转义单引号和反斜杠
  const escaped = minified.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  // 生成格式与原 templateCache 一致: " App.require.put('url','contents'); "
  const cacheContent = ` App.require.put('assets/views/blog.html','${escaped}'); `
  fs.writeFileSync(`${SRC}/assets/views/cache.js`, cacheContent)
  console.log('  ✓ cache.js generated')
}

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// 递归清理目录 (跳过 .nfs* 临时文件)
function cleanDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    // 跳过 NFS 临时文件 (被其他进程占用)
    if (entry.name.startsWith('.nfs')) continue
    try {
      if (entry.isDirectory()) {
        cleanDir(fullPath)
        // 尝试删除空目录
        try { fs.rmdirSync(fullPath) } catch {}
      } else {
        fs.unlinkSync(fullPath)
      }
    } catch (err) {
      // 忽略删除失败 (文件可能被占用)
    }
  }
}

build().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
