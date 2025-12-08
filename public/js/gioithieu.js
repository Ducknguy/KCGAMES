// /public/js/gioithieu.js

// ================== REVEAL ON SCROLL (IntersectionObserver) ==================
function setupRevealObserver() {
    const revealEls = document.querySelectorAll(".reveal, .reveal--zoom, .scroll-reveal");
    if (!revealEls.length) return;

    // Fallback nếu trình duyệt không có IntersectionObserver
    if (!("IntersectionObserver" in window)) {
        revealEls.forEach(el => {
            el.classList.add("is-visible");
            if (el.classList.contains("scroll-reveal")) {
                el.classList.add("active");
            }
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;

                // Delay: lấy từ data-delay nếu có (vd data-delay="0.2s")
                const delay = el.getAttribute("data-delay");
                if (delay) {
                    el.style.transitionDelay = delay;
                }

                // Hệ mới: .reveal / .reveal--zoom
                if (el.classList.contains("reveal") || el.classList.contains("reveal--zoom")) {
                    el.classList.add("is-visible");
                }

                // Hệ cũ: .scroll-reveal
                if (el.classList.contains("scroll-reveal")) {
                    el.classList.add("active");
                }

                // Chỉ cần animate 1 lần
                obs.unobserve(el);
            });
        },
        {
            threshold: 0.2 // nhìn thấy 20% là bắt đầu animate
        }
    );

    revealEls.forEach(el => observer.observe(el));
}

// ================== LOAD HTML CHUNG (header / footer) ==================
async function loadHTML(url, containerId, callback = () => { }) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const htmlContent = await response.text();
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn("Không tìm thấy container:", containerId);
            return;
        }

        container.innerHTML = htmlContent;

        if (typeof callback === "function") {
            callback();
        }
    } catch (error) {
        console.error("Error loading HTML:", error);
    }
}

// ================== GTRANSLATE ==================
function loadGTranslate() {
    window.gtranslateSettings = {
        default_language: "vi",
        languages: ["vi", "en"],
        wrapper_selector: ".gtranslate_wrapper",
        detect_browser_language: true,
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdn.gtranslate.net/widgets/latest/dropdown.js";
    document.body.appendChild(script);
}

// ================== SAU KHI HEADER LOAD XONG ==================
function afterHeaderLoad() {
    // initHeader() ở header.js:
    // - set padding-top cho body
    // - blur khi scroll
    // - mobile menu + active nav
    if (typeof initHeader === "function") {
        initHeader();
    } else if (typeof setActiveNav === "function") {
        // fallback nếu header.js bản cũ
        setActiveNav();
    }

    loadGTranslate();

    // nếu trong header có .reveal / .scroll-reveal thì bắt lại
    setupRevealObserver();
}

// ================== ENTRY CHÍNH ==================
document.addEventListener("DOMContentLoaded", () => {
    // 1) Load header/footer
    loadHTML("/public/html/client/header.html", "header_gioi_thieu", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_gioi_thieu", () => {
        // nếu footer sau này có dùng reveal thì cũng bắt luôn
        setupRevealObserver();
    });

    // 2) Reveal cho phần nội dung đang có sẵn trong trang
    setupRevealObserver();
});
