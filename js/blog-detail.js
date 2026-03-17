document.addEventListener('DOMContentLoaded', function () {
    // 1. 获取 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        showError("未提供文章 ID (例如: ?id=123456)");
        return;
    }

    // 2. 请求对应的 JSON 文件
    fetch(`${articleId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`找不到文章数据文件: ${articleId}.json`);
            }
            return response.json();
        })
        .then(data => {
            renderPage(data);
        })
        .catch(err => {
            showError(err.message);
        });

    // 3. 渲染页面函数
    function renderPage(data) {
        // 设置标题
        const title = data['标题'] || '无标题';
        document.title = title;
        document.getElementById('dynamic-title').innerText = title;

        // 设置日期
        document.getElementById('dynamic-date').innerText = data['日期'] || '';

        // 设置正文 (innerHTML 以支持 HTML 标签)
        document.getElementById('dynamic-content').innerHTML = data['正文'] || '';

        // 设置标签
        const tagsContainer = document.getElementById('dynamic-tags');
        let tagsRaw = data['tag'];
        let tagsHtml = '';

        // 兼容数组或单个字符串
        if (Array.isArray(tagsRaw)) {
            tagsRaw.forEach(t => {
                tagsHtml += `<span class="article-tag">${t}</span>`;
            });
        } else if (tagsRaw) {
            tagsHtml = `<span class="article-tag">${tagsRaw}</span>`;
        }
        tagsContainer.innerHTML = tagsHtml;

        // 显示内容
        document.getElementById('main-content').style.opacity = '1';
    }

    function showError(msg) {
        const errorDiv = document.getElementById('error-msg');
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `<h3>出错了</h3><p>${msg}</p>`;
        document.getElementById('main-content').style.display = 'none';
    }
});
