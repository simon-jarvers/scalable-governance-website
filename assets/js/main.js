// Scalable Governance — site behaviour.
// Plain JS, no build step. Every feature degrades to readable static content.

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ───────── Nav: shrink on scroll ─────────
  function initNav() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    let ticking = false;
    const update = () => {
      const t = Math.min((window.scrollY || 0) / 100, 1);
      nav.style.setProperty('--t', t.toFixed(3));
      nav.classList.toggle('is-scrolled', t > 0);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    // Mobile menu
    const toggle = nav.querySelector('.nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

    // Research submenu (desktop): hover opens it in CSS; the chevron button opens it for keyboard and touch.
    nav.querySelectorAll('.nav-links__group').forEach((group) => {
      const btn = group.querySelector('.nav-sub-toggle');
      if (!btn) return;
      const setSub = (open) => { group.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
      btn.addEventListener('click', (e) => { e.stopPropagation(); setSub(!group.classList.contains('is-open')); });
      group.addEventListener('focusout', (e) => { if (!group.contains(e.relatedTarget)) setSub(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && group.classList.contains('is-open')) { setSub(false); btn.focus(); } });
      document.addEventListener('click', (e) => { if (!group.contains(e.target)) setSub(false); });
    });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) setOpen(false);
    });
  }

  // ───────── Hero accordion (independent toggles) ─────────
  function initAccordion() {
    document.querySelectorAll('.accordion__trigger').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('is-open', open);
      });
    });
  }

  // ───────── Publication browser (vertical tabs) ─────────
  function initPublications() {
    const list = document.querySelector('.pubs__list');
    const details = document.querySelector('.pubs__details');
    if (!list || !details) return;
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !on;
          if (on) details.dataset.ring = panel.dataset.themeRing;
        }
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0], false);

    // Abstracts are clamped to a few lines until expanded; the text itself stays verbatim.
    details.querySelectorAll('.abstract__toggle').forEach((btn) => {
      const box = btn.closest('.abstract');
      btn.addEventListener('click', () => {
        const open = !box.classList.contains('is-open');
        box.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Show less' : 'Show full abstract';
      });
    });

    // On narrow screens the detail sits below the list; bring the chosen paper into view.
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      if (!window.matchMedia('(max-width: 860px)').matches) return;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel && panel.getBoundingClientRect().top > window.innerHeight * 0.6) {
        panel.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      }
    }));
  }

  // ───────── Table of contents: scroll spy ─────────
  function initToc() {
    const links = Array.from(document.querySelectorAll('.toc__list a'));
    if (!links.length) return;
    const sections = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    let ticking = false;
    const update = () => {
      ticking = false;
      let current = sections[0];
      const line = Math.max(200, window.innerHeight * 0.35);
      sections.forEach((sec) => { if (sec.getBoundingClientRect().top < line) current = sec; });
      // Short last sections never reach the threshold; mark them once the page bottom is reached.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections[sections.length - 1];
      links.forEach((a) => {
        const on = current && a.getAttribute('href') === '#' + current.id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ───────── Glossary tooltips ─────────
  // Hover or focus shows the definition; click or tap toggles it; Escape closes.
  function initTerms() {
    const terms = Array.from(document.querySelectorAll('.term'));
    if (!terms.length) return;
    const place = (term) => {
      const tip = term.querySelector('.term__tip');
      term.style.setProperty('--tip-left', '0px');
      const r = tip.getBoundingClientRect();
      const overflow = r.right - (document.documentElement.clientWidth - 16);
      if (overflow > 0) term.style.setProperty('--tip-left', -Math.min(overflow, r.left - 16) + 'px');
    };
    const setOpen = (term, open) => {
      term.classList.toggle('is-open', open);
      if (open) place(term);
    };
    const closeAll = (except) => terms.forEach((t) => { if (t !== except) setOpen(t, false); });
    terms.forEach((term) => {
      const btn = term.querySelector('.term__word');
      let pinned = false;
      term.addEventListener('mouseenter', () => { closeAll(term); setOpen(term, true); });
      term.addEventListener('mouseleave', () => { if (!pinned) setOpen(term, false); });
      btn.addEventListener('focus', () => { closeAll(term); setOpen(term, true); });
      btn.addEventListener('blur', () => { pinned = false; setOpen(term, false); });
      btn.addEventListener('click', () => {
        pinned = !pinned;
        closeAll(term);
        setOpen(term, pinned || term.matches(':hover'));
      });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(null); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.term')) closeAll(null); });
  }

  // ───────── Budget slider ─────────
  function initBudget() {
    const figure = document.querySelector('.budget');
    const track = document.getElementById('budget-track');
    const thumb = document.getElementById('budget-thumb');
    if (!figure || !track || !thumb) return;
    const MIN = 30;
    const MAX = 70;
    let value = Number(thumb.getAttribute('aria-valuenow')) || 62;
    const set = (v) => {
      value = Math.round(Math.max(MIN, Math.min(MAX, v)));
      figure.style.setProperty('--split', value);
      thumb.setAttribute('aria-valuenow', value);
      thumb.setAttribute('aria-valuetext', value + '% documentation for audits, ' + (100 - value) + '% implementation');
    };
    const fromPointer = (e) => {
      const r = track.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    let dragging = false;
    track.addEventListener('pointerdown', (e) => {
      dragging = true;
      track.setPointerCapture(e.pointerId);
      set(fromPointer(e));
    });
    track.addEventListener('pointermove', (e) => { if (dragging) set(fromPointer(e)); });
    const stop = () => { dragging = false; };
    track.addEventListener('pointerup', stop);
    track.addEventListener('pointercancel', stop);
    thumb.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      const keys = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -10, PageUp: 10 };
      if (e.key in keys) { e.preventDefault(); set(value + keys[e.key]); }
      else if (e.key === 'Home') { e.preventDefault(); set(MIN); }
      else if (e.key === 'End') { e.preventDefault(); set(MAX); }
    });
    set(value);
  }

  // ───────── Copy email address ─────────
  function initCopy() {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      const status = btn.nextElementSibling;
      btn.addEventListener('click', async () => {
        let ok = false;
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          ok = true;
        } catch (e) { /* clipboard unavailable, e.g. insecure context */ }
        if (status) status.textContent = ok ? 'Copied.' : 'Copy failed. Select the address instead.';
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { if (status) status.textContent = ''; }, 3000);
      });
    });
  }

  // ───────── The three levels: scroll zooms out through the rings ─────────
  // The camera starts on the innermost ring (organisation) and pulls back to
  // verification, then regulation. Scale changes geometrically, as in the film.
  // The zoom follows the scroll in both directions, every time. Where the text
  // column does not fit on screen beside the rings (phones, tablets, short
  // windows), the section is a normal-height view instead, and the level
  // buttons and rings switch levels with a short zoom. With reduced motion it
  // is a static list.
  function initLevels() {
    const section = document.querySelector('.levels');
    if (!section) return;
    const track = section.querySelector('.levels__track');
    const stage = section.querySelector('.levels__stage');
    const svg = section.querySelector('.levels__rings');
    const view = section.querySelector('.levels__view');
    const rings = Array.from(section.querySelectorAll('.ring'));
    const items = Array.from(section.querySelectorAll('.level'));
    const buttons = Array.from(section.querySelectorAll('.levels__btn'));
    const readout = section.querySelector('.levels__readout-name');
    const steps = Array.from(section.querySelectorAll('.levels__steps i'));
    if (!track || !stage || !svg || !rings.length) return;


    // Frames per level: centre and half-size of the square that holds each ring.
    const geo = [0, 1, 2].map((lvl) => {
      const c = rings.find((r) => Number(r.dataset.level) === lvl);
      const r = Number(c.getAttribute('r'));
      return { x: Number(c.getAttribute('cx')), y: Number(c.getAttribute('cy')), r, h: r * 1.18 };
    });
    // Scroll stops: hold, move, hold, move, hold.
    const STOPS = [0.08, 0.5, 0.92];
    const names = items.map((li) => li.querySelector('.level__name').textContent);
    let current = -1;
    let shown = 0;  // the level the rings currently frame, fractional while moving

    const setActive = (lvl) => {
      if (lvl === current) return;
      current = lvl;
      items.forEach((li) => li.classList.toggle('is-active', Number(li.dataset.level) === lvl));
      rings.forEach((r) => r.classList.toggle('is-active', Number(r.dataset.level) === lvl));
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === lvl)));
      steps.forEach((s, i) => s.classList.toggle('is-on', i === lvl));
      if (readout) readout.textContent = names[lvl];
    };

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const levelAt = (p) => {
      if (p <= STOPS[0]) return 0;
      if (p >= STOPS[2]) return 2;
      const seg = p < STOPS[1] ? 0 : 1;
      const t = (p - STOPS[seg]) / (STOPS[seg + 1] - STOPS[seg]);
      return seg + ease(Math.min(1, Math.max(0, t)));
    };
    const frameFor = (l) => {
      const i = Math.min(1, Math.floor(l));
      const t = l - i;
      const a = geo[i];
      const b = geo[i + 1];
      const h = Math.exp(Math.log(a.h) + (Math.log(b.h) - Math.log(a.h)) * t);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      return [x - h, y - h, 2 * h, 2 * h];
    };
    const showFrame = (l) => {
      shown = l;
      svg.setAttribute('viewBox', frameFor(l).map((v) => v.toFixed(2)).join(' '));
    };
    const progress = () => {
      const rect = track.getBoundingClientRect();
      const span = rect.height - stage.offsetHeight;
      return span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    };

    // ── Settled mode: buttons and ring clicks zoom between levels in place.
    let anim = 0;
    const zoomTo = (lvl) => {
      setActive(lvl);
      cancelAnimationFrame(anim);
      if (reduceMotion.matches) { showFrame(lvl); return; }
      const from = shown;
      const t0 = performance.now();
      const dur = 450 + 250 * Math.abs(lvl - from);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        showFrame(from + (lvl - from) * ease(t));
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };

    // ── Scroll mode
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!section.classList.contains('is-scrolly')) return;
      const l = levelAt(progress());
      showFrame(l);
      setActive(Math.round(l));
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };

    // Static view for windows where the sticky stage does not fit; lvl is the level to show.
    const settle = (lvl = 0) => {
      if (section.classList.contains('is-settled')) return;
      window.removeEventListener('scroll', onScroll);
      // Keep what is on screen still while the tall scroll track collapses above it.
      const above = section.getBoundingClientRect().bottom <= 0;
      const before = track.offsetHeight;
      section.classList.remove('is-scrolly');
      section.classList.add('is-settled');
      const after = track.offsetHeight;
      // 'instant': the page's CSS asks for smooth scrolling, which would animate this correction.
      if (above && before !== after) window.scrollBy({ top: after - before, behavior: 'instant' });
      cancelAnimationFrame(anim);
      showFrame(lvl);
      setActive(lvl);
    };

    const goTo = (lvl) => {
      if (section.classList.contains('is-scrolly')) {
        const top = track.getBoundingClientRect().top + window.scrollY;
        const span = track.offsetHeight - stage.offsetHeight;
        window.scrollTo({ top: top + span * STOPS[lvl], behavior: 'smooth' });
      } else if (section.classList.contains('is-settled')) {
        zoomTo(lvl);
      } else {
        setActive(lvl);
      }
    };
    buttons.forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.level))));

    // A click picks the smallest ring that contains the point.
    view.addEventListener('click', (e) => {
      if (!section.classList.contains('is-scrolly') && !section.classList.contains('is-settled')) return;
      const m = svg.getScreenCTM();
      if (!m) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      const hit = geo.findIndex((g) => Math.hypot(pt.x - g.x, pt.y - g.y) <= g.r);
      goTo(hit === -1 ? 2 : hit);
    });

    const fits = () => {
      if (!window.matchMedia('(min-width: 1081px)').matches) return false;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
      const text = section.querySelector('.levels__text');
      return text.offsetHeight + 64 <= window.innerHeight - navH;
    };

    const apply = () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(anim);
      section.classList.remove('is-scrolly', 'is-settled');
      current = -1;
      if (reduceMotion.matches) {
        svg.setAttribute('viewBox', '0 10 200 200');
        rings.forEach((r) => r.classList.remove('is-active'));
        items.forEach((li) => li.classList.remove('is-active'));
        return;
      }
      section.classList.add('is-scrolly');
      // The sticky stage only works when the whole text column fits on screen beside the rings;
      // otherwise (phones, tablets, short windows) the section starts in its settled view.
      if (!fits()) { settle(0); return; }
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    };
    let resizeT = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        const scrolly = section.classList.contains('is-scrolly');
        if (scrolly && !fits()) settle(current < 0 ? 0 : current);
        else if (section.classList.contains('is-settled')) {
          // Grown large enough again: back to the scroll-driven zoom.
          section.classList.remove('is-settled');
          section.classList.add('is-scrolly');
          if (fits()) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
          else { section.classList.remove('is-scrolly'); section.classList.add('is-settled'); }
        } else if (scrolly) onScroll();
      }, 150);
    });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', apply);
    apply();
  }

  // ───────── Opening rings: parallax ─────────
  // The rings behind the hero and the argument trail the scroll at a fraction of its speed.
  function initParallax() {
    const rings = document.querySelector('.opening__rings');
    const opening = document.querySelector('.opening');
    if (!rings || !opening || reduceMotion.matches) return;
    // Centred on the middle of the opening's scroll range, so the rings start a little high and end a
    // little low, never far enough to be cut off at the bottom of the Why section.
    const SPEED = 0.1;
    const MAX = 80;
    let mid = 0;
    const measure = () => { mid = (opening.getBoundingClientRect().bottom + window.scrollY - window.innerHeight) / 2; };
    let ticking = false;
    const update = () => {
      ticking = false;
      const shift = Math.max(-MAX, Math.min(MAX, (window.scrollY - mid) * SPEED));
      rings.style.setProperty('--parallax', shift.toFixed(1));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { measure(); onScroll(); });
    measure();
    update();
  }

  // ───────── Reveal on first scroll ─────────
  // Blocks below the opening fade up the first time they enter the viewport,
  // then stay. Without JS, or with reduced motion, everything is simply there.
  function initReveal() {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
    const groups = [
      '.why .section-title', '.beat', '.why__actions',
      '.levels__intro > *',
      '.research .section-title', '.research__intro', '.pubs',
      '.people .section-title', '.person',
      '.contact .section-title', '.contact__funding', '.contact__cols > div', '.contact-actions', '.contact-address',
      '.article__section > h2', '.article__section > .article__lead', '.article__section > .figure', '.split__figure', '.paper-list', '.support'
    ];
    const els = [];
    groups.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, i, all) => {
        if (el.closest('.hero') || els.includes(el)) return;
        // Siblings in one row arrive one after another.
        if (all.length > 1 && all.length <= 4) el.style.setProperty('--reveal-delay', i * 90 + 'ms');
        els.push(el);
      });
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-revealed');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach((el) => {
      // Anything already on screen at load stays put.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { el.classList.add('is-revealed'); return; }
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // ───────── Hero: acceleration chart ─────────
  // Draws the five measures from data/acceleration.json (every number traced in data/VERIFICATION.md).
  // Without JS or data the figure stays an empty frame; the hero copy carries the argument alone.
  function initAcceleration() {
    const figure = document.querySelector('.accel');
    if (!figure || !window.fetch) return;
    fetch('data/acceleration.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => initAccelerationChart(figure, data))
      .catch(() => figure.classList.add('accel--unavailable'));
  }

  function initAccelerationChart(root, DATA) {
    const FORMATS = {
      minutes: (v) => v < 10 ? Math.round(v * 10) / 10 + ' min' : v < 60 ? Math.round(v) + ' min' : (v / 60 < 10 ? Math.round(v / 6) / 10 : Math.round(v / 60)) + ' h',
      count: (v) => Math.round(v).toLocaleString('en'),
      millions: (v) => v.toFixed(1) + 'M H100e',
      percent: (v) => (Math.round(v * 10) / 10).toFixed(1) + '%',
      times: (v) => (v < 10 ? String(Math.round(v * 10) / 10) : Math.floor(v).toLocaleString('en')) + '× cheaper'
    };
    const TICKS = {
      minutes: (v) => v / 60 + ' h',
      count: (v) => v.toLocaleString('en'),
      millions: (v) => v + 'M',
      percent: (v) => v + '%',
      times: (v) => v.toLocaleString('en') + '×'
    };
    const usd = (v) => '$' + Number(v.toPrecision(2)).toString() + ' per question';
    const toYear = (s) => {
      if (/^\d{4}$/.test(s)) return +s;
      const d = new Date(s + 'T00:00:00Z'), y = d.getUTCFullYear();
      return y + (d - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
    };
    const fmtDate = (s) => /^\d{4}$/.test(s) ? s : new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const atT = (p) => /^\d{4}$/.test(p.date) ? +p.date + 0.5 : toYear(p.date);  // annual values sit mid-year
    const link = (src) => { const a = document.createElement('a'); a.href = src.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = src.title; return a; };
    const $ = (name) => root.querySelector('[data-accel="' + name + '"]');
    const NS = 'http://www.w3.org/2000/svg';
    const svg = $('svg'), tip = $('tip'), plot = svg.parentNode;
    const el = (n, a, parent) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const ORDER = DATA._meta.order;
    const T0 = toYear(DATA._meta.window[0]), T1 = toYear(DATA._meta.window[1]);
    const tabs = ORDER.map((k) => root.querySelector('#accel-tab-' + k));
    let current = 0, animate = false;

    function draw() {
      const key = ORDER[current], d = DATA[key], unit = FORMATS[d.format], tick = TICKS[d.format], top = d.ticks[d.ticks.length - 1];
      // Draw in real pixels so text keeps its size on every screen width.
      const W = Math.max(280, Math.round(plot.clientWidth)), H = Math.round(Math.min(330, Math.max(230, W * 0.5)));
      const M = { l: W < 420 ? 40 : 48, r: 18, t: 28, b: 34 };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('height', H);
      const x = (t) => M.l + ((t - T0) / (T1 - T0)) * (W - M.l - M.r);
      const y = (frac) => H - M.b - frac * (H - M.t - M.b);
      const placed = (k) => { const tp = DATA[k].ticks[DATA[k].ticks.length - 1]; return DATA[k].points.map((p) => [x(atT(p)), y(p.value / tp)]); };

      [...svg.children].forEach((n) => { if (n.tagName !== 'desc') n.remove(); });
      tip.hidden = true;
      svg.querySelector('desc').textContent = d.measure + '. ' + d.points.map((p) => p.label + ' (' + fmtDate(p.date) + '): ' + unit(p.value)).join('; ') + '.';

      const grid = el('g', { class: 'grid' }), ax = el('g', { class: 'ax' });
      d.ticks.forEach((v) => {
        el('line', { x1: M.l, x2: W - M.r, y1: y(v / top), y2: y(v / top) }, grid);
        el('text', { x: M.l - 8, y: y(v / top) + 4, 'text-anchor': 'end' }, ax).textContent = v === 0 ? '0' : tick(v);
      });
      const step = W < 420 ? 2 : 1;
      for (let yr = Math.ceil(T0); yr <= Math.floor(T1); yr++) {
        el('line', { class: 'yr', x1: x(yr), x2: x(yr), y1: H - M.b, y2: H - M.b + 5 }, ax);
        if ((yr - Math.ceil(T0)) % step === 0 || yr === Math.floor(T1)) {
          const edge = yr === Math.floor(T1) && x(yr) > W - M.r - 1;
          el('text', { x: x(yr), y: H - M.b + 21, 'text-anchor': edge ? 'end' : 'middle' }, ax).textContent = yr;
        }
      }
      el('line', { class: 'base', x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b });
      el('text', { class: 'ax__title', x: M.l, y: M.t - 14, 'text-anchor': 'start' }, ax).textContent = d.axis_label;

      ORDER.forEach((k, i) => {
        if (k === key) return;
        const pts = placed(k).map((p) => p.join(',')).join(' ');
        el('polyline', { class: 'line line--other', points: pts });
        const hl = el('polyline', { class: 'hit-line', points: pts });
        const t = document.createElementNS(NS, 'title'); t.textContent = 'Show ' + DATA[k].label; hl.appendChild(t);
        hl.addEventListener('click', () => select(i, false));
      });

      const pts = placed(key);
      const line = el('polyline', { class: 'line', points: pts.map((p) => p.join(',')).join(' ') });
      if (animate && !reduced.matches) {
        const len = Math.ceil(line.getTotalLength());
        line.style.setProperty('--len', len);
        line.style.strokeDasharray = len;
        line.classList.add('line--draw');
      }
      d.points.forEach((p, i) => {
        const [cx, cy] = pts[i];
        const end = i === d.points.length - 1;
        el('circle', { class: 'dot', cx, cy, r: end ? 5.5 : 3.5 });
        if (end || i === 0) {
          const txt = (d.format === 'times' && i === 0) ? '1×' : unit(p.value);
          el('text', { class: 'val', x: cx + (end ? -10 : 0), y: cy - 12, 'text-anchor': end ? 'end' : 'start' }).textContent = txt;
        }
        const name = p.label + ' · ' + fmtDate(p.date);
        const extra = p.cost_usd_per_question != null ? usd(p.cost_usd_per_question) : '';
        const hit = el('circle', { class: 'hit', cx, cy, r: 12, tabindex: 0, 'aria-label': name + ': ' + unit(p.value) + (extra ? ', ' + extra : '') });
        const show = () => {
          tip.replaceChildren();
          const b = document.createElement('b'); b.textContent = unit(p.value);
          const n = document.createElement('span'); n.textContent = name;
          tip.append(b, n);
          if (extra) { const c = document.createElement('span'); c.textContent = extra; tip.append(c); }
          tip.style.left = Math.min(Math.max(cx, 90), W - 90) + 'px';
          tip.style.top = cy + 'px';
          tip.hidden = false;
        };
        const hide = () => { tip.hidden = true; };
        hit.addEventListener('mouseenter', show); hit.addEventListener('focus', show);
        hit.addEventListener('mouseleave', hide); hit.addEventListener('blur', hide);
      });
    }

    // Every measure's headline and caption sit in the same grid cell; only the current one is visible,
    // so the figure keeps the height of the tallest and nothing around it moves when the tab changes.
    const stats = $('stats'), notes = $('notes');
    ORDER.forEach((k) => {
      const d = DATA[k], unit = FORMATS[d.format];
      const st = document.createElement('p'); st.className = 'accel__stat'; st.textContent = d.headline.text;
      stats.append(st);
      const note = document.createElement('div'); note.className = 'accel__note' + (d.breakdown ? ' accel__note--split' : '');
      const cap = document.createElement('p'); cap.className = 'accel__cap'; cap.textContent = d.caption;
      note.append(cap);
      if (d.breakdown) {
        const sizes = document.createElement('div'); sizes.className = 'accel__sizes';
        d.breakdown.forEach((b) => {
          const lab = document.createElement('span'); lab.textContent = b.label;
          const track = document.createElement('span'); track.className = 'track';
          const bar = document.createElement('span'); bar.className = 'bar'; bar.style.width = b.value + '%';
          track.append(bar);
          const num = document.createElement('span'); num.className = 'num'; num.textContent = unit(b.value);
          sizes.append(lab, track, num);
        });
        const sc = document.createElement('span'); sc.className = 'cap';
        sc.textContent = 'Share using AI by company size (employees), ' + d.breakdown[0].date;
        sizes.append(sc);
        note.append(sizes);
      }
      notes.append(note);
    });
    const moreBtn = $('more-btn'), more = $('more');
    moreBtn.addEventListener('click', () => {
      const open = moreBtn.getAttribute('aria-expanded') !== 'true';
      moreBtn.setAttribute('aria-expanded', String(open));
      moreBtn.textContent = open ? 'Show less' : 'Show more';
      more.hidden = !open;
    });
    const accessed = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

    function fill() {
      const d = DATA[ORDER[current]], s = d.source;
      [stats, notes].forEach((box) => [...box.children].forEach((c, j) => c.classList.toggle('is-current', j === current)));
      const a = link(s); a.textContent = s.short || s.title;
      $('src').replaceChildren('Source: ', a);
      const lines = [];
      const p1 = document.createElement('p'); p1.append(link(s), '. Accessed ' + accessed(s.accessed) + '.'); lines.push(p1);
      if (d.secondary_stat) { const p2 = document.createElement('p'); p2.append('Growth rate: ', link(d.secondary_stat.source), '.'); lines.push(p2); }
      if (s.note) { const p3 = document.createElement('p'); p3.textContent = s.note; lines.push(p3); }
      more.replaceChildren(...lines);
      root.querySelector('#accel-panel').setAttribute('aria-labelledby', 'accel-tab-' + ORDER[current]);
    }

    function select(i, focus) {
      current = i;
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      if (focus) tabs[i].focus();
      animate = true;
      fill(); draw();
      animate = false;
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        const n = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
        if (n !== undefined) { e.preventDefault(); select(n, true); }
      });
    });
    let raf = 0, lastW = 0;
    new ResizeObserver(() => {
      const w = Math.round(plot.clientWidth);
      if (w === lastW) return;
      lastW = w; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    }).observe(plot);
    fill(); draw();
  }

  initNav();
  initAccordion();
  initPublications();
  initToc();
  initTerms();
  initBudget();
  initCopy();
  initLevels();
  initAcceleration();
  initReveal();
  initParallax();
})();
