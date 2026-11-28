/*
 * Ankit Builds — site behaviour.
 * Motion effects are lightweight vanilla ports of components from
 * motion-primitives by ibelick (MIT): https://github.com/ibelick/motion-primitives
 */

const CONTACT = {
  phone: '916205323586',
  phoneLabel: '+91 62053 23586'
};

const WA_MESSAGES = {
  general: "Hi, I visited your website and would like to know more about your services.",
  hero: "Hi, I'm interested in getting a professional website for my business. Could you share more details?",
  consult: "Hi, I'd like a free consultation about my business's online presence. Could we discuss my requirements?",
  social: "Hi, I'm interested in your Social Media Management service. I'd like to discuss the details.",
  complete: "Hi, I'm interested in your Complete Digital Presence service. I'd like to discuss how we can improve my business's online presence.",
  starter: "Hi, I'm interested in the Starter website package (₹4,999 onwards). Could you share more details?",
  professional: "Hi, I'm interested in the Professional website package (₹9,999 onwards). Could you share more details?",
  advanced: "Hi, I'd like to discuss the Advanced website package (₹14,999 onwards) with booking / ordering for my business.",
  industry: topic => `Hi, I'm interested in a website for my ${topic}. Could you share more details?`
};

const whatsappUrl = text => `https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(text)}`;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function initContactLinks() {
  $$('[data-wa]').forEach(el => {
    const key = el.dataset.wa;
    const text = key === 'industry' ? WA_MESSAGES.industry(el.dataset.topic) : (WA_MESSAGES[key] || WA_MESSAGES.general);
    el.href = whatsappUrl(text);
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });
  $$('[data-call]').forEach(el => {
    el.href = `tel:+${CONTACT.phone}`;
    if (!el.hasAttribute('aria-label') && el.textContent.trim() === 'Call Now') el.setAttribute('aria-label', `Call ${CONTACT.phoneLabel}`);
  });
  $$('[data-phone-label]').forEach(el => { el.textContent = CONTACT.phoneLabel; });

  const float = $('.wa-float');
  const contact = $('#contact');
  if (float && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => float.classList.toggle('is-tucked', entry.isIntersecting), { threshold: 0.15 }).observe(contact);
  }
}

function initHeader() {
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const setOpen = open => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
  $$('.site-nav a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) setOpen(false); });

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const links = new Map($$('.site-nav ul a').map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      const link = links.get(entry.target.id);
      if (link) { link.classList.add('is-active'); link.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));
}

function initReveal() {
  const items = $$('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

function initTextLoop() {
  const loop = $('.text-loop');
  if (!loop || reducedMotion) return;
  const words = Array.from(loop.children);
  let index = 0;
  setInterval(() => {
    if (document.hidden) return;
    const current = words[index];
    index = (index + 1) % words.length;
    current.classList.remove('is-active');
    current.classList.add('is-leaving');
    words[index].classList.remove('is-leaving');
    words[index].classList.add('is-active');
    setTimeout(() => current.classList.remove('is-leaving'), 400);
  }, 2400);
}

function initSpotlight() {
  if (!finePointer) return;
  $$('.spotlight').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  $$('.magnetic').forEach(el => {
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0;
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
      if (!frame && !tx && !ty) el.style.transform = '';
    };
    const run = () => { if (!frame) frame = requestAnimationFrame(tick); };
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * 0.25;
      ty = (e.clientY - (r.top + r.height / 2)) * 0.35;
      run();
    });
    el.addEventListener('pointerleave', () => { tx = 0; ty = 0; run(); });
  });
}

function initTabs() {
  const list = $('.industry-tabs');
  if (!list) return;
  const tabs = $$('[role="tab"]', list);
  const indicator = $('.tab-indicator', list);
  list.classList.add('has-indicator');

  const place = tab => {
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  };
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
    place(tab);
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', e => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
    });
  });

  const current = () => tabs.find(t => t.getAttribute('aria-selected') === 'true');
  place(current());
  if (document.fonts) document.fonts.ready.then(() => place(current()));
  new ResizeObserver(() => place(current())).observe(list);
}

function initForm() {
  const form = $('#enquiry-form');
  if (!form) return;
  const status = $('.form-status', form);

  const rules = {
    name: v => v.length >= 2 || 'Please enter your name.',
    phone: v => /^(?:\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')) || 'Please enter a valid 10-digit mobile number.',
    service: v => Boolean(v) || 'Please choose the service you are interested in.'
  };

  const validate = field => {
    const result = rules[field.name](field.value.trim());
    const error = document.getElementById(`${field.id}-err`);
    const ok = result === true;
    field.setAttribute('aria-invalid', String(!ok));
    error.textContent = ok ? '' : result;
    if (ok) field.removeAttribute('aria-describedby'); else field.setAttribute('aria-describedby', error.id);
    return ok;
  };

  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    field.addEventListener('blur', () => { if (field.value) validate(field); });
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(field);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    status.textContent = '';
    const invalid = Object.keys(rules).map(n => form.elements[n]).filter(f => !validate(f));
    if (invalid.length) { invalid[0].focus(); return; }

    const v = n => form.elements[n].value.trim();
    const text = [
      'Hello, I would like to enquire about your services.',
      '',
      `Name: ${v('name')}`,
      `Business Name: ${v('business') || 'Not specified'}`,
      `Phone: ${v('phone')}`,
      `Service Interested In: ${v('service')}`,
      `Project Details: ${v('message') || 'Not specified'}`,
      '',
      'Please let me know how we can proceed.'
    ].join('\n');

    const url = whatsappUrl(text);
    const win = window.open(url, '_blank');
    if (win) win.opener = null; else window.location.href = url;
    status.innerHTML = `WhatsApp has opened with your enquiry. Please tap send there to deliver it. If it didn't open, <a href="${url}" target="_blank" rel="noopener noreferrer">open WhatsApp here</a>.`;
  });
}

initContactLinks();
initHeader();
initReveal();
initTextLoop();
initSpotlight();
initMagnetic();
initTabs();
initForm();
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
