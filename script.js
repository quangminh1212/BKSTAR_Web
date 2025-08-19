// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initHeroSlider();
    initStatsCounter();
    initTestimonialsSlider();
    initMobileMenu();
    initScrollToTop();
    initFormValidation();
    initSmoothScrolling();
    loadDynamicData();
});

// Hero Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.hero .prev-btn');
    const nextBtn = document.querySelector('.hero .next-btn');
    let currentSlide = 0;

    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Auto-play slider
    setInterval(nextSlide, 5000);
}

// Stats Counter Animation
function initStatsCounter() {
    const counters = document.querySelectorAll('.counter');
    const options = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / 100;
                let current = 0;

                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.ceil(current);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.textContent = target;
                    }
                };

                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, options);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Testimonials Slider
function initTestimonialsSlider() {
    const testimonials = [
        {
            university: "Cornell University",
            name: "Trần Nam Trân",
            school: "Trường Trung học Cranbrook",
            image: "images/student1.jpg"
        },
        {
            university: "Học bổng ASEAN - Nanyang Technological University",
            name: "Hoàng Quân",
            school: "THPT Chuyên Hà Nội - Amsterdam",
            image: "images/student2.jpg"
        },
        {
            university: "Học bổng Toàn phần - University of Oxford",
            name: "Nguyễn Cảnh Thái",
            school: "THPT Chuyên Khoa học Tự nhiên",
            image: "images/student3.jpg"
        },
        {
            university: "Stanford University University of Pennsylvania USC Marshall",
            name: "Nguyễn Quỳnh Anh",
            school: "Trường Quốc Tế Concordia Hà Nội",
            image: "images/student4.jpg"
        },
        {
            university: "The University of Sydney",
            name: "Vương Nhật Minh",
            school: "THPT Chuyên Khoa học Tự nhiên",
            image: "images/student5.jpg"
        }
    ];

    const slider = document.querySelector('.testimonials-slider');
    const prevBtn = document.querySelector('.testimonials .prev-btn');
    const nextBtn = document.querySelector('.testimonials .next-btn');
    let currentTestimonial = 0;

    if (!slider) return;

    function createTestimonialSlide(testimonial) {
        return `
            <div class="testimonial-slide">
                <div class="testimonial-content">
                    <h3>${testimonial.university}</h3>
                    <div class="student-info">
                        <p class="student-name">${testimonial.name}</p>
                        <p class="student-school">${testimonial.school}</p>
                    </div>
                </div>
                <div class="testimonial-image">
                    <picture>
                        <source srcset="${testimonial.image.replace('.jpg', '.webp')}" type="image/webp">
                        <img src="${testimonial.image}" alt="${testimonial.name}" loading="lazy" width="120" height="120" onerror="this.src='https://via.placeholder.com/120x120/046bd2/ffffff?text=${testimonial.name.charAt(0)}'">
                    </picture>
                </div>
            </div>
        `;
    }

    function showTestimonial(index) {
        slider.innerHTML = createTestimonialSlide(testimonials[index]);
    }

    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }

    function prevTestimonial() {
        currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
        showTestimonial(currentTestimonial);
    }

    // Initialize first testimonial
    showTestimonial(0);

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
    if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);

    // Auto-play testimonials
    setInterval(nextTestimonial, 4000);
}

