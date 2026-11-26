// Motion seluruh situs (Bagian 8). Konten tetap terlihat tanpa JS: state awal hanya diset oleh GSAP.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

let ctx: gsap.Context | undefined;
let lenis: Lenis | undefined;
let tick: ((t: number) => void) | undefined;
let rotateTimers: number[] = [];
const splitBackup = new Map<HTMLElement, string>();

/** Pecah teks nama jadi huruf ber-mask (hanya saat animasi penuh). Teks asli tetap di aria-label. */
function splitChars(el: HTMLElement): HTMLElement[] {
  const target = el.querySelector<HTMLElement>(':scope > span') ?? el;
  const text = target.textContent ?? '';
  splitBackup.set(target, target.innerHTML);
  el.setAttribute('aria-label', el.textContent?.trim() ?? text);
  target.innerHTML = '';
  const inner: HTMLElement[] = [];
  // Per kata dulu (nowrap) supaya baris hanya patah di antara kata, lalu per huruf untuk mask.
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) return target.append(document.createTextNode(' '));
    const word = document.createElement('span');
    word.className = 'ch-word';
    word.setAttribute('aria-hidden', 'true');
    for (const ch of part) {
      const mask = document.createElement('span');
      mask.className = 'ch-mask';
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = ch;
      mask.append(c);
      word.append(mask);
      inner.push(c);
    }
    target.append(word);
  });
  return inner;
}

/** Intro hero Spotlight / Showcase / Cutout (Bagian 8 + brief varian). */
function heroIntro(full: boolean) {
  const hero = document.querySelector<HTMLElement>('.spot, .showcase, .cutout');
  if (!hero) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const card = hero.querySelector('[data-card-intro]');
  if (card) tl.from(card, { opacity: 0, scale: full ? 0.97 : 1, duration: 0.9, clearProps: 'transform' }, 0);
  const photo = hero.querySelector<HTMLElement>('[data-photo-intro]');
  if (photo) {
    const spot = photo.dataset.photoIntro === 'spotlight';
    tl.from(
      photo,
      full ? { scale: spot ? 1.08 : 1.06, filter: spot ? 'blur(12px)' : 'none', opacity: spot ? 0 : 1, duration: spot ? 1.4 : 1.6, clearProps: 'transform,filter' } : { opacity: 0, duration: 1 },
      0,
    );
  }
  const wm = hero.querySelector('[data-fade-in]');
  if (wm) tl.from(wm, { opacity: 0, duration: 1.2 }, 0);
  const pop = hero.querySelector('[data-pop]');
  if (pop) tl.from(pop, { opacity: 0, scale: full ? 0.6 : 1, duration: 1.2, clearProps: 'transform' }, 0.1);
  const name = hero.querySelector<HTMLElement>('[data-split-chars]');
  if (name) {
    if (full) tl.from(splitChars(name), { yPercent: 100, duration: 0.9, stagger: 0.03 }, 0.3);
    else tl.from(name, { opacity: 0, duration: 0.8 }, 0.3);
  }
  const subject = hero.querySelector('[data-subject-intro]');
  if (subject) tl.from(subject, { opacity: 0, y: full ? 40 : 0, duration: 1, clearProps: 'transform' }, 0.4);
  const rise = hero.querySelectorAll('[data-rise]');
  if (rise.length) tl.from(rise, { opacity: 0, y: full ? 20 : 0, duration: 0.7, stagger: hero.matches('.showcase') ? 0.08 : 0.1, clearProps: 'transform' }, '>-0.5');
  const header = document.querySelector('[data-header]');
  if (header) tl.from(header, { opacity: 0, duration: 0.6 }, '>-0.2');

  // Layanan bergantian (Cutout): hanya di level penuh, berhenti saat di-hover.
  if (full)
    hero.querySelectorAll<HTMLElement>('[data-rotate]').forEach((list) => {
      const items = [...list.children] as HTMLElement[];
      if (items.length < 2) return;
      let i = 0;
      let paused = false;
      list.addEventListener('mouseenter', () => (paused = true));
      list.addEventListener('mouseleave', () => (paused = false));
      rotateTimers.push(
        window.setInterval(() => {
          if (paused) return;
          items[i].classList.remove('is-active');
          i = (i + 1) % items.length;
          items[i].classList.add('is-active');
        }, 2200),
      );
    });
}

/** Parallax hero, hanya desktop & level penuh (dipanggil dari dalam gsap.context). */
function heroScroll() {
  if (document.documentElement.dataset.motion !== 'full' || !matchMedia('(min-width: 1024px)').matches) return;
  const hero = document.querySelector<HTMLElement>('.spot, .showcase, .cutout');
  if (!hero) return;
  const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  hero.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => gsap.to(el, { yPercent: Number(el.dataset.parallax), ease: 'none', scrollTrigger: st }));
  hero.querySelectorAll<HTMLElement>('[data-parallax-x]').forEach((el) => gsap.to(el, { xPercent: Number(el.dataset.parallaxX), ease: 'none', scrollTrigger: st }));
  if (hero.matches('[data-scroll-scale]')) {
    const card = hero.querySelector('[data-card-intro]');
    if (card) gsap.to(card, { scale: 0.98, ease: 'none', scrollTrigger: { ...st, start: 'center top' } });
  }
}

function setup() {
  const level = document.documentElement.dataset.motion ?? 'full';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (level === 'off' || reduced) return;
  const full = level === 'full';
  const y = full ? 24 : 0;

  if (full) {
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    tick = (t) => lenis!.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  ctx = gsap.context(() => {
    const heroLines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
    if (heroLines.length) gsap.from(heroLines, { y, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' });

    heroIntro(full);
    heroScroll();

    const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
    gsap.set(reveals, { opacity: 0, y });
    ScrollTrigger.batch(reveals, {
      start: 'top 85%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' }),
    });

    gsap.utils.toArray<HTMLElement>('[data-clip]').forEach((el) => {
      gsap.fromTo(
        el,
        full ? { clipPath: 'inset(0% 0% 100% 0%)' } : { opacity: 0 },
        {
          ...(full ? { clipPath: 'inset(0% 0% 0% 0%)' } : { opacity: 1 }),
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, {
        v: end,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          const n = String(Math.round(obj.v));
          el.textContent = el.dataset.sep ? n.replace(/\B(?=(\d{3})+(?!\d))/g, el.dataset.sep) : n;
        },
      });
    });
  });
}

function teardown() {
  rotateTimers.forEach(clearInterval);
  rotateTimers = [];
  splitBackup.forEach((html, el) => (el.innerHTML = html));
  splitBackup.clear();
  ctx?.revert();
  ctx = undefined;
  if (tick) gsap.ticker.remove(tick);
  tick = undefined;
  lenis?.destroy();
  lenis = undefined;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', teardown);
