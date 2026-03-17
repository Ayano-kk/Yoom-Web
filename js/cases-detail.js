document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search)
    const caseId = urlParams.get('id')

    if (!caseId) {
        showError('未提供案例 ID (例如: ?id=case001)')
        return
    }

    fetch(`${caseId}.json`)
        .then((response) => {
            if (!response.ok)
                throw new Error(`找不到案例数据文件: ${caseId}.json`)
            return response.json()
        })
        .then((data) => renderPage(data))
        .catch((err) => showError(err.message))

    function renderPage(data) {
        const title = data['标题'] || '无标题'
        document.title = title + ' - 商业案例'
        document.getElementById('dynamic-title').innerText = title

        setContent('dynamic-subtitle', data['副标题'])
        setContent('dynamic-industry', data['行业'], '行业案例')

        const statsContainer = document.getElementById('dynamic-stats')
        if (
            data['核心指标'] &&
            Array.isArray(data['核心指标']) &&
            data['核心指标'].length > 0
        ) {
            statsContainer.innerHTML = data['核心指标']
                .map(
                    (s) => `
                    <div class="stat-item">
                        <div class="stat-value">${s.value}</div>
                        <div class="stat-label">${s.label}</div>
                    </div>
                `,
                )
                .join('')
        } else {
            statsContainer.style.display = 'none'
        }

        const tagsContainer = document.getElementById('dynamic-tags')
        if (data['tag']) {
            const tags = Array.isArray(data['tag'])
                ? data['tag']
                : [data['tag']]
            tagsContainer.innerHTML = tags
                .map((t) => `<span class="case-tag">${t}</span>`)
                .join('')
        } else {
            tagsContainer.style.display = 'none'
        }

        setSection('dynamic-background', data['客户背景'], '.case-section')
        setSection('dynamic-challenge', data['面临挑战'], '.case-section')
        setSection('dynamic-solution', data['解决方案'], '.case-section')
        setSection('dynamic-result', data['实施成果'], '.case-section')

        if (data['客户评价'] && data['客户评价']['内容']) {
            document.getElementById('dynamic-quote-block').style.display =
                'block'
            document.getElementById('dynamic-quote').innerText =
                data['客户评价']['内容']
            document.getElementById('dynamic-quote-author').innerText =
                '— ' + (data['客户评价']['作者'] || '')
        }

        if (data['公司名称']) {
            document.getElementById('dynamic-company').innerText =
                data['公司名称']
        }

        const companyInfo = document.getElementById('dynamic-company-info')
        let infoHtml = ''
        if (data['公司规模']) infoHtml += `<p>规模：${data['公司规模']}</p>`
        if (data['所在地区']) infoHtml += `<p>地区：${data['所在地区']}</p>`
        if (data['使用产品']) infoHtml += `<p>产品：${data['使用产品']}</p>`
        if (!infoHtml)
            document.querySelector('.company-card').style.display = 'none'
        else companyInfo.innerHTML = infoHtml

        document.getElementById('main-content').style.opacity = '1'
    }

    function setContent(id, value, fallback = '') {
        const el = document.getElementById(id)
        if (value) {
            el.innerText = value
        } else if (fallback) {
            el.innerText = fallback
        } else {
            el.style.display = 'none'
        }
    }

    function setSection(id, value, parentSelector) {
        const el = document.getElementById(id)
        if (value) {
            el.innerHTML = value
        } else {
            el.closest(parentSelector).style.display = 'none'
        }
    }

    function showError(msg) {
        document.getElementById('error-msg').style.display = 'block'
        document.getElementById('error-msg').innerHTML =
            `<h3>出错了</h3><p>${msg}</p>`
        document.getElementById('main-content').style.display = 'none'
    }
})
