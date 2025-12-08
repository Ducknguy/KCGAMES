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
    // Dùng initHeader() trong header.js
    if (typeof initHeader === "function") {
        initHeader();
    } else if (typeof setActiveNav === "function") {
        // fallback nếu lỡ dùng header.js cũ
        setActiveNav();
    }

    loadGTranslate();
}

// =============== JOB ACCORDION ===============
function initJobAccordion() {
    const jobCards = document.querySelectorAll(".job-card");
    if (!jobCards.length) return;

    jobCards.forEach((card) => {
        const header = card.querySelector(".job-header");
        const icon = card.querySelector(".job-expand-icon");

        if (!header) return;

        header.addEventListener("click", () => {
            const isActive = card.classList.contains("job-card--active");

            // Đóng tất cả
            jobCards.forEach((c) => {
                c.classList.remove("job-card--active");
                const i = c.querySelector(".job-expand-icon");
                if (i) i.classList.remove("job-expand-icon--open");
            });

            // Nếu job hiện tại chưa active thì mở
            if (!isActive) {
                card.classList.add("job-card--active");
                if (icon) icon.classList.add("job-expand-icon--open");
            }
        });
    });
}

// =============== REVEAL ANIMATION ===============
function setupRevealObserver() {
    const revealEls = document.querySelectorAll(".reveal, .reveal--zoom");
    if (!revealEls.length) return;

    // Fallback nếu trình duyệt không hỗ trợ IntersectionObserver
    if (!("IntersectionObserver" in window)) {
        revealEls.forEach(el => el.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;

                // Delay: lấy từ data-delay nếu có (vd: data-delay="0.2s")
                const delay = el.getAttribute("data-delay");
                if (delay) {
                    el.style.transitionDelay = delay;
                }

                if (el.classList.contains("reveal") || el.classList.contains("reveal--zoom")) {
                    el.classList.add("is-visible");
                }

                // chỉ chạy 1 lần
                obs.unobserve(el);
            });
        },
        {
            threshold: 0.2
        }
    );

    revealEls.forEach(el => observer.observe(el));
}

// =============== ENTRY POINT ===============
document.addEventListener("DOMContentLoaded", () => {
    // Header & footer
    loadHTML("/public/html/client/header.html", "header_tuyendung", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_tuyendung");

    // Accordion cho danh sách job
    initJobAccordion();

    // Hiệu ứng reveal
    setupRevealObserver();
});
