(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };               /* smoothstep */
  var out = function (t) { return 1 - Math.pow(1 - t, 3); };              /* ease out cubic */

  /* small things fade up once */
  var items = document.querySelectorAll('.reveal');
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

  var nav = document.querySelector('.nav');
  var team = document.querySelector('.team');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var N = panels.length;
  var idx = document.querySelector('.idx');
  var bar = document.querySelector('.idx__bar');
  var cells = Array.prototype.slice.call(idx.querySelectorAll('a'));
  function setBar(pos, lag) {            /* pos in cells, lag = how far the back edge trails */
    var l = clamp(pos * 25 - Math.max(lag, 0) * 25, 0, 75), r = clamp(pos * 25 + 25 + Math.max(-lag, 0) * 25, 25, 100);
    bar.style.clipPath = 'inset(0 ' + (100 - r).toFixed(2) + '% 0 ' + l.toFixed(2) + '% round 19px)';
  }
  var word = document.querySelector('.word');
  var hero = document.querySelector('.hero');

  /* index links jump to the right person in either mode */
  function personTop(i) {
    if (!root.classList.contains('pin')) return panels[i].getBoundingClientRect().top + window.scrollY;
    return team.offsetTop + i * window.innerHeight + 2;
  }
  function go(i) {
    return function (e) {
      e.preventDefault();
      window.scrollTo({ top: personTop(i), behavior: reduce ? 'auto' : 'smooth' });
      panels[i].setAttribute('tabindex', '-1');
      panels[i].focus({ preventScroll: true });
    };
  }
  cells.forEach(function (a, i) { a.addEventListener('click', go(i)); });
  [document.querySelector('.skip'), document.querySelector('.cta .btn')].forEach(function (a) {
    if (a) a.addEventListener('click', go(0));
  });

  /* ---- no motion: plain stacked sections, index and nav tone follow the scroll ---- */
  if (reduce) {
    var plain = function () {
      var cur = -1, dark = false;
      panels.forEach(function (p, i) {
        var b = p.getBoundingClientRect();
        if (b.top < window.innerHeight * 0.5) cur = i;
        if (b.top < 44 && b.bottom > 44) dark = p.classList.contains('panel--ink');
      });
      var on = cur >= 0 && team.getBoundingClientRect().bottom > 80;
      idx.classList.toggle('on', on);
      setBar(Math.max(cur, 0), 0);
      nav.classList.toggle('is-dark', dark);
    };
    window.addEventListener('scroll', plain, { passive: true });
    plain();
    glass();
    return;
  }

  /* ---- pinned team: one screen, four people, driven by scroll ---- */
  root.classList.add('pin');
  team.style.setProperty('--n', N);
  var parts = panels.map(function (p) {
    return {
      el: p,
      inner: p.querySelector('.panel__in'),
      chars: Array.prototype.slice.call(p.querySelectorAll('.ch')),
      art: p.querySelector('.p__art'),
      frame: p.querySelector('.p__frame'),
      meta: p.querySelector('.p__meta'),
      k: p.querySelector('.p__k'),
      ink: p.classList.contains('panel--ink'),
      shown: null
    };
  });
  var strip = document.querySelector('.count__strip');
  var vh = window.innerHeight, top = 0;
  var target = 0, cur = 0, enter0 = 0, enterCur = 0, vel = 0, raf = 0, inTeam = false;

  var th = 0;
  function measure() { vh = window.innerHeight; top = team.offsetTop; th = team.offsetHeight; }

  var lastY = 0;
  function read() {
    var y = window.scrollY; lastY = y;
    target = clamp((y - top) / vh, 0, N - 1);
    /* the first person builds up while the section is still sliding into place */
    enter0 = clamp((y - (top - vh * 0.8)) / (vh * 0.8), 0, 1);
    var end = top + th;
    inTeam = y > top - vh * 0.5 && y < end - vh * 0.55;
    if (word) {
      var hy = Math.min(y, hero.offsetHeight);
      word.style.transform = 'translate3d(0,' + (hy * 0.12).toFixed(1) + 'px,0)';
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function seg(i) {                    /* 0..1 for the move from person i to i+1, with a rest at both ends */
    return ease(clamp((cur - i - 0.12) / 0.76, 0, 1));
  }

  function frame() {
    var prev = cur;
    cur += (target - cur) * 0.11;
    enterCur += (enter0 - enterCur) * 0.11;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    if (Math.abs(enter0 - enterCur) < 0.0004) enterCur = enter0;
    vel += ((cur - prev) - vel) * 0.25;

    var darkTop = false;
    for (var i = 0; i < N; i++) {
      var p = parts[i];
      var r = i === 0 ? 1 : seg(i - 1);          /* how far this one has wiped in */
      var l = i < N - 1 ? seg(i) : 0;            /* how far the next one has covered it */
      var visible = r > 0.001 && l < 0.999;
      if (visible !== p.shown) { p.el.style.visibility = visible ? 'visible' : 'hidden'; p.shown = visible; }
      if (!visible) continue;

      p.el.style.clipPath = r >= 1 ? 'none' : 'inset(' + ((1 - r) * 100).toFixed(2) + '% 0 0 0)';
      /* the sheet underneath sinks back a little as it gets covered */
      p.inner.style.transform = 'translate3d(0,' + (-l * 7).toFixed(2) + 'vh,0) scale(' + (1 - l * 0.035).toFixed(4) + ')';
      p.inner.style.opacity = (1 - l * 0.45).toFixed(3);

      var e = i === 0 ? enterCur : r;            /* build up of the content itself */
      var n = p.chars.length;
      for (var c = 0; c < n; c++) {
        var t = out(clamp((e - 0.34 - c * 0.055) / 0.5, 0, 1));
        p.chars[c].style.transform = 'translate3d(0,' + ((1 - t) * 108).toFixed(2) + '%,0) rotate(' + ((1 - t) * 5).toFixed(2) + 'deg)';
      }
      p.art.style.setProperty('--dr', ease(clamp((e - 0.3) / 0.7, 0, 1)).toFixed(4));
      var ft = out(clamp((e - 0.25) / 0.7, 0, 1));
      p.frame.style.transform = 'translate3d(0,' + ((1 - ft) * 90 - l * 30).toFixed(2) + 'px,0) rotate(' + ((1 - ft) * -5).toFixed(2) + 'deg)';
      p.frame.style.opacity = ft.toFixed(3);
      var mt = clamp((e - 0.6) / 0.4, 0, 1);
      p.meta.style.opacity = mt.toFixed(3);
      p.meta.style.transform = 'translate3d(0,' + ((1 - mt) * 14).toFixed(2) + 'px,0)';
      p.k.style.opacity = (mt * 0.72).toFixed(3);

      if (r > 0.955) darkTop = p.ink;            /* this sheet has reached the top bar */
    }

    /* counter rolls like an odometer */
    var roll = 0;
    for (var s = 0; s < N - 1; s++) roll += seg(s);
    strip.style.transform = 'translate3d(0,' + (-roll).toFixed(4) + 'em,0)';

    /* top index: the bar slides with the scroll and stretches a touch when moving fast */
    setBar(roll, clamp(vel * 9, -0.38, 0.38));
    idx.classList.toggle('on', inTeam);

    nav.classList.toggle('is-dark', lastY > top - 44 && lastY < top + th - 44 && darkTop);

    if (cur !== target || enterCur !== enter0 || Math.abs(vel) > 0.0002) raf = requestAnimationFrame(frame);
    else raf = 0;
  }

  measure();
  window.addEventListener('scroll', read, { passive: true });
  window.addEventListener('resize', function () { measure(); read(); });
  window.addEventListener('load', function () { measure(); read(); });
  read();
  cur = target; enterCur = enter0;
  glass();

  /* ---- liquid glass. Chromium can bend what is behind an element with an SVG
     displacement map. Everyone else keeps the plain blur from the stylesheet. ---- */
  function glass() {
    var ua = navigator.userAgent;
    if (!/Chrome\//.test(ua) || /CriOS|FxiOS/.test(ua)) return;
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
          var px = x + 0.5, py = y + 0.5;
          var ex = w / 2 - Math.abs(px - w / 2);      /* distance to the nearest side */
          var ey = h / 2 - Math.abs(py - h / 2);
          var dist, nx = 0, ny = 0;
          if (ex < r && ey < r) {                     /* inside a rounded corner */
            var qx = r - ex, qy = r - ey;
            var o = Math.sqrt(qx * qx + qy * qy) || 1;
            dist = r - o; nx = qx / o; ny = qy / o;
          } else if (ex < ey) { dist = ex; nx = 1; }
          else { dist = ey; ny = 1; }
          if (px < w / 2) nx = -nx;
          if (py < h / 2) ny = -ny;
          var t = Math.max(0, 1 - Math.max(dist, 0) / bezel);
          var m = t * t;
          var i = (y * w + x) * 4;
          d[i] = 128 + nx * m * 127; d[i + 1] = 128 + ny * m * 127; d[i + 2] = 128; d[i + 3] = 255;
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
      f.lastChild.setAttribute('scale', el.classList.contains('p__frame') ? 46 : 34);
      el.style.backdropFilter = 'url(#' + id + ') blur(' + (el.classList.contains('nav') ? 9 : 2.5) + 'px) saturate(1.5)';
    }

    var all = Array.prototype.slice.call(document.querySelectorAll('.glass'));
    var run = function () { all.forEach(dress); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(run, 180); });
  }
})();
