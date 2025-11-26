// /public/team-js/team1.js
// Infinite Carousel kiểu nhân 3 dải + quán tính desktop
// Không dùng scroll-behavior để reset, nên không bị lộ jump

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector(".carousel-wrapper");
    const track = document.querySelector(".member-track");
    const nextBtn = document.querySelector(".next-btn");
    const prevBtn = document.querySelector(".prev-btn");

    if (!wrapper || !track || !nextBtn || !prevBtn) return;

    // -----------------------------
    // 1. Chuẩn bị dữ liệu cơ bản
    // -----------------------------
    const baseCards = Array.from(track.children);
    const baseCount = baseCards.length;

    if (baseCount === 0) return;

    // Lấy chiều rộng 1 card + margin ngang
    const getCardWidth = () => {
        const card = track.querySelector(".member-card");
        if (!card) return 300;

        const rect = card.getBoundingClientRect();
        const style = window.getComputedStyle(card);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;

        return rect.width + marginLeft + marginRight;
    };

    // -----------------------------
    // 2. Nhân track thành 3 lần
    // -----------------------------
    const baseHTML = track.innerHTML;
    track.innerHTML = baseHTML + baseHTML + baseHTML; // 3 dải liên tiếp

    // Sau khi nhân 3, tính lại chiều rộng 1 vòng (reel)
    let reelWidth; // chiều rộng 1 dải = 1 lần danh sách gốc

    const recalcReelWidth = () => {
        // Tổng width chia cho 3 vì mình nhân đúng 3 lần
        reelWidth = track.scrollWidth / 3;
    };

    recalcReelWidth();

    // Đặt scroll ở GIỮA (dải thứ 2) để có buffer 2 bên
    wrapper.scrollLeft = reelWidth;

    // -----------------------------
    // 3. Quán tính kéo (desktop)
    // -----------------------------
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    let velocity = 0;
    let lastX = 0;
    let momentumID = null;

    const stopMomentum = () => {
        if (momentumID) cancelAnimationFrame(momentumID);
        momentumID = null;
        velocity = 0;
    };

    const applyMomentum = () => {
        if (Math.abs(velocity) < 0.1) return;

        wrapper.scrollLeft -= velocity;
        velocity *= 0.95; // độ “trôi” (0.9 = trôi xa hơn, 0.98 = siêu xa)

        momentumID = requestAnimationFrame(applyMomentum);
    };

    // Drag desktop
    wrapper.addEventListener("mousedown", (e) => {
        isDragging = true;
        wrapper.classList.add("dragging");
        wrapper.style.cursor = "grabbing";

        stopMomentum();

        startX = e.clientX;
        startScrollLeft = wrapper.scrollLeft;
        lastX = e.clientX;
        velocity = 0;
    });

    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.classList.remove("dragging");
        wrapper.style.cursor = "grab";

        applyMomentum(); // bắt đầu quán tính
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const x = e.clientX;
        const dx = x - startX;

        wrapper.scrollLeft = startScrollLeft - dx;

        // tính velocity dựa trên di chuyển chuột
        velocity = x - lastX;
        lastX = x;
    });

    // -----------------------------
    // 4. Touch (mobile) – dùng quán tính native
    // -----------------------------
    wrapper.addEventListener("touchstart", (e) => {
        isDragging = true;
        stopMomentum();

        startX = e.touches[0].clientX;
        startScrollLeft = wrapper.scrollLeft;
    });

    document.addEventListener("touchend", () => {
        isDragging = false;
    });

    document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const x = e.touches[0].clientX;
        const dx = x - startX;
        wrapper.scrollLeft = startScrollLeft - dx;
    });

    // -----------------------------
    // 5. Logic loop “vô tận” (không lộ)
    // -----------------------------
    const handleInfiniteLoop = () => {
        const x = wrapper.scrollLeft;

        // Nếu trôi quá sang trái (gần hết dải thứ 1) → đẩy lên +1 dải
        if (x < reelWidth * 0.5) {
            wrapper.scrollLeft = x + reelWidth;
        }
        // Nếu trôi quá sang phải (gần dải thứ 3) → kéo xuống -1 dải
        else if (x > reelWidth * 1.5) {
            wrapper.scrollLeft = x - reelWidth;
        }
        // Do nội dung 3 dải y hệt nhau, việc cộng/trừ reelWidth là “vô hình”
    };

    wrapper.addEventListener("scroll", handleInfiniteLoop);

    // -----------------------------
    // 6. Nút Next / Prev
    // -----------------------------
    let btnAnimID = null;

    const smoothScrollBy = (delta) => {
        stopMomentum();
        if (btnAnimID) cancelAnimationFrame(btnAnimID);

        const start = wrapper.scrollLeft;
        const duration = 300;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // easing nhẹ
            const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
            wrapper.scrollLeft = start + delta * ease;

            if (t < 1) {
                btnAnimID = requestAnimationFrame(animate);
            }
        };

        btnAnimID = requestAnimationFrame(animate);
    };

    nextBtn.addEventListener("click", () => {
        smoothScrollBy(getCardWidth());
    });

    prevBtn.addEventListener("click", () => {
        smoothScrollBy(-getCardWidth());
    });

    // -----------------------------
    // 7. Recalc khi resize (optional)
    // -----------------------------
    window.addEventListener("resize", () => {
        const oldReel = reelWidth;
        recalcReelWidth();
        // Giữ tỉ lệ vị trí khi thay đổi width
        const ratio = wrapper.scrollLeft / oldReel;
        wrapper.scrollLeft = reelWidth * ratio;
    });
});
