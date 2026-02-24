// ===========================
// THEME TOGGLE
// ===========================
(function applyTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');
})();

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const updateIcon = () => {
    themeToggle.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
  };
  updateIcon();
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    updateIcon();
  });
}

// ===========================
// NAVIGATION
// ===========================
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// Highlight active nav link based on current page
(function highlightNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ===========================
// SCROLL ANIMATIONS (IntersectionObserver)
// ===========================
const fadeEls = document.querySelectorAll('.fade-up');
if (fadeEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => io.observe(el));
}

// ===========================
// SKILL BARS ANIMATION
// ===========================
const skillBars = document.querySelectorAll('.skill-fill');
if (skillBars.length) {
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const pct = e.target.getAttribute('data-pct');
        e.target.style.width = pct + '%';
        barObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  skillBars.forEach(bar => barObserver.observe(bar));
}

// ===========================
// PROJECT FILTER (projects page)
// ===========================
const filterBtns = document.querySelectorAll('.filter-btn');
const projectEntries = document.querySelectorAll('.project-entry[data-category]');

if (filterBtns.length && projectEntries.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      projectEntries.forEach(entry => {
        if (cat === 'all' || entry.getAttribute('data-category').includes(cat)) {
          entry.style.display = '';
        } else {
          entry.style.display = 'none';
        }
      });
    });
  });
}

// ===========================
// CONTACT FORM (Formspree)
// ===========================
(function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formError   = document.getElementById('formError');
  if (!contactForm) return;

  const ENDPOINT = 'https://formsubmit.co/ajax/sanpedroaids@gmail.com';

  // Field validators: return error string, or '' if valid
  const validators = {
    firstName : v => v.trim()                                        ? '' : 'First name is required.',
    lastName  : v => v.trim()                                        ? '' : 'Last name is required.',
    email     : v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())   ? '' : 'A valid email address is required.',
    subject   : v => v.trim()                                        ? '' : 'Subject is required.',
    message   : v => v.trim().length >= 10                          ? '' : 'Message must be at least 10 characters.',
  };

  function showFieldError(name, msg) {
    const errEl  = document.getElementById(name + '-error');
    const input  = contactForm.elements[name];
    if (errEl)  errEl.textContent = msg;
    if (input)  input.closest('.form-group').classList.toggle('has-error', !!msg);
  }

  function clearErrors() {
    Object.keys(validators).forEach(name => showFieldError(name, ''));
    if (formError) { formError.textContent = ''; formError.style.display = 'none'; }
  }

  function validate() {
    let valid = true;
    Object.entries(validators).forEach(([name, fn]) => {
      const input = contactForm.elements[name];
      const msg = fn(input ? input.value : '');
      showFieldError(name, msg);
      if (msg) valid = false;
    });
    return valid;
  }

  // Clear field error as the user corrects it
  Object.keys(validators).forEach(name => {
    const input = contactForm.elements[name];
    if (input) input.addEventListener('input', () => {
      const msg = validators[name](input.value);
      showFieldError(name, msg);
    });
  });

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    const btn      = contactForm.querySelector('.form-submit');
    const origText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled    = true;

    const payload = {
      firstName : contactForm.elements.firstName.value.trim(),
      lastName  : contactForm.elements.lastName.value.trim(),
      email     : contactForm.elements.email.value.trim(),
      subject   : contactForm.elements.subject.value.trim(),
      _subject  : 'Portfolio Contact: ' + contactForm.elements.subject.value.trim(),
      budget    : contactForm.elements.budget.value,
      message   : contactForm.elements.message.value.trim(),
    };

    try {
      const res = await fetch(ENDPOINT, {
        method  : 'POST',
        headers : { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });

      if (res.ok) {
        contactForm.reset();
        clearErrors();
        if (formSuccess) {
          formSuccess.style.display = 'flex';
          setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);
        }
      } else {
        const json = await res.json().catch(() => ({}));
        const msg = (json?.errors || []).map(er => er.message).join(' ') ||
                    'Submission failed. Please try again.';
        if (formError) { formError.textContent = '⚠️  ' + msg; formError.style.display = 'flex'; }
      }
    } catch (_) {
      if (formError) {
        formError.textContent = '⚠️  Network error. Please check your connection and try again.';
        formError.style.display = 'flex';
      }
    } finally {
      btn.textContent = origText;
      btn.disabled    = false;
    }
  });
})();

// ===========================
// TYPING EFFECT (hero tagline)
// ===========================
const typeTarget = document.getElementById('typeText');
if (typeTarget) {
  const phrases = [
    'Front-End Web Developer.',
    'UI/UX Enthusiast.',
    'Effective Communicator.',
    'Problem Solver.',
  ];
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      typeTarget.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; setTimeout(type, 1600); return; }
    } else {
      typeTarget.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(type, deleting ? 55 : 90);
  }
  type();
}

// ===========================
// LIGHTBOX
// ===========================
(function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg        = document.getElementById('lightboxImg');
  const lbCaption    = document.getElementById('lightboxCaption');
  const lbClose      = document.getElementById('lightboxClose');
  const lbBackdrop   = document.getElementById('lightboxBackdrop');
  const lbPrev       = document.getElementById('lightboxPrev');
  const lbNext       = document.getElementById('lightboxNext');

  // Collect all clickable images from .img-main and .img-thumb
  let gallery = [];
  let currentIndex = 0;

  function buildGallery() {
    gallery = [];
    document.querySelectorAll('.img-main img, .img-thumb img').forEach(img => {
      gallery.push({ src: img.src, alt: img.alt || '' });
    });
  }

  function openLightbox(index) {
    buildGallery();
    if (!gallery.length) return;
    currentIndex = index;
    showImage(currentIndex);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateNavBtns();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showImage(index) {
    lbImg.src = gallery[index].src;
    lbImg.alt = gallery[index].alt;
    lbCaption.textContent = gallery[index].alt;
    updateNavBtns();
  }

  function updateNavBtns() {
    lbPrev.disabled = currentIndex === 0;
    lbNext.disabled = currentIndex === gallery.length - 1;
  }

  // Open on image click
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.img-main img, .img-thumb img');
    if (!img) return;
    buildGallery();
    const idx = gallery.findIndex(g => g.src === img.src);
    openLightbox(idx >= 0 ? idx : 0);
  });

  // Close
  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);

  // Prev / Next
  lbPrev.addEventListener('click', () => {
    if (currentIndex > 0) { currentIndex--; showImage(currentIndex); }
  });
  lbNext.addEventListener('click', () => {
    if (currentIndex < gallery.length - 1) { currentIndex++; showImage(currentIndex); }
  });

  // Keyboard: Escape / arrows
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && currentIndex > 0) { currentIndex--; showImage(currentIndex); }
    if (e.key === 'ArrowRight' && currentIndex < gallery.length - 1) { currentIndex++; showImage(currentIndex); }
  });
})();

// ===========================
// SMOOTH COUNTER (stats)
// ===========================
const counters = document.querySelectorAll('.stat-num[data-target]');
if (counters.length) {
  const cObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = +e.target.getAttribute('data-target');
        let count = 0;
        const step = Math.ceil(target / 40);
        const interval = setInterval(() => {
          count = Math.min(count + step, target);
          e.target.textContent = count + (e.target.getAttribute('data-suffix') || '');
          if (count >= target) clearInterval(interval);
        }, 35);
        cObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cObserver.observe(c));
}
