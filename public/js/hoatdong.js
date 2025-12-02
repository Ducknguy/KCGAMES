// ================== LOAD HTML CHUNG ==================
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

// ================== LOAD HOẠT ĐỘNG ==================
async function loadActivities() {
    try {
        const res = await fetch("/public/data/hoatdong.json");
        if (!res.ok) throw new Error("Không load được hoatdong.json");
        const data = await res.json();

        // sort: mới nhất lên trước
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        const container = document.getElementById("activity-list");
        if (!container) {
            console.warn("Không tìm thấy container #activity-list");
            return;
        }

        container.innerHTML = data
            .map((item) => {
                const dateStr = new Date(item.date).toLocaleDateString("vi-VN");
                return `
                <article class="activity-item scroll-reveal" data-id="${item.id}">
                    <div class="activity-thumb">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="activity-content">
                        <div class="activity-meta">${dateStr}</div>
                        <h2 class="activity-title">${item.title}</h2>
                        <p class="activity-desc">${item.shortDescription}</p>
                        <span class="activity-readmore">
                            Xem chi tiết
                            <i class='bx bx-right-arrow-alt'></i>
                        </span>
                    </div>
                </article>
            `;
            })
            .join("");

        // click -> sang trang chi tiết
        document.querySelectorAll(".activity-item").forEach((card) => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-id");
                window.location.href = `/public/activities/detail.html?id=${encodeURIComponent(
                    id
                )}`;
            });
        });

        initScrollReveal();
    } catch (err) {
        console.error(err);
    }
}

// ================== SCROLL REVEAL ==================
function initScrollReveal() {
    const elements = document.querySelectorAll(".scroll-reveal");
    if (!elements.length) return;

    const reveal = () => {
        const trigger = window.innerHeight * 0.85;
        elements.forEach((el) => {
            const rectTop = el.getBoundingClientRect().top;
            if (rectTop < trigger) el.classList.add("active");
        });
    };

    window.addEventListener("scroll", reveal);
    reveal();
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

// ================== HEADER CALLBACK ==================
function afterHeaderLoad() {
    // Dùng initHeader() từ header.js: fixed header + blur + auto padding + mobile menu + active nav
    if (typeof initHeader === "function") {
        initHeader();
    } else if (typeof setActiveNav === "function") {
        // fallback nếu header.js cũ
        setActiveNav();
    }

    loadGTranslate();
}

// ================== ENTRY POINT ==================
document.addEventListener("DOMContentLoaded", () => {
    // Header & footer riêng trang Hoạt Động
    loadHTML("/public/html/client/header.html", "header_hoatdong", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_hoatdong");

    // Danh sách hoạt động
    loadActivities();
});
