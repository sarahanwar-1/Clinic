/* Meridian Family Clinic
   Everything you are likely to edit is in CONFIG below and in the hours table in index.html.
   The booking form reads opening hours from that table, so there is one place to change them. */
(() => {
  'use strict';

  const CONFIG = {
    timeZone: '',          // e.g. 'America/Edmonton'. Leave empty to use each visitor's own clock.
    slotMinutes: 30,       // length of each bookable slot
    leadMinutes: 60,       // how far ahead of now today's first slot can be
    bookAheadDays: 60,     // how far into the future a visitor can pick a date
    phoneDisplay: '(555) 010-0123'
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- small helpers ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const addDays = (s, n) => { const { y, m, d } = parseYmd(s); const t = new Date(Date.UTC(y, m - 1, d + n)); return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
  const dowOf = s => { const { y, m, d } = parseYmd(s); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const fmtTime = min => { const h = Math.floor(min / 60), m = min % 60; const h12 = h % 12 || 12; return `${h12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
  const fmtDate = (s, opts) => { const { y, m, d } = parseYmd(s); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, opts)); };

  function zonedNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CONFIG.timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const get = t => Number(parts.find(p => p.type === t).value);
    const hour = get('hour') === 24 ? 0 : get('hour');
    return { date: ymd(get('year'), get('month'), get('day')), minutes: hour * 60 + get('minute') };
  }

  /* ---------- footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeBtn = $('.theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
      themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
      if (document.startViewTransition && !reduceMotion) {
        const r = themeBtn.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        const t = document.startViewTransition(() => applyTheme(next));
        t.ready.then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(.22,.8,.3,1)', pseudoElement: '::view-transition-new(root)' }
          );
        }).catch(() => {});
      } else {
        applyTheme(next);
      }
    });
  }

  /* ---------- header: shadow, progress bar, current link, mobile menu ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const navLinks = $$('.main-nav a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-current'));
        const link = byId.get(e.target.id);      // sections without a menu link simply clear the highlight
        if (link) link.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(s => io.observe(s));
  }

  const nav = $('#main-nav');
  const menuBtn = $('.menu-toggle');
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => { if (!e.target.closest('.header-inner')) setMenu(false); });
  }

  /* ---------- opening hours (read from the table in the page) ---------- */
  const hours = {};
  $$('#hours-body tr').forEach(tr => {
    const dow = Number(tr.dataset.dow);
    const toMin = v => { if (!v) return null; const [h, m] = v.split(':').map(Number); return h * 60 + m; };
    const open = toMin(tr.dataset.open), close = toMin(tr.dataset.close);
    hours[dow] = open !== null && close !== null ? { open, close } : null;
  });

  function highlightToday() {
    const today = zonedNow().date;
    const tr = $(`#hours-body tr[data-dow="${dowOf(today)}"]`);
    if (!tr) return;
    tr.classList.add('is-today');
    const th = $('th', tr);
    if (th && !$('.today-pill', th)) th.insertAdjacentHTML('beforeend', '<span class="today-pill">Today</span>');
  }

  function openStatus() {
    const now = zonedNow();
    const todayHours = hours[dowOf(now.date)];
    if (todayHours && now.minutes >= todayHours.open && now.minutes < todayHours.close) {
      return { state: 'open', text: `Open now, until ${fmtTime(todayHours.close)}` };
    }
    if (todayHours && now.minutes < todayHours.open) {
      return { state: 'closed', text: `Closed now, opens today at ${fmtTime(todayHours.open)}` };
    }
    for (let i = 1; i <= 7; i++) {
      const date = addDays(now.date, i);
      const h = hours[dowOf(date)];
      if (h) {
        const when = i === 1 ? 'tomorrow' : fmtDate(date, { weekday: 'long' });
        return { state: 'closed', text: `Closed now, opens ${when} at ${fmtTime(h.open)}` };
      }
    }
    return { state: 'closed', text: 'Closed now' };
  }

  function renderBadge() {
    const badge = $('#open-badge'), text = $('#open-text');
    if (!badge || !text) return;
    const s = openStatus();
    badge.dataset.state = s.state;
    text.textContent = s.text;
  }

  /* ---------- time slots ---------- */
  function slotsFor(date) {
    const h = hours[dowOf(date)];
    if (!h) return [];
    const now = zonedNow();
    const out = [];
    for (let m = h.open; m + CONFIG.slotMinutes <= h.close; m += CONFIG.slotMinutes) {
      if (date === now.date && m < now.minutes + CONFIG.leadMinutes) continue;
      out.push(m);
    }
    return out;
  }

  function firstOpenDate() {
    const today = zonedNow().date;
    for (let i = 0; i <= 14; i++) {
      const d = addDays(today, i);
      if (slotsFor(d).length) return d;
    }
    return today;
  }

  const form = $('#booking-form');
  const dateInput = $('#f-date');
  const slotGrid = $('#slot-grid');
  const slotHint = $('#slot-hint');
  let selectedSlot = null;

  function renderSlots(keepSelection) {
    if (!slotGrid || !dateInput) return;
    const date = dateInput.value;
    slotGrid.textContent = '';
    if (!keepSelection) selectedSlot = null;
    if (!date) { slotHint.textContent = 'Choose a date to see open times.'; return; }
    const slots = slotsFor(date);
    if (!slots.length) {
      const closedDay = !hours[dowOf(date)];
      slotHint.textContent = closedDay
        ? `We are closed on ${fmtDate(date, { weekday: 'long' })}s. Choose another date.`
        : 'No more openings that day. Choose another date.';
      selectedSlot = null;
      return;
    }
    if (selectedSlot !== null && !slots.includes(selectedSlot)) selectedSlot = null;
    slotHint.textContent = `${slots.length} open ${slots.length === 1 ? 'time' : 'times'} on ${fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}.`;
    slots.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.textContent = fmtTime(m);
      b.dataset.minutes = String(m);
      b.setAttribute('aria-pressed', String(m === selectedSlot));
      slotGrid.appendChild(b);
    });
  }

  function selectSlot(m) {
    selectedSlot = m;
    $$('.slot', slotGrid).forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.minutes) === m)));
    const field = slotGrid.closest('.slots-field');
    if (field) field.classList.remove('is-invalid');
  }

  if (form && dateInput) {
    const today = zonedNow().date;
    dateInput.min = today;
    dateInput.max = addDays(today, CONFIG.bookAheadDays);
    dateInput.value = firstOpenDate();
    renderSlots(false);

    dateInput.addEventListener('change', () => { renderSlots(false); dateInput.closest('.field').classList.remove('is-invalid'); });
    slotGrid.addEventListener('click', e => {
      const b = e.target.closest('.slot'); if (!b) return;
      selectSlot(Number(b.dataset.minutes));
    });
  }

  /* hero: next openings */
  let openingsKey = '';
  function renderOpenings() {
    const wrap = $('#openings-slots'), label = $('#openings-day');
    if (!wrap || !label) return;
    const today = zonedNow().date;
    for (let i = 0; i <= 14; i++) {
      const date = addDays(today, i);
      const slots = slotsFor(date);
      if (!slots.length) continue;
      const key = date + ':' + slots.slice(0, 5).join(',');
      if (key === openingsKey) return;   // nothing changed, keep the buttons (and any focus) as they are
      openingsKey = key;
      label.textContent = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDate(date, { weekday: 'short', month: 'short', day: 'numeric' });
      wrap.textContent = '';
      slots.slice(0, 5).forEach(m => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'slot-chip'; b.textContent = fmtTime(m);
        b.setAttribute('aria-label', `Book ${fmtTime(m)} ${label.textContent}`);
        b.addEventListener('click', () => {
          if (dateInput) { dateInput.value = date; renderSlots(false); selectSlot(m); }
          const target = $('#book'); if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
          const first = $('#f-service'); if (first) setTimeout(() => first.focus({ preventScroll: true }), reduceMotion ? 0 : 600);
        });
        wrap.appendChild(b);
      });
      return;
    }
  }

  /* services: carry the chosen visit type into the form */
  $$('.service-book').forEach(a => a.addEventListener('click', () => {
    const sel = $('#f-service'); if (sel && a.dataset.service) sel.value = a.dataset.service;
  }));

  /* ---------- booking form ---------- */
  const errorBox = $('#form-error');
  const confirmBox = $('#confirm');

  function markInvalid(el, bad) { const f = el.closest('.field'); if (f) f.classList.toggle('is-invalid', bad); el.setAttribute('aria-invalid', String(bad)); }
  function showError(msg) { if (!errorBox) return; errorBox.textContent = msg; errorBox.hidden = false; }
  function clearError() { if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; } }

  if (form) {
    ['f-service', 'f-name', 'f-phone', 'f-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => { markInvalid(el, false); clearError(); });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearError();
      const service = $('#f-service'), name = $('#f-name'), phone = $('#f-phone'), email = $('#f-email');
      const problems = [];

      const bad = (el, msg) => { markInvalid(el, true); problems.push({ el, msg }); };
      markInvalid(service, false); markInvalid(name, false); markInvalid(phone, false); markInvalid(email, false);
      const slotField = slotGrid.closest('.slots-field'); slotField.classList.remove('is-invalid');
      markInvalid(dateInput, false);

      if (!service.value) bad(service, 'Choose a reason for your visit.');
      if (!dateInput.value) bad(dateInput, 'Choose a date.');
      else if (selectedSlot === null) { slotField.classList.add('is-invalid'); problems.push({ el: slotGrid.querySelector('.slot') || dateInput, msg: 'Choose a time.' }); }
      if (!name.value.trim()) bad(name, 'Enter your full name.');
      if (phone.value.replace(/\D/g, '').length < 7) bad(phone, 'Enter a phone number we can reach you on.');
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) bad(email, 'Check your email address, or leave it blank.');

      if (problems.length) {
        showError(problems[0].msg + (problems.length > 1 ? ` ${problems.length - 1} more ${problems.length === 2 ? 'field needs' : 'fields need'} attention.` : ''));
        problems[0].el.focus();
        return;
      }

      const payload = {
        patientType: (form.querySelector('input[name="patientType"]:checked') || {}).value || '',
        service: service.value,
        date: dateInput.value,
        time: fmtTime(selectedSlot),
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        notes: $('#f-notes').value.trim()
      };

      const endpoint = form.dataset.endpoint;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (endpoint) {
        submitBtn.disabled = true; submitBtn.textContent = 'Sending...';
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error('Request failed');
        } catch (err) {
          submitBtn.disabled = false; submitBtn.textContent = 'Request appointment';
          showError(`We could not send your request. Please call us on ${CONFIG.phoneDisplay}.`);
          return;
        }
        submitBtn.disabled = false; submitBtn.textContent = 'Request appointment';
      }

      const when = `${fmtDate(payload.date, { weekday: 'long', month: 'long', day: 'numeric' })} at ${payload.time}`;
      $('#confirm-text').textContent = `${payload.patientType} request for ${payload.service.toLowerCase()} on ${when}. We will confirm by phone${payload.email ? ' or email' : ''} within one business day.`;
      $('#confirm-demo').hidden = Boolean(endpoint);
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.focus();
    });

    $('#confirm-reset').addEventListener('click', () => {
      form.reset();
      selectedSlot = null;
      dateInput.value = firstOpenDate();
      renderSlots(false);
      $$('.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
      confirmBox.hidden = true;
      form.hidden = false;
      $('#f-service').focus();
    });
  }

  /* ---------- count-up numbers ---------- */
  const nums = $$('.num[data-count]');
  function runCount(el) {
    const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1500;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (nums.length && 'IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); io.unobserve(e.target); } });
    }, { threshold: .6 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- start ---------- */
  highlightToday();
  renderBadge();
  renderOpenings();
  setInterval(() => { renderBadge(); renderOpenings(); }, 60 * 1000);
})();
