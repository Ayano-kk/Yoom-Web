// 导航菜单交互
const navMenu = document.querySelector('.nav-menu');
const navToggle = document.createElement('button');
navToggle.innerHTML = '☰';
navToggle.className = 'nav-toggle';
navToggle.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    display: none;
    color: #606266;
`;

// 添加到导航栏
const nav = document.querySelector('.nav');
nav.insertBefore(navToggle, navMenu);

// 响应式导航
function handleResize() {
    if (window.innerWidth <= 768) {
        navToggle.style.display = 'block';
        navMenu.style.display = 'none';
    } else {
        navToggle.style.display = 'none';
        navMenu.style.display = 'flex';
    }
}

// 切换菜单显示
navToggle.addEventListener('click', () => {
    if (navMenu.style.display === 'none' || navMenu.style.display === '') {
        navMenu.style.display = 'flex';
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = `${nav.offsetHeight}px`;
        navMenu.style.left = '0';
        navMenu.style.width = '100%';
        navMenu.style.background = '#3758f9';
        navMenu.style.color = 'white';
        navMenu.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.1)';
        navMenu.style.padding = '20px';
        navMenu.style.gap = '20px';
    } else {
        navMenu.style.display = 'none';
    }
});

// 下拉菜单功能初始化
function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    const allMenus = document.querySelectorAll('.nav-item.dropdown .dropdown-menu');
    let currentOpenItem = null;
    let timers = new Map();
    
    // 移除所有现有的事件监听器
    dropdownToggles.forEach(toggle => {
        toggle.onclick = null;
    });
    
    dropdownItems.forEach(item => {
        item.onmouseenter = null;
        item.onmouseleave = null;
        const dropdownMenu = item.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.onmouseenter = null;
            dropdownMenu.onmouseleave = null;
        }
    });
    
    // 关闭除指定项外的所有菜单
    function hideOthers(exceptItem) {
        allMenus.forEach(menu => {
            if (!exceptItem || menu !== exceptItem.querySelector('.dropdown-menu')) {
                menu.classList.remove('show');
            }
        });
    }
    
    // 移动端下拉菜单支持
    if (window.innerWidth <= 768) {
        dropdownItems.forEach(it => it.classList.remove('open'));
        dropdownToggles.forEach(toggle => {
            if (!toggle.dataset.mobileInit) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const item = toggle.closest('.nav-item.dropdown');
                    const isOpen = item.classList.contains('open');
                    // 若已展开则收起；否则先关闭其他再展开当前
                    if (isOpen) {
                        item.classList.remove('open');
                    } else {
                        dropdownItems.forEach(it => it.classList.remove('open'));
                        item.classList.add('open');
                    }
                });
                toggle.dataset.mobileInit = '1';
            }
        });
    } 
    // 桌面端下拉菜单延时关闭功能
    else {
        dropdownItems.forEach((item, index) => {
            const dropdownMenu = item.querySelector('.dropdown-menu');
            let timeoutId = null;
            
            // 当鼠标进入下拉菜单或父项时，清除延时并显示菜单
            item.addEventListener('mouseenter', () => {
                clearTimeout(timeoutId);
                // 进入新项时，先关闭其他菜单
                hideOthers(item);
                if (dropdownMenu) {
                    dropdownMenu.classList.add('show');
                }
                item.classList.add('open');
                currentOpenItem = item;
                // 清除之前项的关闭定时器
                if (timers.has(item)) {
                    clearTimeout(timers.get(item));
                    timers.delete(item);
                }
            });
            
            if (dropdownMenu) {
                dropdownMenu.addEventListener('mouseenter', () => {
                    clearTimeout(timeoutId);
                    dropdownMenu.classList.add('show');
                    item.classList.add('open');
                });
                
                // 当鼠标离开下拉菜单或父项时，设置延时关闭菜单
                item.addEventListener('mouseleave', (e) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        dropdownMenu.classList.remove('show');
                        item.classList.remove('open');
                        if (currentOpenItem === item) currentOpenItem = null;
                    }, 300);
                    timers.set(item, timeoutId);
                });
                
                dropdownMenu.addEventListener('mouseleave', (e) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        dropdownMenu.classList.remove('show');
                        item.classList.remove('open');
                        if (currentOpenItem === item) currentOpenItem = null;
                    }, 300);
                    timers.set(item, timeoutId);
                });
            }
        });
    }
}

// 添加全局调试开关
const DEBUG = true;

// 窗口大小变化时重新初始化下拉菜单
window.addEventListener('resize', initDropdowns);
window.addEventListener('orientationchange', initDropdowns);
window.addEventListener('pageshow', initDropdowns);

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    handleResize();
    
    // 初始化下拉菜单
    initDropdowns();
    console.log('Dropdown script loaded');
    
    // FAQ交互
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        // 初始隐藏答案
        if (answer) {
            answer.style.display = 'none';
            
            question.addEventListener('click', () => {
                const isOpen = answer.style.display === 'block';
                
                // 关闭所有其他FAQ
                faqItems.forEach(otherItem => {
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherQuestion = otherItem.querySelector('.faq-question');
                    if (otherAnswer) otherAnswer.style.display = 'none';
                    if (otherQuestion) otherQuestion.style.fontWeight = '500';
                });
                
                // 切换当前FAQ
                if (!isOpen) {
                    answer.style.display = 'block';
                    question.style.fontWeight = '600';
                }
            });
        }
    });
    
    // 页面滚动效果
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.1)';
            }
        }
    });
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href === '#!' || href.length <= 1) {
                return;
            }
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 添加滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 为所有区块添加动画
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // 价格卡片点击选择功能
    const pricingCards = document.querySelectorAll('.pricing-card');
    if (DEBUG) console.log('Found pricing cards:', pricingCards.length);
    
    pricingCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (DEBUG) console.log(`Pricing card ${index} clicked`);
            // 移除所有卡片的active类
            pricingCards.forEach((c, i) => {
                if (DEBUG) console.log(`Removing active class from card ${i}`);
                c.classList.remove('active');
                if (DEBUG) console.log(`Card ${i} classList after remove:`, c.classList);
            });
            // 为当前点击的卡片添加active类
            if (DEBUG) console.log(`Adding active class to card ${index}`);
            card.classList.add('active');
            if (DEBUG) console.log(`Card ${index} classList after add:`, card.classList);
        });
    });
});

// 窗口大小变化时重新计算
window.addEventListener('resize', handleResize);

// 智能体JavaScript嵌入代码
window.addEventListener('DOMContentLoaded', () => {
    try {
        // 配置智能体参数
        window.tip_jimo_color = '#fff';
        window.tip_jimo_bg = '#175cba'; // 使用与顶部导航栏相同的颜色
        window.jimo_iframe_src = 'https://jimoai.xiaohuodui.cn/chat/F7994IYYwVx9TYYU';
        
        // 创建一个自定义的智能体按钮
        var agentButton = document.createElement('button');
        agentButton.innerHTML = '🤖 AI助手';
        agentButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 120px;
            height: 40px;
            background-color: #175cba;
            color: white;
            border: none;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            z-index: 9998;
            font-size: 14px;
            font-weight: 500;
        `;
        
        // 创建智能体对话框
        var agentDialog = document.createElement('div');
        agentDialog.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            width: 420px;
            height: 600px;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            background-color: white;
            overflow: hidden;
            display: none;
            min-width: 250px;
            min-height: 300px;
        `;
        
        // 创建顶部栏
        var dialogHeader = document.createElement('div');
        dialogHeader.style.cssText = `
            height: 50px;
            background-color: #175cba;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 15px;
            font-size: 16px;
            font-weight: 500;
            position: relative;
            z-index: 10;
        `;
        dialogHeader.innerHTML = `
            <span>智能助手</span>
            <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
        `;
        
        // 创建内容区域
        var dialogContent = document.createElement('div');
        dialogContent.style.cssText = `
            height: calc(100% - 50px);
            overflow: hidden;
            position: relative;
        `;
        
        // 创建iframe
        var iframe = document.createElement('iframe');
        iframe.src = window.jimo_iframe_src;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;
        
        // 组合元素
        dialogContent.appendChild(iframe);
        agentDialog.appendChild(dialogHeader);
        agentDialog.appendChild(dialogContent);
        
        // 添加到页面
        document.body.appendChild(agentButton);
        document.body.appendChild(agentDialog);
        
        // 点击按钮显示/隐藏对话框
        agentButton.addEventListener('click', function() {
            agentDialog.style.display = agentDialog.style.display === 'block' ? 'none' : 'block';
        });
        
        // 点击关闭按钮
        dialogHeader.querySelector('button').addEventListener('click', function() {
            agentDialog.style.display = 'none';
        });
        
        // 添加可调整大小功能
        makeResizable(agentDialog, dialogContent, iframe);
        
        console.log('智能体对话框已成功添加到页面');
    } catch (error) {
        console.error('智能体加载失败:', error);
    }
});

// 可调整大小函数
function makeResizable(dialog, content, iframe) {
    // 设置最小尺寸
    const MIN_WIDTH = 250;
    const MIN_HEIGHT = 300;
    
    var startX, startY, startWidth, startHeight;
    
    // 创建调整器函数
    function createResizer(position, width, height, cursor) {
        var resizer = document.createElement('div');
        resizer.style.cssText = `
            position: absolute;
            ${position};
            width: ${width};
            height: ${height};
            cursor: ${cursor};
            z-index: 100;
            background: transparent;
        `;
        dialog.appendChild(resizer);
        return resizer;
    }
    
    // 右下角调整
    var bottomRightResizer = createResizer('bottom: 0; right: 0;', '20px', '20px', 'nwse-resize');
    
    // 左侧调整
    var leftResizer = createResizer('bottom: 0; left: 0;', '10px', '100%;', 'ew-resize');
    
    // 右侧调整
    var rightResizer = createResizer('top: 0; right: 0;', '10px', '100%;', 'ew-resize');
    
    // 顶部调整
    var topResizer = createResizer('top: 0; left: 0;', '100%;', '10px', 'ns-resize');
    
    // 底部调整
    var bottomResizer = createResizer('bottom: 0; left: 0;', '100%;', '10px', 'ns-resize');
    
    
    // 右上角调整
    var topRightResizer = createResizer('top: 0; right: 0;', '20px', '20px', 'nesw-resize');
    
    // 左下角调整
    var bottomLeftResizer = createResizer('bottom: 0; left: 0;', '20px', '20px', 'nesw-resize');
    
    // 左上角调整
    var topLeftResizer = createResizer('top: 0; left: 0;', '20px', '20px', 'nwse-resize');
    
    // 右下角调整
    bottomRightResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 左侧调整
    leftResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startWidth = dialog.offsetWidth;
        
        document.addEventListener('mousemove', resizeLeft);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 右侧调整
    rightResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startWidth = dialog.offsetWidth;
        
        document.addEventListener('mousemove', resizeRight);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 顶部调整
    topResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resizeTop);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 底部调整
    bottomResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resizeBottom);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 右上角调整
    topRightResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resizeTopRight);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 左下角调整
    bottomLeftResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resizeBottomLeft);
        document.addEventListener('mouseup', stopResize);
    });
    
    // 左上角调整
    topLeftResizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;
        
        document.addEventListener('mousemove', resizeTopLeft);
        document.addEventListener('mouseup', stopResize);
    });
    
    function resize(e) {
        var width = startWidth + (e.clientX - startX);
        var height = startHeight + (e.clientY - startY);
        
        if (width >= MIN_WIDTH) {
            dialog.style.width = width + 'px';
        }
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function resizeLeft(e) {
        var width = startWidth + (startX - e.clientX);
        
        if (width >= MIN_WIDTH) {
            // 只调整宽度，不修改right属性，保持窗口位置稳定
            dialog.style.width = width + 'px';
        }
    }
    
    function resizeRight(e) {
        var width = startWidth + (e.clientX - startX);
        
        if (width >= MIN_WIDTH) {
            dialog.style.width = width + 'px';
        }
    }
    
    function resizeTop(e) {
        var height = startHeight + (startY - e.clientY);
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            dialog.style.bottom = (window.innerHeight - (dialog.getBoundingClientRect().top + height)) + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function resizeBottom(e) {
        var height = startHeight + (e.clientY - startY);
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function resizeTopRight(e) {
        var width = startWidth + (e.clientX - startX);
        var height = startHeight + (startY - e.clientY);
        
        if (width >= MIN_WIDTH) {
            dialog.style.width = width + 'px';
        }
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function resizeBottomLeft(e) {
        var width = startWidth + (startX - e.clientX);
        var height = startHeight + (e.clientY - startY);
        
        if (width >= MIN_WIDTH) {
            dialog.style.width = width + 'px';
        }
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function resizeTopLeft(e) {
        var width = startWidth + (startX - e.clientX);
        var height = startHeight + (startY - e.clientY);
        
        if (width >= MIN_WIDTH) {
            // 只调整宽度，不修改right属性，保持窗口位置稳定
            dialog.style.width = width + 'px';
        }
        
        if (height >= MIN_HEIGHT) {
            dialog.style.height = height + 'px';
            dialog.style.bottom = (window.innerHeight - (dialog.getBoundingClientRect().top + height)) + 'px';
            content.style.height = (height - 50) + 'px';
        }
    }
    
    function stopResize() {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mousemove', resizeLeft);
        document.removeEventListener('mousemove', resizeRight);
        document.removeEventListener('mousemove', resizeTop);
        document.removeEventListener('mousemove', resizeBottom);
        document.removeEventListener('mousemove', resizeTopRight);
        document.removeEventListener('mousemove', resizeBottomLeft);
        document.removeEventListener('mousemove', resizeTopLeft);
        document.removeEventListener('mouseup', stopResize);
    }
}
