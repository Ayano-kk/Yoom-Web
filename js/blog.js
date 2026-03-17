document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('blog-grid');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('blog.json');
        if (!response.ok) throw new Error('无法加载文章数据');
        const data = await response.json();

        // 模拟网络延迟
        setTimeout(() => {
            loading.style.display = 'none';
            renderPosts(data.posts);
        }, 300);

    } catch (error) {
        console.error(error);
        loading.innerHTML = '<p style="color:red; text-align:center;">数据加载失败</p>';
    }

    function renderPosts(posts) {
        if (!posts || posts.length === 0) {
            grid.innerHTML = '<p>暂无文章</p>';
            return;
        }

        posts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'blog-post';

            // 从path中提取id，例如 "blog/View.html?id=1765522517" -> "1765522517"
            const idMatch = post.path ? post.path.match(/id=(\d+)/) : null;
            const postId = idMatch ? idMatch[1] : '';

            article.addEventListener('click', () => {
                window.location.href = post.path || `blog/View.html?id=${postId}`;
            });
            article.style.cursor = 'pointer';

            // 使用默认图片，content作为摘要
            const defaultImage = '../assets/blog/blog-01.jpg';
            const excerpt = post.content || '';

            article.innerHTML = `
                <div class="blog-post-image">
                    <img src="${post.image || defaultImage}" alt="${post.title}" loading="lazy">
                </div>
                <div class="blog-post-content">
                    <div class="blog-post-meta">
                        <span>${post.date}</span>${post.category ? ' · <span>' + post.category + '</span>' : ''}
                    </div>
                    <h3>
                        <a href="${post.path || 'blog/View.html?id=' + postId}">${post.title}</a>
                    </h3>
                    <p>${excerpt}</p>
                </div>
            `;
            grid.appendChild(article);
        });
    }
});
