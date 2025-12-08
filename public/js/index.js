// ============================
// PRODUCT GALLERY (SLIDER ẢNH)
// ============================
function initProductGallery() {
    const mainImg = document.getElementById('product-main-img');
    const thumbs = document.querySelectorAll('.product-thumb');

    // Nếu trang này không có gallery thì thoát luôn, tránh lỗi
    if (!mainImg || !thumbs.length) return;

    const imageList = Array.from(thumbs).map(btn => btn.dataset.image);
    let currentIndex = 0;
    let autoTimer;

    function setActiveThumb(idx) {
        thumbs.forEach((btn, i) => {
            btn.classList.toggle('is-active', i === idx);
        });
    }

    function showImage(index) {
        if (!imageList[index]) return;
        if (index === currentIndex && mainImg.src.includes(imageList[index])) return;

        currentIndex = index;

        // 1. Ảnh hiện tại mờ + trượt sang trái
        mainImg.classList.add('is-leaving');

        setTimeout(() => {
            // 2. Chuẩn bị trạng thái ảnh mới: ở bên phải + mờ
            mainImg.classList.remove('is-leaving');
            mainImg.classList.add('is-entering');
            mainImg.src = imageList[index];

            // 3. Force reflow để browser áp class is-entering -> rồi remove để animate
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mainImg.classList.remove('is-entering');
                });
            });
        }, 200); // nhỏ hơn thời gian transition 0.4s

        setActiveThumb(index);
    }

    function startAutoSlide() {
        autoTimer = setInterval(() => {
            const next = (currentIndex + 1) % imageList.length;
            showImage(next);
        }, 10000);
    }

    function resetAutoSlide() {
        clearInterval(autoTimer);
        startAutoSlide();
    }

    // Click thumbnail
    thumbs.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            resetAutoSlide();
            showImage(idx);
        });
    });

    // Optional: hover vào vùng media thì pause auto
    const media = document.querySelector('.product-media');
    if (media) {
        media.addEventListener('mouseenter', () => clearInterval(autoTimer));
        media.addEventListener('mouseleave', () => startAutoSlide());
    }

    // Init gallery
    showImage(0);
    startAutoSlide();
}

// ============================
// LOAD HTML PARTIALS (HEADER / FOOTER)
// ============================
async function loadHTML(url, containerId, callback = () => { }) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const htmlContent = await response.text();
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn('Không tìm thấy container:', containerId);
            return;
        }

        container.innerHTML = htmlContent;

        if (typeof callback === 'function') {
            callback();
        }
    } catch (error) {
        console.error('Error loading HTML:', error);
    }
}

// ============================
// SCROLL REVEAL
// ============================
// Hiệu ứng scroll-reveal
function setupScrollReveal() {
    // ĐÚNG: dùng .reveal-on-scroll giống HTML/CSS
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    const reveal = () => {
        const trigger = window.innerHeight * 0.7;

        elements.forEach(el => {
            const rectTop = el.getBoundingClientRect().top;
            if (rectTop < trigger) {
                // ĐÚNG: thêm class .is-visible như CSS đang dùng
                el.classList.add('is-visible');
            }
        });
    };

    window.addEventListener('scroll', reveal);
    reveal();
}

// ============================
// GTRANSLATE
// ============================
function loadGTranslate() {
    window.gtranslateSettings = {
        default_language: 'vi',
        languages: ['vi', 'en'],
        wrapper_selector: '.gtranslate_wrapper',
        detect_browser_language: true,
        flag_size: 24,
        flag_style: "3d",
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.gtranslate.net/widgets/latest/dropdown.js';
    document.body.appendChild(script);
}

// ============================
// DOMContentLoaded – CHẠY TẤT CẢ Ở ĐÂY
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Product gallery (nếu trang có)
    initProductGallery();

    // 2. Header
    loadHTML('/public/html/client/header.html', 'header_home', () => {
        if (typeof initHeader === 'function') {
            initHeader();
        }
        loadGTranslate();
    });

    // 3. Footer
    loadHTML('/public/html/client/footer.html', 'footer_home');

    // 4. Scroll reveal
    setupScrollReveal();
});
