// 导航菜单交互
let navMenu, navToggle, nav;

// 初始化导航菜单
function initNavMenu() {
    navMenu = document.querySelector('.nav-menu');
    nav = document.querySelector('.nav');

    if (!navMenu || !nav) {
        return; // 如果导航栏还没加载，跳过初始化
    }

    // 检查是否已经添加了切换按钮
    let existingToggle = nav.querySelector('.nav-toggle');
    if (existingToggle) {
        navToggle = existingToggle;
    } else {
        navToggle = document.createElement('button');
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
        nav.insertBefore(navToggle, navMenu);

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
    }

    // 初始化响应式状态
    handleResize();
}

// 响应式导航
function handleResize() {
    if (!navMenu || !navToggle) return;

    if (window.innerWidth <= 768) {
        navToggle.style.display = 'block';
        navMenu.style.display = 'none';
    } else {
        navToggle.style.display = 'none';
        navMenu.style.display = 'flex';
    }
}


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
    // 初始化导航菜单（如果已存在于静态 HTML 中）
    initNavMenu();

    // 初始化下拉菜单
    initDropdowns();
    console.log('Dropdown script loaded');
});

// 监听组件动态加载完成事件（用于动态加载导航栏的场景）
document.addEventListener('componentsLoaded', () => {
    console.log('Components loaded, reinitializing navigation...');
    initNavMenu();
    initDropdowns();
});

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



// 窗口大小变化时重新计算
window.addEventListener('resize', handleResize);

// 智能体JavaScript嵌入代码
window.addEventListener('DOMContentLoaded', () => {
    try {
        window.tip_jimo_color = '#fff';
        window.tip_jimo_bg = '#4C83F3';
        window.jimo_iframe_src = 'https://jimoai.xiaohuodui.cn/chat/hamNgarPYv5g9ABR';

        if (!document.querySelector('script[src="https://jimoai.xiaohuodui.cn/js/iframe1.js"]')) {
            var aiScript = document.createElement('script');
            aiScript.src = 'https://jimoai.xiaohuodui.cn/js/iframe1.js';
            aiScript.async = true;
            document.body.appendChild(aiScript);
        }

        var buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
            z-index: 9998;
        `;

        var contactButton = document.createElement('button');
        contactButton.innerHTML = '联系我们';
        contactButton.style.cssText = `
            width: 130px;
            height: 45px;
            background-color: white;
            color: #333;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            text-align: center;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        contactButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        });
        contactButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        });
        contactButton.addEventListener('click', function() {});

        var demoButton = document.createElement('button');
        demoButton.innerHTML = '预约演示';
        demoButton.style.cssText = `
            width: 130px;
            height: 45px;
            background-color: white;
            color: #333;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            text-align: center;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        demoButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        });
        demoButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        });
        demoButton.addEventListener('click', function() {
            window.open('https://ai-form.xiaohuodui.cn/s/Q3pdh3nT', '_blank');
        });

        var backToTopButton = document.createElement('button');
        backToTopButton.innerHTML = '↑';
        backToTopButton.style.cssText = `
            width: 45px;
            height: 45px;
            background-color: white;
            color: #333;
            border: 1px solid #e0e0e0;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.3s ease;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        backToTopButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        });
        backToTopButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        });
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        buttonContainer.appendChild(contactButton);
        buttonContainer.appendChild(demoButton);
        buttonContainer.appendChild(backToTopButton);

        document.body.appendChild(buttonContainer);

        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
        });

        console.log('智能体嵌入脚本已加载');
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
    bottomRightResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });

    // 左侧调整
    leftResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startWidth = dialog.offsetWidth;

        document.addEventListener('mousemove', resizeLeft);
        document.addEventListener('mouseup', stopResize);
    });

    // 右侧调整
    rightResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startWidth = dialog.offsetWidth;

        document.addEventListener('mousemove', resizeRight);
        document.addEventListener('mouseup', stopResize);
    });

    // 顶部调整
    topResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = dialog.offsetHeight;

        document.addEventListener('mousemove', resizeTop);
        document.addEventListener('mouseup', stopResize);
    });

    // 底部调整
    bottomResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startY = e.clientY;
        startHeight = dialog.offsetHeight;

        document.addEventListener('mousemove', resizeBottom);
        document.addEventListener('mouseup', stopResize);
    });

    // 右上角调整
    topRightResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;

        document.addEventListener('mousemove', resizeTopRight);
        document.addEventListener('mouseup', stopResize);
    });

    // 左下角调整
    bottomLeftResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = dialog.offsetWidth;
        startHeight = dialog.offsetHeight;

        document.addEventListener('mousemove', resizeBottomLeft);
        document.addEventListener('mouseup', stopResize);
    });

    // 左上角调整
    topLeftResizer.addEventListener('mousedown', function (e) {
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

// 企业微信二维码弹窗功能
window.addEventListener('DOMContentLoaded', function() {
    // 创建二维码弹窗
    function createWechatModal() {
        // 检查是否已存在弹窗
        if (document.getElementById('wechat-modal')) {
            return;
        }
        
        // 创建弹窗容器
        const modal = document.createElement('div');
        modal.id = 'wechat-modal';
        modal.className = 'modal';
        
        // 弹窗内容
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <div class="modal-body">
                    <img src="../assets/contact/wechat_code.jpg" alt="企业微信二维码" class="modal-qr">
                    <p class="modal-text">扫码添加企业微信</p>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // 点击外部关闭
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // 创建弹窗
    createWechatModal();
    
    // 为所有"联系我们"按钮添加点击事件
    function addContactButtonListeners() {
        // 选择所有包含"联系我们"文本的按钮
        const contactButtons = Array.from(document.querySelectorAll('button, .btn')).filter(btn => {
            return btn.textContent && btn.textContent.includes('联系我们');
        });
        
        // 为每个按钮添加点击事件
        contactButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                // 阻止默认行为（如果有）
                e.preventDefault();
                
                // 显示弹窗
                const modal = document.getElementById('wechat-modal');
                if (modal) {
                    modal.style.display = 'block';
                }
            });
        });
    }
    
    // 初始添加事件监听器
    addContactButtonListeners();
    
    // 监听DOM变化，处理动态加载的按钮
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                // 重新添加事件监听器
                addContactButtonListeners();
            }
        });
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 同时更新智能体中的联系我们按钮
    setTimeout(function() {
        const contactButton = document.querySelector('.contact-button');
        if (contactButton) {
            contactButton.addEventListener('click', function(e) {
                e.preventDefault();
                const modal = document.getElementById('wechat-modal');
                if (modal) {
                    modal.style.display = 'block';
                }
            });
        }
    }, 1000);
});
