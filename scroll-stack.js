/*
 * Scroll Stack: cards pin and pile up on each other as the page scrolls.
 * Plain JavaScript port of the ScrollStack component from React Bits
 * (https://github.com/DavidHDev/react-bits), window-scroll mode.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License.
 *
 * Markup: <div class="scroll-stack"><div class="scroll-stack__inner">
 *           <div class="scroll-stack-card">...</div> (one per card)
 *         </div></div>
 * Then: ScrollStack.mount(rootElement, options)
 */
(function () {
  const resolveOffset = (value, size) => {
    if (typeof value === 'number') return value;
    const text = String(value).trim();
    if (text.endsWith('%')) return (parseFloat(text) / 100) * size;
    return parseFloat(text) || 0;
  };

  const toLength = value => (typeof value === 'number' ? `${value}px` : value);

  function mount(root, options) {
    const settings = Object.assign({
      itemDistance: 100,
      itemStackDistance: 24,
      stackPosition: '15%',
      itemScale: 0.05,
      baseScale: 0.8,
      dimAmount: 0.2,
      blurAmount: 0,
      tiltAmount: 0,
      rotationAmount: 0,
      holdDistance: 200,
      onStackComplete: null,
      onProgress: null
    }, options || {});

    const inner = root.querySelector('.scroll-stack__inner');
    const cards = Array.from(inner.children).filter(el => el.classList.contains('scroll-stack-card'));
    if (!cards.length) return null;

    // Build the same structure the React component renders: spacer + sticky slot per card, then an end spacer
    const n = cards.length;
    cards.forEach((card, index) => {
      if (!card.querySelector(':scope > .scroll-stack-card__shade')) {
        const shade = document.createElement('span');
        shade.className = 'scroll-stack-card__shade';
        shade.setAttribute('aria-hidden', 'true');
        card.appendChild(shade);
      }
      if (index > 0) {
        const gap = settings.itemDistance - (n - index) * settings.itemStackDistance;
        const spacer = document.createElement('div');
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.height = `${Math.max(0, gap)}px`;
        spacer.style.marginTop = `${Math.min(0, gap)}px`;
        inner.insertBefore(spacer, card);
      }
      const slot = document.createElement('div');
      slot.setAttribute('data-stack-slot', '');
      slot.className = 'scroll-stack__slot';
      slot.style.top = `calc(${toLength(settings.stackPosition)} + ${index * settings.itemStackDistance}px)`;
      slot.style.marginBottom = `${(n - 1 - index) * settings.itemStackDistance}px`;
      slot.style.zIndex = index + 1;
      inner.insertBefore(slot, card);
      slot.appendChild(card);
    });
    const end = document.createElement('div');
    end.className = 'scroll-stack__end';
    end.setAttribute('aria-hidden', 'true');
    inner.appendChild(end);

    const cache = new Map();
    let frame = 0;
    let complete = false;

    const write = (key, value, apply) => {
      if (cache.get(key) === value) return false;
      cache.set(key, value);
      apply(value);
      return true;
    };

    const update = () => {
      frame = 0;
      const slots = Array.from(inner.children).filter(child => child.hasAttribute('data-stack-slot'));
      if (!slots.length) return;

      const viewHeight = window.innerHeight;
      const viewTop = 0;
      const stackTop = resolveOffset(settings.stackPosition, viewHeight);
      const offset = settings.itemStackDistance;
      const heights = slots.map(slot => slot.offsetHeight);
      const tops = slots.map(slot => slot.getBoundingClientRect().top);

      const moved = write('endHeight', settings.holdDistance, value => {
        end.style.height = `${value}px`;
      });

      const depths = slots.map(() => 0);
      const covers = slots.map(() => 0);
      let lastCover = 0;
      for (let j = 1; j < slots.length; j++) {
        const pinBefore = viewTop + stackTop + (j - 1) * offset;
        const start = pinBefore + heights[j - 1];
        const span = Math.max(1, start - pinBefore - offset);
        const cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
        for (let i = 0; i < j; i++) depths[i] += cover;
        covers[j] = cover;
        lastCover = cover;
      }

      const dimStep = Math.min(Math.max(settings.dimAmount, 0), 1);
      slots.forEach((slot, i) => {
        const card = slot.firstElementChild;
        if (!card) return;
        const depth = depths[i];
        const lean = Math.min(depth, 1);
        const scale = Math.max(Math.min(settings.baseScale, 1), 1 - depth * settings.itemScale);
        const tilt = -lean * settings.tiltAmount;
        const turn = lean * settings.rotationAmount * (i % 2 ? -1 : 1);
        const blur = depth * settings.blurAmount;
        const dim = 1 - Math.pow(1 - dimStep, depth);
        const transform =
          depth < 0.0005
            ? ''
            : `perspective(1200px) rotateX(${tilt.toFixed(2)}deg) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        write(`transform${i}`, transform, value => {
          card.style.transform = value;
        });
        write(`filter${i}`, blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '', value => {
          card.style.filter = value;
        });
        write(`dim${i}`, dim.toFixed(3), value => {
          card.style.setProperty('--scroll-stack-dim', value);
        });
        // The card on top of the pile is the active step
        const active = depth < 0.5 && (i === 0 || covers[i] > 0.5);
        write(`active${i}`, active ? '1' : '', value => {
          card.classList.toggle('is-active', !!value);
        });
        if (active || depth > 0.0005) card.classList.add('is-seen');
      });

      if (settings.onProgress) {
        const landed = covers.reduce((sum, cover, i) => sum + (i === 0 ? 0 : cover), 0);
        settings.onProgress(landed / Math.max(1, slots.length - 1));
      }

      const done = slots.length > 1 && lastCover >= 0.999;
      if (done !== complete) {
        complete = done;
        if (done && settings.onStackComplete) settings.onStackComplete();
      }

      if (moved) schedule();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(inner);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    return {
      refresh: schedule,
      destroy: () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      }
    };
  }

  window.ScrollStack = { mount };
})();
