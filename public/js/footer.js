window.gtranslateSettings = {
    "default_language": "vi",
    "languages": ["vi", "en"],
    "wrapper_selector": ".gtranslate_wrapper",
    "detect_browser_language": true,
};
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.gtranslate.net/widgets/latest/float.js';
document.body.appendChild(script);


// Footer Wave Animation

document.addEventListener('DOMContentLoaded', function () {
    const wave = document.querySelector('.wave path');

    if (wave) {
        // Animate wave on scroll
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            wave.style.transform = `translateX(${rate}px)`;
        });
    }

    // Newsletter form submission
    const form = document.querySelector('footer form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            alert(`Thank you for subscribing with: ${email}`);
            this.reset();
        });
    }
});
