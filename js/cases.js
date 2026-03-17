document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('cases-grid')
    const filterContainer = document.getElementById('filter-container')

    try {
        // 1. 获取数据
        const response = await fetch('cases-list.json')
        if (!response.ok) throw new Error('无法加载案例数据')
        const data = await response.json()

        // 2. 初始化筛选器
        if (data.categories) {
            data.categories.forEach((cat) => {
                if (cat === '全部') return // 已存在
                const btn = document.createElement('button')
                btn.className = 'filter-btn'
                btn.textContent = cat
                btn.dataset.filter = cat
                filterContainer.appendChild(btn)
            })
        }

        // 3. 渲染函数
        const renderCases = (filter = 'all') => {
            grid.innerHTML = ''

            const filteredCases =
                filter === 'all'
                    ? data.cases
                    : data.cases.filter((item) => item.industry === filter)

            if (filteredCases.length === 0) {
                grid.innerHTML =
                    '<p style="text-align:center; padding:2rem; grid-column:1/-1; color:#999;">该分类下暂无案例</p>'
                return
            }

            filteredCases.forEach((item) => {
                // 构建指标 HTML
                const metricsHtml = item.metrics
                    .slice(0, 3)
                    .map(
                        (m) => `
                        <div class="metric-item">
                            <span class="metric-value">${m.value}</span>
                            <span class="metric-label">${m.label}</span>
                        </div>
                    `,
                    )
                    .join('')

                // 构建卡片 HTML (链接指向 View.html?id=xxx)
                const card = document.createElement('a')
                card.href = `cases/View.html?id=${item.id}`
                card.className = 'case-card'
                card.innerHTML = `
                        <div class="case-card-body">
                            <span class="industry-badge">${item.industry}</span>
                            <h3 class="case-card-title">${item.title}</h3>
                            <p class="case-card-subtitle">${item.subtitle}</p>
                            <div class="case-metrics">
                                ${metricsHtml}
                            </div>
                        </div>
                        <div class="case-card-footer">
                            <span>${item.tags ? item.tags.join(' · ') : ''}</span>
                            <span class="read-more">查看详情</span>
                        </div>
                    `
                grid.appendChild(card)
            })
        }

        // 4. 绑定筛选事件
        filterContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('filter-btn')) return

            // 切换激活状态
            document
                .querySelectorAll('.filter-btn')
                .forEach((b) => b.classList.remove('active'))
            e.target.classList.add('active')

            // 重新渲染
            renderCases(e.target.dataset.filter)
        })

        // 5. 初始渲染
        renderCases()
    } catch (error) {
        console.error(error)
        grid.innerHTML =
            '<p style="color:red; text-align:center;">加载失败，请检查网络或 JSON 文件路径</p>'
    }
})
