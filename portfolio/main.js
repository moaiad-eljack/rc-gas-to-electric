(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll */
  var items = document.querySelectorAll('.reveal, .phases');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* the big word drifts a little as you scroll */
  var word = document.querySelector('.word');
  var hero = document.querySelector('.hero');
  if (word && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, hero.offsetHeight);
        word.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* the nav flips to light text while a black section is under it */
  var nav = document.querySelector('.nav');
  var darks = document.querySelectorAll('.band, .foot');
  function tone() {
    var on = false;
    darks.forEach(function (el) {
      var b = el.getBoundingClientRect();
      if (b.top < 44 && b.bottom > 44) on = true;
    });
    nav.classList.toggle('is-dark', on);
  }
  window.addEventListener('scroll', tone, { passive: true });
  tone();

  /* liquid glass. Chromium can bend what is behind an element with an SVG
     displacement map. Everyone else keeps the plain blur from the stylesheet. */
  var ua = navigator.userAgent;
  var chromium = /Chrome\//.test(ua) && !/CriOS|FxiOS/.test(ua);
  if (!chromium) return;
  root.classList.add('lg');

  var defs = document.getElementById('glass-defs');
  var NS = 'http://www.w3.org/2000/svg';
  var count = 0;

  function mapFor(w, h, r, bezel) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        /* distance to the edge of a rounded rectangle, and the way out */
        var px = x + 0.5, py = y + 0.5;
        var qx = Math.abs(px - w / 2) - (w / 2 - r);
        var qy = Math.abs(py - h / 2) - (h / 2 - r);
        var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        var outside = Math.sqrt(ox * ox + oy * oy);
        var dist = r - outside - Math.min(Math.max(qx, qy), 0) * 0 ;
        if (qx <= 0 || qy <= 0) dist = Math.min(r - Math.max(qx, 0), r - Math.max(qy, 0));
        var nx = 0, ny = 0;
        if (qx > 0 && qy > 0) { nx = ox / (outside || 1); ny = oy / (outside || 1); }
        else if (qx > qy) { nx = 1; } else { ny = 1; }
        if (px < w / 2) nx = -nx;
        if (py < h / 2) ny = -ny;
        var t = Math.max(0, 1 - dist / bezel);
        var m = t * t;
        var i = (y * w + x) * 4;
        d[i] = 128 + nx * m * 127;
        d[i + 1] = 128 + ny * m * 127;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function dress(el) {
    var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    var r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
    var bezel = Math.min(parseFloat(el.dataset.glass) || 16, Math.min(w, h) / 2);
    var scale = 34;
    var id = el.dataset.lg || ('lg' + (++count));
    var f = document.getElementById(id);
    if (!f) {
      f = document.createElementNS(NS, 'filter');
      f.setAttribute('id', id);
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.setAttribute('filterUnits', 'userSpaceOnUse');
      f.setAttribute('primitiveUnits', 'userSpaceOnUse');
      f.appendChild(document.createElementNS(NS, 'feImage'));
      var dm = document.createElementNS(NS, 'feDisplacementMap');
      dm.setAttribute('in', 'SourceGraphic');
      dm.setAttribute('in2', 'map');
      dm.setAttribute('xChannelSelector', 'R');
      dm.setAttribute('yChannelSelector', 'G');
      f.appendChild(dm);
      defs.appendChild(f);
      el.dataset.lg = id;
    }
    f.setAttribute('x', 0); f.setAttribute('y', 0);
    f.setAttribute('width', w); f.setAttribute('height', h);
    var im = f.firstChild;
    im.setAttribute('x', 0); im.setAttribute('y', 0);
    im.setAttribute('width', w); im.setAttribute('height', h);
    im.setAttribute('result', 'map');
    im.setAttribute('preserveAspectRatio', 'none');
    im.setAttribute('href', mapFor(w, h, r, bezel));
    f.lastChild.setAttribute('scale', scale);
    el.style.backdropFilter = 'url(#' + id + ') blur(2.5px) saturate(1.5)';
  }

  var glass = Array.prototype.slice.call(document.querySelectorAll('.glass'));
  function dressAll() { glass.forEach(dress); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dressAll); else dressAll();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(dressAll, 180); });
})();
