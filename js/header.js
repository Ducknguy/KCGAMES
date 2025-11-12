
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

function setActiveNav() {
    const navLinkEls = document.querySelectorAll('.nav_link');
    const windowPathname = window.location.pathname;

    navLinkEls.forEach(navLinkEl => {
        const navLinkPathname = new URL(navLinkEl.href).pathname;
        const normalizedWindowPath = (windowPathname === '/index.html' || windowPathname === '') ? '/' : windowPathname;
        const normalizedNavLinkPath = (navLinkPathname === '/index.index' || navLinkPathname === '/index.html') ? '/' : navLinkPathname;

        navLinkEl.classList.remove('active');
        if (normalizedWindowPath === normalizedNavLinkPath) {
            navLinkEl.classList.add('active');
        }
    });
}