// Mobile Menu & Accessibility
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    navToggle.setAttribute('role', 'button');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'primary-menu');

    navMenu.id = 'primary-menu';
    navMenu.setAttribute('role', 'menu');

    navToggle.addEventListener('click', function() {
        const isOpen = navMenu.style.display === 'block';
        navMenu.style.display = isOpen ? 'none' : 'block';
        navToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Keyboard support
    navToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navToggle.click();
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.style.display = 'none';
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Scroll to Top
function initScrollToTop() {
    const scrollBtn = document.querySelector('.scroll-to-top');
    
    if (!scrollBtn) return;

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    });

    // Smooth scroll to top
    scrollBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Form Validation
function initFormValidation() {
    const form = document.querySelector('.contact-form');
    
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = form.querySelector('#name').value.trim();
        const email = form.querySelector('#email').value.trim();
        const phone = form.querySelector('#phone').value.trim();
        const note = form.querySelector('#note').value.trim();

        // Basic validation
        if (!name) {
            showAlert('Vui lòng nhập họ và tên', 'error');
            return;
        }

        if (!email || !isValidEmail(email)) {
            showAlert('Vui lòng nhập email hợp lệ', 'error');
            return;
        }

        if (!phone || !isValidPhone(phone)) {
            showAlert('Vui lòng nhập số điện thoại hợp lệ', 'error');
            return;
        }

        // Submit form to endpoint if configured
        const endpoint = form.getAttribute('data-form-endpoint');
        if (endpoint && endpoint.trim()) {
            submitForm(endpoint.trim(), { name, email, phone, note });
        } else {
            showAlert('Cảm ơn bạn đã liên hệ! (Chưa cấu hình endpoint gửi form)', 'success');
        }
        form.reset();
    });
}

async function submitForm(endpoint, payload) {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Submit failed');
        showAlert('Gửi form thành công! Chúng tôi sẽ liên hệ sớm.', 'success');
    } catch (e) {
        console.error(e);
        showAlert('Không thể gửi form lúc này. Vui lòng thử lại sau.', 'error');
    }
}

// Helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    return phoneRegex.test(phone);
}

function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `;

    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;

    // Add close button styles
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;

    // Add to page
    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);

    // Close button functionality
    closeBtn.addEventListener('click', () => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    });
}

// Smooth Scrolling for anchor links + Scroll Spy
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Scroll Spy: highlight nav item for visible section
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
            }
        });
    }, { threshold: 0.6 });

    sections.forEach(sec => spy.observe(sec));
}

// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });

        // Set initial opacity
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';

        // If image is already loaded
        if (img.complete) {
            img.style.opacity = '1';
        }
    });
});

// Dynamic data loader
async function loadDynamicData() {
    try {
        const res = await fetch('data.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load data.json');
        const data = await res.json();

        const newsRendered = renderCards('#news-grid', data.news, 'news');
        const newsEmpty = document.querySelector('#news-empty');
        if (newsEmpty) newsEmpty.style.display = newsRendered ? 'none' : 'block';
        renderCards('#competitions-grid', data.competitions, 'competitions');
        renderCards('#blog-grid', data.blog, 'blog');
        renderCards('#achievements-grid', data.achievements, 'achievements');
    } catch (err) {
        console.error(err);
    }
}

function renderCards(containerSelector, items, type) {
    const container = document.querySelector(containerSelector);
    if (!container || !Array.isArray(items)) return false;

    const html = items.map(item => {
        const dateFormatted = formatDate(item.date);
        const src = item.localImage || item.image;
        const onerrorAttr = item.localImage && item.image ? `onerror=\"this.onerror=null; this.src='${item.image}'\"` : '';
        const media = src ? `
                <div class=\"card-media\">
                    <img src=\"${src}\" alt=\"${item.title}\" loading=\"lazy\" ${onerrorAttr} />
                </div>` : '';
        return `
            <article class="${type === 'blog' ? 'blog-card' : type === 'competitions' ? 'competition-card' : type === 'achievements' ? 'achievement-card' : 'news-card'}">
                ${media}
                <div class="card-content">
                    <h3><a href="${item.url}">${item.title}</a></h3>
                    <time>${dateFormatted}</time>
                    <p>${item.excerpt}</p>
                    <a href="${item.url}" class="read-more">Xem chi tiết</a>
                </div>
            </article>
        `;
    }).join('');

    container.innerHTML = html;
    return items.length > 0;
}

function formatDate(isoDate) {
    try {
        const d = new Date(isoDate);
        return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return isoDate;
    }
}

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add fade-in animation for sections
function initScrollAnimations() {
    const sections = document.querySelectorAll('section');
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, options);

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', initScrollAnimations);
