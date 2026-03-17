// 价格卡片点击选择功能
document.addEventListener('DOMContentLoaded', () => {
    const pricingCards = document.querySelectorAll('.pricing-card');
    const DEBUG = true; // Or import/share from common if possible, otherwise redefine or remove

    if (pricingCards.length > 0) {
        if (DEBUG) console.log('Found pricing cards:', pricingCards.length);

        pricingCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (DEBUG) console.log(`Pricing card ${index} clicked`);
                // 移除所有卡片的active类
                pricingCards.forEach((c, i) => {
                    c.classList.remove('active');
                });
                // 为当前点击的卡片添加active类
                card.classList.add('active');
            });
        });
    }
});
