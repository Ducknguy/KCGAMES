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
            console.error(`LỖI: Không tìm thấy container ID '${containerId}'`);
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
    // Dùng initHeader() từ header.js:
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

// =============== XỬ LÝ FORM LIÊN HỆ ===============
function setupContactForm() {
    const form = document.getElementById("section-content");

    if (!form) {
        console.error("LỖI KHÔNG TÌM THẤY: Form với ID 'section-content' không tồn tại.");
        return;
    }

    const submitButton = document.querySelector("#btn_send");

    if (!submitButton) {
        console.error("LỖI KHÔNG TÌM THẤY: Button với ID 'btn_send' không tồn tại.");
        return;
    }

    const SERVER_ENDPOINT = "/api/send-contact";

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const urlSearchParams = new URLSearchParams(formData);
        const bodyEncoded = urlSearchParams.toString();

        submitButton.disabled = true;
        submitButton.textContent = "Đang gửi...";

        fetch(SERVER_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyEncoded,
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((data) => {
                        throw new Error(
                            data.message || `Lỗi không xác định (Mã: ${response.status})`
                        );
                    });
                }
                return response.json();
            })
            .then((data) => {
                if (data.success) {
                    alert("✅ Gửi thông tin thành công");
                    form.reset();
                } else {
                    throw new Error(data.message || "Gửi đơn không thành công");
                }
            })
            .catch((error) => {
                console.error("Lỗi gửi đơn:", error);
                alert(`❌ Gửi đơn không thành công. Chi tiết lỗi: ${error.message}`);
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = "GỬI ĐƠN LIÊN HỆ";
            });
    });
}

// =============== ENTRY POINT ===============
document.addEventListener("DOMContentLoaded", () => {
    // Header & footer cho trang Liên hệ
    loadHTML("/public/html/client/header.html", "header_lienhe", afterHeaderLoad);
    loadHTML("/public/html/client/footer.html", "footer_lienhe");

    // Form liên hệ
    setupContactForm();
});
