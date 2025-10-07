

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active state to navigation
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Mobile menu toggle for small screens
function initMobileMenu() {
    const nav = document.querySelector('nav');
    if (window.innerWidth < 768) {
        nav.style.flexWrap = 'wrap';
    }
}

// Initialize mobile features
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    
    // Re-initialize on resize
    window.addEventListener('resize', initMobileMenu);
});

// Update scroll indicators based on position
function updateScrollIndicators() {
    const container = document.querySelector('.timeline-container');
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    container.classList.remove('scroll-start', 'scroll-middle', 'scroll-end');
    
    if (scrollLeft === 0) {
        container.classList.add('scroll-start');
    } else if (scrollLeft + clientWidth >= scrollWidth - 10) {
        container.classList.add('scroll-end');
    } else {
        container.classList.add('scroll-middle');
    }
}

// Initialize scroll indicators
document.addEventListener('DOMContentLoaded', function() {
    const timelineContainer = document.querySelector('.timeline-container');
    timelineContainer.addEventListener('scroll', updateScrollIndicators);
    updateScrollIndicators(); // Initial check
});

console.log('Sports Hub initialized! 🏆');

