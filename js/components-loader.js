/**
 * 组件加载器 - 动态加载导航栏和页脚组件
 * 
 * 使用方法：在 HTML 中添加占位符：
 * <div id="header-placeholder"></div>
 * <div id="footer-placeholder"></div>
 * 
 * 然后在页面末尾引入此脚本：
 * <script src="path/to/components-loader.js"></script>
 */

(function () {
    'use strict';

    // 计算当前页面相对于网站根目录的路径
    function getBasePath() {
        const path = window.location.pathname;

        // 统计路径中的目录层级
        // 例如: /index.html -> 0 层
        //       /pages/about.html -> 1 层
        //       /pages/blog/View.html -> 2 层

        const segments = path.split('/').filter(seg => seg.length > 0);

        // 移除文件名，只保留目录
        if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
            segments.pop();
        }

        const depth = segments.length;

        if (depth === 0) {
            return '.';
        } else {
            return Array(depth).fill('..').join('/');
        }
    }

    // 加载组件并替换占位符
    async function loadComponent(placeholderId, componentPath, basePath) {
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) {
            return;
        }

        try {
            const response = await fetch(basePath + '/components/' + componentPath);
            if (!response.ok) {
                throw new Error('Failed to load ' + componentPath);
            }

            let html = await response.text();

            // 替换路径占位符
            html = html.replace(/\{\{BASE_PATH\}\}/g, basePath);

            // 将 placeholder 替换为实际内容
            placeholder.outerHTML = html;

        } catch (error) {
            console.error('组件加载失败:', componentPath, error);
        }
    }

    // 高亮当前页面的导航链接
    function highlightActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.endsWith(href.split('/').pop())) {
                link.classList.add('active');
            }
        });
    }

    // 主函数
    async function init() {
        const basePath = getBasePath();

        // 并行加载 header 和 footer
        await Promise.all([
            loadComponent('header-placeholder', 'header.html', basePath),
            loadComponent('footer-placeholder', 'footer.html', basePath)
        ]);

        // 高亮当前导航
        highlightActiveNav();

        // 触发自定义事件，通知组件已加载完成
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
    }

    // DOM 加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
