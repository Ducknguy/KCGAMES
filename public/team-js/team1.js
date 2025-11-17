// /public/team-js/team1.js - Phiên bản Vòng lặp Vô tận (Infinite Loop)

document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.member-track');
    const wrapper = document.querySelector('.carousel-wrapper');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');

    if (!track || !wrapper || !nextBtn || !prevBtn) return;

    let isDragging = false;
    let startX;
    let scrollLeft;
    let autoSlideInterval;

    // Lấy tất cả các thẻ thành viên gốc (trước khi clone)
    const originalCards = Array.from(track.children);
    const originalCardCount = originalCards.length;
    // Số lượng thẻ clone được thêm vào mỗi bên (nên là 3 để bao phủ màn hình tốt)
    const cloneCount = 3;

    // --- HÀM TÍNH CHIỀU RỘNG THẺ ---
    const getCardWidth = () => {
        // Lấy thẻ thành viên đầu tiên trong danh sách gốc
        const card = originalCards[0];
        if (!card) return 300;
        // Lấy chiều rộng thực tế (offsetWidth) + tổng margin ngang (15px trái + 15px phải = 30px)
        return card.offsetWidth + 30;
    };

    // --- HÀM CLONE VÀ CHÈN THẺ ---
    const cloneCards = () => {
        // 1. Clone các thẻ cuối (originalCardCount - cloneCount) để chèn vào đầu track
        for (let i = originalCardCount - cloneCount; i < originalCardCount; i++) {
            const clone = originalCards[i].cloneNode(true);
            clone.classList.add('clone', 'clone-start');
            track.insertBefore(clone, track.firstElementChild);
        }

        // 2. Clone các thẻ đầu (từ 0) để chèn vào cuối track
        for (let i = 0; i < cloneCount; i++) {
            const clone = originalCards[i].cloneNode(true);
            clone.classList.add('clone', 'clone-end');
            track.appendChild(clone);
        }
    };

    // --- HÀM NHẢY VÒNG LẶP (INSTANT JUMP) ---
    const handleInfiniteLoop = () => {
        const cardWidth = getCardWidth();
        const scrollPosition = wrapper.scrollLeft;

        // Vị trí bắt đầu của các thẻ gốc (sau các thẻ clone đầu)
        const startPosition = cloneCount * cardWidth;

        // Vị trí kết thúc của các thẻ gốc (trước các thẻ clone cuối)
        // Tổng số thẻ = originalCardCount + 2 * cloneCount
        const totalCardsAfterClone = originalCardCount + cloneCount;

        // 1. Khi cuộn qua thẻ gốc cuối cùng (đang xem thẻ clone-end), nhảy về thẻ gốc đầu tiên
        // Kiểm tra nếu vị trí cuộn >= vị trí bắt đầu clone cuối - chiều rộng hiển thị (wrapper.clientWidth)
        // Cộng thêm cardWidth * cloneCount để tính đến các thẻ clone ở đầu.
        if (scrollPosition >= (track.scrollWidth - wrapper.clientWidth) - (cloneCount * cardWidth)) {
            // Nhảy về vị trí startPosition
            wrapper.scroll({ left: startPosition, behavior: 'auto' });
        }

        // 2. Khi cuộn ngược lại qua thẻ gốc đầu tiên (đang xem thẻ clone-start), nhảy về thẻ gốc cuối cùng
        else if (scrollPosition <= 5) {
            // Vị trí để nhảy đến thẻ gốc cuối cùng
            const jumpPosition = (originalCardCount * cardWidth) - (wrapper.clientWidth - cardWidth);
            wrapper.scroll({ left: jumpPosition, behavior: 'auto' });
        }
    };

    // --- LOGIC TRƯỢT TỰ ĐỘNG ---
    const startAutoSlide = () => {
        // Có thể bật lại nếu muốn trượt tự động, nhưng tôi để tạm tắt để ưu tiên điều khiển tay
        // clearInterval(autoSlideInterval);
    };

    const stopAutoSlide = () => {
        // clearInterval(autoSlideInterval);
    };

    // --- LOGIC KÉO CHUỘT (DRAG/SWIPE) ---

    // Sự kiện mousedown/mousemove/mouseup và touch giữ nguyên logic của bạn
    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        stopAutoSlide();
        wrapper.classList.add('active-drag');
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.classList.remove('active-drag');
        setTimeout(handleInfiniteLoop, 50);
        startAutoSlide();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 1.5;
        wrapper.scrollLeft = scrollLeft - walk;
    });

    wrapper.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        isDragging = true;
        stopAutoSlide();
        startX = touch.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
    });

    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        setTimeout(handleInfiniteLoop, 50);
        startAutoSlide();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const x = touch.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 1.5;
        wrapper.scrollLeft = scrollLeft - walk;
    });


    // --- LOGIC NÚT ĐIỀU KHIỂN (PREV/NEXT) ---
    nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        const cardWidth = getCardWidth();
        wrapper.scroll({ left: wrapper.scrollLeft + cardWidth, behavior: 'smooth' });
        setTimeout(handleInfiniteLoop, 400); // Kiểm tra vòng lặp sau khi cuộn xong
    });

    prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        const cardWidth = getCardWidth();
        wrapper.scroll({ left: wrapper.scrollLeft - cardWidth, behavior: 'smooth' });
        setTimeout(handleInfiniteLoop, 400); // Kiểm tra vòng lặp sau khi cuộn xong
    });

    // --- KHỞI TẠO ---
    cloneCards(); // Nhân bản thẻ
    const initialPosition = cloneCount * getCardWidth();
    wrapper.scroll({ left: initialPosition, behavior: 'auto' }); // Đặt vị trí ban đầu (bắt đầu từ thẻ gốc đầu tiên)

    // Lắng nghe sự kiện scroll để kích hoạt hàm nhảy
    wrapper.addEventListener('scroll', handleInfiniteLoop);
    startAutoSlide();
});