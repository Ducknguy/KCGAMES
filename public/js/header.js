let headerInitialized = false;

// Highlight menu theo URL hiện tại
function setActiveNav() {
    const navLinkEls = document.querySelectorAll('.nav_link');
    const windowPathname = window.location.pathname;

    navLinkEls.forEach(navLinkEl => {
        const navLinkPathname = new URL(navLinkEl.href).pathname;

        const normalizedWindowPath =
            (windowPathname === '/index.html' || windowPathname === '') ? '/' : windowPathname;

        const normalizedNavLinkPath =
            (navLinkPathname === '/index.index' || navLinkPathname === '/index.html') ? '/' : navLinkPathname;

        navLinkEl.classList.remove('active');

        if (normalizedWindowPath === normalizedNavLinkPath) {
            navLinkEl.classList.add('active');
        }
    });
}

// Hàm khởi tạo header – gọi được nhiều lần (sau khi load HTML xong)
function initHeader() {
    const header = document.getElementById('header');
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const menuIcon = mobileToggle ? mobileToggle.querySelector('i') : null;
    const placeholder = document.getElementById('header-placeholder');

    if (!header) return;

    // ===== 1. Cập nhật chiều cao placeholder để tránh giật layout =====
    if (placeholder) {
        const updatePlaceholderHeight = () => {
            placeholder.style.height = header.offsetHeight + 'px';
        };
        updatePlaceholderHeight();
        window.addEventListener('resize', updatePlaceholderHeight);
    }

    // ===== 2. Chỉ gắn listener scroll + mobile menu 1 lần =====
    if (!headerInitialized) {
        // Khi scroll -> bật / tắt trạng thái floating
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('is-floating'); // dùng cho CSS fixed
                header.classList.add('scrolled');    // nếu CSS cũ vẫn dùng class này
            } else {
                header.classList.remove('is-floating');
                header.classList.remove('scrolled');
            }
        }, { passive: true });

        // Mobile menu
        if (mobileToggle && navbar && menuIcon) {
            mobileToggle.addEventListener('click', () => {
                navbar.classList.toggle('active');

                if (navbar.classList.contains('active')) {
                    menuIcon.classList.remove('bx-menu');
                    menuIcon.classList.add('bx-x');
                } else {
                    menuIcon.classList.remove('bx-x');
                    menuIcon.classList.add('bx-menu');
                }
            });
        }

        headerInitialized = true;
    }

    // ===== 3. Active nav theo URL =====
    setActiveNav();
}

// Nếu trang nào KHÔNG dùng loadHTML mà nhét header trực tiếp,
// thì vẫn khởi tạo được nhờ sự kiện này.
document.addEventListener('DOMContentLoaded', initHeader);
