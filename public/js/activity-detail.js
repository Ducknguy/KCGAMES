async function loadActivityDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    try {
        const res = await fetch("/public/data/hoatdong.json");
        if (!res.ok) throw new Error("Không load được hoatdong.json");
        const data = await res.json();

        const item = data.find(a => a.id === id);
        if (!item) {
            document.getElementById("detail-wrapper").innerHTML =
                "<p>Không tìm thấy hoạt động.</p>";
            return;
        }

        const dateStr = new Date(item.date).toLocaleDateString("vi-VN");

        document.getElementById("detail-title").innerText = item.title;
        document.getElementById("detail-date").innerText = dateStr;
        document.getElementById("detail-cover-img").src = item.image;
        document.getElementById("detail-cover-img").alt = item.title;
        document.getElementById("detail-content").innerText = item.content || "";

        const galleryEl = document.getElementById("detail-gallery");
        if (item.gallery && item.gallery.length) {
            galleryEl.innerHTML = item.gallery
                .map(src => `<img src="${src}" alt="${item.title}">`)
                .join("");
            initLightbox();
        } else {
            document.getElementById("detail-gallery-section").style.display = "none";
        }

        // === NEXT / PREVIOUS === (PHẢI NẰM TRONG HÀM NÀY)
        const currentIndex = data.findIndex(a => a.id === id);

        const prevBtn = document.getElementById("prev-activity");
        const nextBtn = document.getElementById("next-activity");

        // Có hoạt động trước
        if (currentIndex > 0) {
            const prevId = data[currentIndex - 1].id;
            prevBtn.onclick = () => {
                window.location.href = `/detail?id=${encodeURIComponent(prevId)}`;
            };
        } else {
            prevBtn.disabled = true;
        }

        // Có hoạt động tiếp theo
        if (currentIndex < data.length - 1) {
            const nextId = data[currentIndex + 1].id;
            nextBtn.onclick = () => {
                window.location.href = `/detail?id=${encodeURIComponent(nextId)}`;
            };
        } else {
            nextBtn.disabled = true;
        }

        initScrollReveal();
    } catch (err) {
        console.error(err);
    }
}

function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("lightbox-close");

    document.querySelectorAll(".detail-gallery img").forEach(img => {
        img.addEventListener("click", () => {
            lightboxImg.src = img.src;
            lightbox.style.display = "flex";
        });
    });

    const close = () => {
        lightbox.style.display = "none";
        lightboxImg.src = "";
    };

    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") close();
    });
}

function initScrollReveal() {
    const elements = document.querySelectorAll(".scroll-reveal");
    const reveal = () => {
        const trigger = window.innerHeight * 0.85;
        elements.forEach(el => {
            const rectTop = el.getBoundingClientRect().top;
            if (rectTop < trigger) el.classList.add("active");
        });
    };
    window.addEventListener("scroll", reveal);
    reveal();
}

function initializeMobileMenu() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');

    if (mobileToggle && navbar) {
        const menuIcon = mobileToggle.querySelector('i');

        mobileToggle.addEventListener('click', () => {
            navbar.classList.toggle('active');

            if (navbar.classList.contains('active')) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }
}
async function loadHTML(url, containerId, callback = () => { }) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const htmlContent = await response.text();

        document.getElementById(containerId).innerHTML = htmlContent;
        callback();

    } catch (error) {
        console.error("Error loading HTML:", error);
    }
}
function loadGTranslate() {
    window.gtranslateSettings = {
        "default_language": "vi",
        "languages": ["vi", "en"],
        "wrapper_selector": ".gtranslate_wrapper",
        "detect_browser_language": true,
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.gtranslate.net/widgets/latest/dropdown.js';
    document.body.appendChild(script);
}
function afterHeaderLoad() {
    setActiveNav();
    initializeMobileMenu();
    loadGTranslate();
}


loadHTML('/public/html/client/header.html', 'header_hoatdong', afterHeaderLoad);
loadHTML('/public/html/client/footer.html', 'footer_hoatdong');


document.addEventListener("DOMContentLoaded", loadActivityDetail);
