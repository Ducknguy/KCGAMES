// Load 1 file HTML vào containerId, rồi gọi callback (nếu có)
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

        if (typeof callback === "function") {
            callback();
        }
    } catch (error) {
        console.error("Error loading HTML:", error);
    }
}

// Hiệu ứng scroll-reveal cho các phần tử có class .scroll-reveal
function setupScrollReveal() {
    const elements = document.querySelectorAll(".scroll-reveal");
    if (!elements.length) return;

    const reveal = () => {
        const trigger = window.innerHeight * 0.55;

        elements.forEach(el => {
            const rectTop = el.getBoundingClientRect().top;
            if (rectTop < trigger) {
                el.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", reveal);
    reveal();
}

// GTranslate
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

// Callback sau khi header.html được load xong
function afterHeaderLoad() {
    // Dùng initHeader() từ header.js để:
    // - set padding-top cho body
    // - gắn blur khi scroll
    // - setup mobile menu + active nav
    if (typeof initHeader === "function") {
        initHeader();
    } else if (typeof setActiveNav === "function") {
        // fallback nếu header.js cũ
        setActiveNav();
    }

    loadGTranslate();
}

// Khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    // Load header/footer riêng của trang giới thiệu
    loadHTML("/public/html/client/header.html", "header_gioi_thieu", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_gioi_thieu");

    // Scroll reveal cho nội dung trang
    setupScrollReveal();
});
