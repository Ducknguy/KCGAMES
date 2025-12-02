// =============== LOAD HTML CHUNG ===============
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

// =============== GTRANSLATE ===============
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

// =============== HEADER CALLBACK ===============
function afterHeaderLoad() {
    // Dùng initHeader() trong header.js:
    // - fixed header + blur
    // - auto padding body
    // - mobile menu + active nav
    if (typeof initHeader === "function") {
        initHeader();
    } else if (typeof setActiveNav === "function") {
        // fallback nếu lỡ dùng header.js cũ
        setActiveNav();
    }

    loadGTranslate();
}

// =============== ENTRY POINT ===============
document.addEventListener("DOMContentLoaded", () => {
    // Header & footer cho trang Game Design
    loadHTML("/public/html/client/header.html", "header_gamedesigne", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_gamedesigne");
});
