/* ArmorRiot Landing Page Scripts */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const body = document.body;
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            body.classList.toggle('menu-open');
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('menu-open');
        });
    });

    // IntersectionObserver for Nav
    const sections = document.querySelectorAll('section[id], header[id], main > section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (id) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));

    // Form Submission
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            contactForm.classList.add('hidden');
            successMessage.classList.remove('hidden');
            // In a real app, you'd send the data here
            console.log('Form submitted:', new FormData(contactForm));
        });
    }

    // Scroll Reveal
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    const revealObserverOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, revealObserverOptions);

    revealElements.forEach(el => revealObserver.observe(el));
});
