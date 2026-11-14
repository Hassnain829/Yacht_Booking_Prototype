/* Home page — featured fleet tabs, gallery lightbox, hero video toggle */
(function () {
  const grid = document.getElementById('featured-yachts');
  const tabs = document.getElementById('fleet-tabs');
  const yachts = CYB.data.yachts;

  const sets = {
    all: yachts.filter((y) => y.featured),
    small: yachts.filter((y) => y.guests <= 13),
    large: yachts.filter((y) => y.guests > 13),
  };

  function render(size) {
    grid.innerHTML = sets[size].slice(0, 3).map((y, i) => CYB.ui.yachtCard(y, { delay: i })).join('');
    CYB.refresh();
  }

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-size]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach((b) => {
      const on = b === btn;
      b.className = on
        ? 'rounded-full bg-navy-950 px-5 py-2.5 text-sm font-bold text-white'
        : 'rounded-full border border-navy-200 px-5 py-2.5 text-sm font-bold text-navy-700 hover:border-navy-950';
      b.setAttribute('aria-selected', String(on));
    });
    render(btn.dataset.size);
  });
  render('all');

  // Gallery -> lightbox
  const gallery = document.getElementById('home-gallery');
  const imgs = Array.from(gallery.querySelectorAll('img')).map((i) => i.getAttribute('src'));
  gallery.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gallery-index]');
    if (btn) CYB.lightbox(imgs, Number(btn.dataset.galleryIndex));
  });

  // Hero video pause / play (accessibility)
  const video = document.getElementById('hero-video');
  const toggle = document.getElementById('video-toggle');
  toggle?.addEventListener('click', () => {
    const paused = video.paused;
    paused ? video.play() : video.pause();
    toggle.innerHTML = `<i data-lucide="${paused ? 'pause' : 'play'}" class="h-4 w-4"></i><span>${paused ? 'Pause video' : 'Play video'}</span>`;
    toggle.setAttribute('aria-label', paused ? 'Pause background video' : 'Play background video');
    CYB.icons();
  });
})();
