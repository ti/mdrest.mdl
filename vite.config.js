import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    root: 'src',
    base: './',

    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'assets/scripts/*',
                    dest: 'assets/scripts'
                },
                {
                    src: 'assets/views/*',
                    dest: 'assets/views'
                },
                {
                    src: 'assets/mdrest/**/*',
                    dest: 'assets/mdrest'
                },
                {
                    src: '../node_modules/material-design-lite/src/mdlComponentHandler.js',
                    dest: 'node_modules/material-design-lite/src'
                },
                {
                    src: '../node_modules/material-design-lite/src/menu/menu.js',
                    dest: 'node_modules/material-design-lite/src/menu'
                },
                {
                    src: '../node_modules/mustache/mustache.js',
                    dest: 'node_modules/mustache'
                },
                {
                    src: '../node_modules/moment/moment.js',
                    dest: 'node_modules/moment'
                },
                {
                    src: '../node_modules/moment/locale/zh-cn.js',
                    dest: 'node_modules/moment/locale'
                }
            ]
        })
    ],

    build: {
        outDir: '../dist',
        emptyOutDir: true,

        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html')
            },
            output: {
                // 保持原有的资源结构
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];

                    if (ext === 'css') {
                        return 'assets/styles/app.min.css';
                    }
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return 'assets/images/[name][extname]';
                    }
                    if (/woff2?|eot|ttf|otf/i.test(ext)) {
                        return 'assets/fonts/[name][extname]';
                    }
                    return 'assets/[name][extname]';
                },
                chunkFileNames: 'assets/scripts/[name].min.js',
                entryFileNames: 'assets/scripts/app.min.js',
            }
        },

        // 资源处理
        assetsInlineLimit: 0, // 不内联资源，保持独立文件
        cssCodeSplit: false, // CSS不分割

        // 压缩配置
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // 保留console（调试用）
                drop_debugger: true
            }
        }
    },

    // CSS预处理器
    css: {
        preprocessorOptions: {
            scss: {
                // 不需要additionalData，因为app.scss已经导入了variables
            }
        }
    },

    // 开发服务器
    server: {
        port: 8000,
        open: true,
        strictPort: false
    },

    // 预览服务器
    preview: {
        port: 8001
    }
});