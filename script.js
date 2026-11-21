(() => {
  document.documentElement.classList.add('js-enabled');
  const header = document.getElementById('site-header');
  const menu = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  const modal = document.getElementById('booking-dialog');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const closeMenu = () => {
    header.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
  };
  menu.addEventListener('click', () => {
    const open = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 30);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // On supported browsers, reveal editorial sections as they enter the viewport.
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -45px 0px', threshold: 0.08 });
    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('revealed'));
  }

  // Active link tracks the current section without changing the URL during scrolling.
  if ('IntersectionObserver' in window) {
    const anchors = Array.from(document.querySelectorAll('.nav-link'));
    const sections = anchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const navObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          anchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        }
      }
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }

  // Text-only rotating demo feedback. No testimonials are presented as verified reviews.
  const examples = [
    '“I felt welcome the moment I arrived, and everything was explained in a way I could understand.”',
    '“The space felt calm, and I knew what to expect throughout my appointment.”',
    '“It made a difference to have time to ask questions and talk through the next steps.”'
  ];
  let active = 0;
  const quote = document.getElementById('feedback-quote');
  const byline = document.getElementById('feedback-byline');
  const count = document.getElementById('feedback-count');
  const bar = document.querySelector('#feedback-progress i');
  function showFeedback(direction) {
    active = (active + direction + examples.length) % examples.length;
    quote.textContent = examples[active];
    byline.textContent = 'Illustrative patient comment';
    count.textContent = `${String(active + 1).padStart(2, '0')} — ${String(examples.length).padStart(2, '0')}`;
    bar.style.transform = `translateX(${active * 100}%)`;
    if (!reduceMotion) {
      quote.classList.remove('in');
      // Restart animation without adding new visible elements.
      void quote.offsetWidth;
      quote.classList.add('in');
    }
  }
  document.getElementById('feedback-prev').addEventListener('click', () => showFeedback(-1));
  document.getElementById('feedback-next').addEventListener('click', () => showFeedback(1));

  // Booking intentionally shows a transparent demo notice, not a fictitious booking form.
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    closeMenu();
    if (typeof modal.showModal === 'function') modal.showModal();
  }));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => modal.close()));
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.close();
  });
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
