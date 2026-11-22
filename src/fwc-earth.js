/*
 * Flexible Weather Card - 3D-ERDE
 * Dateiname: fwc-earth.js
 * Erdkugel mit echten Satellitenwolken (EUMETSAT, alle 3 Std.), Tag/Nacht-Grenze nach dem aktuellen
 * Sonnenstand, Stadtlichtern auf der Nachtseite, Niederschlagsradar (RainViewer) und Standort-Markierung.
 * Gezeichnet wird mit WebGL in einem einzigen Shader (Ray-Sphere): die Grafikkarte übernimmt die ganze
 * Arbeit, der Prozessor setzt pro Bild nur ein paar Werte. Ohne WebGL gibt es eine einfache CSS-Kugel.
 */

const FWC_EARTH = (() => {
  const RAD = Math.PI / 180;
  // Bilder: Live Cloud Maps (CC0, Wolken: EUMETSAT, Erde: NASA Blue Marble / Earth at Night), CORS erlaubt
  const BASE = 'https://clouds.matteason.co.uk/images';
  const SIZES = [1024, 2048, 4096];
  const SLOT = 3 * 3600000; // neue Wolkenbilder alle 3 Stunden

  /* ---------- Bilder laden (einmal je Adresse, für alle Cards gemeinsam) ---------- */
  const images = new Map();
  const loadImage = (url) => {
    let e = images.get(url);
    if (e && !(e.err && Date.now() - e.t > 5 * 60000)) return e;
    e = { img: null, ok: false, err: false, t: Date.now() };
    e.promise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => { e.img = img; e.ok = true; resolve(e); };
      img.onerror = () => { e.err = true; e.t = Date.now(); resolve(e); };
      img.src = url;
    });
    images.set(url, e);
    if (images.size > 16) images.delete(images.keys().next().value);
    return e;
  };

  // Radar: Weltkarte aus RainViewer-Kacheln (Mercator) zu einem Bild zusammensetzen –
  // Zoom 2 = 4x4 Kacheln (1024 px), beim Heranzoomen Zoom 3 = 8x8 Kacheln (2048 px)
  const radars = new Map();
  const loadRadar = (url) => {
    let e = radars.get(url);
    if (e) return e;
    e = { canvas: null, ok: false, err: false };
    const z = Number((url.match(/\/256\/(\d)\//) || [])[1]) || 2, n = 2 ** z;
    e.promise = new Promise((resolve) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256 * n;
      const g = cv.getContext('2d');
      let left = n * n, good = 0;
      const done = () => { if (--left) return; e.ok = good > 0; e.err = !good; e.canvas = good ? cv : null; resolve(e); };
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { g.drawImage(img, x * 256, y * 256); good++; done(); };
        img.onerror = done;
        img.src = url.replace('{x}', x).replace('{y}', y);
      }
    });
    radars.set(url, e);
    if (radars.size > 4) radars.delete(radars.keys().next().value);
    return e;
  };


  /* ---------- Wind: Raster aus Open-Meteo (Welt grob + Region um den Standort fein) ----------
   * Ein Abruf liefert die Windwerte der nächsten Stunden für alle Rasterpunkte; dazwischen wird zeitlich
   * interpoliert. Neu geladen wird höchstens alle 6 Stunden, das Ergebnis bleibt im Browser gespeichert
   * (auch über ein Neuladen der Seite hinweg). Jeder Rasterpunkt zählt bei Open-Meteo wie ein Abruf. */
  const WIND_TTL = 6 * 3600000;
  const OM = 'https://api.open-meteo.com/v1/forecast';
  const grids = (lat, lon) => {
    const gl = { lat0: -80, dlat: 10, nlat: 17, lon0: -180, dlon: 20, nlon: 18, wrap: true };
    const cLat = Math.max(-64, Math.min(64, Math.round(lat / 2) * 2)), cLon = Math.round(lon / 2) * 2;
    const rg = { lat0: cLat - 16, dlat: 4, nlat: 9, lon0: cLon - 30, dlon: 5, nlon: 13, wrap: false };
    return [gl, rg];
  };
  const pts = (g) => {
    const out = [];
    for (let i = 0; i < g.nlat; i++) for (let j = 0; j < g.nlon; j++) {
      let lo = g.lon0 + j * g.dlon;
      lo = ((lo + 540) % 360) - 180;
      out.push([g.lat0 + i * g.dlat, lo]);
    }
    return out;
  };
  const winds = new Map();
  const loadWind = (lat, lon) => {
    const gs = grids(lat, lon);
    const key = `fwc-earth-wind|${gs[1].lat0}|${gs[1].lon0}`;
    let e = winds.get(key);
    const now = Date.now();
    if (e && (e.promise || (e.data && now - e.t < WIND_TTL) || (e.err && now < e.retry))) return e;
    if (!e) {
      e = { data: null, t: 0, promise: null, err: false, retry: 0 };
      winds.set(key, e);
      // gespeicherte Daten vom letzten Seitenaufruf übernehmen
      try {
        // Pause nach einem Fehler gilt auch nach dem Neuladen der Seite
        const until = Number(localStorage.getItem(`${key}|retry`) || 0);
        if (until > now) { e.err = true; e.retry = until; return e; }
        const st = JSON.parse(localStorage.getItem(key) || 'null');
        if (st && now - st.t < WIND_TTL && st.times && st.times[st.times.length - 1] * 1000 > now) {
          e.data = { times: st.times, grids: gs.map((g, k) => ({ ...g, s: st.s[k], d: st.d[k] })) };
          e.t = st.t;
          return e;
        }
      } catch (err) { /* kein Speicher verfügbar */ }
    }
    const all = gs.flatMap(pts);
    const chunks = [];
    for (let i = 0; i < all.length; i += 150) chunks.push(all.slice(i, i + 150));
    e.promise = Promise.all(chunks.map(async (c) => {
      const url = `${OM}?latitude=${c.map(p => p[0]).join(',')}&longitude=${c.map(p => p[1]).join(',')}`
        + '&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timeformat=unixtime&timezone=GMT&past_hours=1&forecast_hours=12';
      const r = await fetch(url);
      if (!r.ok) { const er = new Error(`HTTP ${r.status}`); er.status = r.status; throw er; }
      const j = await r.json();
      return Array.isArray(j) ? j : [j];
    })).then((parts) => {
      const list = parts.flat();
      const times = list[0].hourly.time;
      const s = [], d = [];
      let k = 0;
      gs.forEach((g) => {
        const n = g.nlat * g.nlon, ss = [], dd = [];
        for (let i = 0; i < n; i++, k++) {
          const h = list[k] && list[k].hourly;
          ss.push((h && h.wind_speed_10m) ? h.wind_speed_10m.map(v => Math.round((v || 0) * 10) / 10) : times.map(() => 0));
          dd.push((h && h.wind_direction_10m) ? h.wind_direction_10m.map(v => Math.round(v || 0)) : times.map(() => 0));
        }
        s.push(ss); d.push(dd);
      });
      e.data = { times, grids: gs.map((g, i) => ({ ...g, s: s[i], d: d[i] })) };
      e.t = Date.now();
      e.err = false;
      try { localStorage.setItem(key, JSON.stringify({ t: e.t, times, s, d })); } catch (err) { /* Speicher voll */ }
    }).catch((err) => {
      e.err = true;
      // zu viele Abrufe (429): lange Pause, damit die übrigen Online-Daten der Card nicht leiden
      e.retry = Date.now() + (err && err.status === 429 ? 3 * 3600000 : 30 * 60000);
      try { localStorage.setItem(`${key}|retry`, String(e.retry)); } catch (er) { /* egal */ }
      console.warn('[flexible-weather-card] 3D-Erde: Winddaten nicht verfügbar', err && err.message ? err.message : err);
    }).finally(() => { e.promise = null; });
    return e;
  };

  // Windfeld zum Zeitpunkt t (ms) als u/v (m/s, Ost/Nord) je Rasterpunkt
  const windField = (data, t) => {
    const ts = data.times;
    let i = 0;
    while (i < ts.length - 2 && ts[i + 1] * 1000 <= t) i++;
    const f = Math.max(0, Math.min(1, (t / 1000 - ts[i]) / Math.max(1, ts[i + 1] - ts[i])));
    return data.grids.map((g) => {
      const n = g.nlat * g.nlon, u = new Float32Array(n), v = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const s0 = g.s[k][i], s1 = g.s[k][i + 1] ?? s0;
        const a0 = g.d[k][i] * RAD, a1 = (g.d[k][i + 1] ?? g.d[k][i]) * RAD;
        // Richtung = woher der Wind kommt -> Bewegung in die Gegenrichtung
        const u0 = -s0 * Math.sin(a0), v0 = -s0 * Math.cos(a0), u1 = -s1 * Math.sin(a1), v1 = -s1 * Math.cos(a1);
        u[k] = u0 + (u1 - u0) * f;
        v[k] = v0 + (v1 - v0) * f;
      }
      return { ...g, u, v };
    });
  };
  // bilinear im Raster; Region (fein) hat Vorrang, zum Rand hin weich in das Weltraster überblendet
  const sampleGrid = (g, lat, lon, out) => {
    let x = (lon - g.lon0) / g.dlon;
    if (g.wrap) x = ((x % g.nlon) + g.nlon) % g.nlon;
    const y = (lat - g.lat0) / g.dlat;
    if (!g.wrap && (x < 0 || x > g.nlon - 1)) return false;
    if (y < 0 || y > g.nlat - 1) { if (!g.wrap) return false; }
    const yy = Math.max(0, Math.min(g.nlat - 1.0001, y));
    const i = Math.floor(yy), fy = yy - i;
    const j = Math.floor(x), fx = x - j;
    const j1 = g.wrap ? (j + 1) % g.nlon : Math.min(j + 1, g.nlon - 1);
    const a = i * g.nlon, b = Math.min(i + 1, g.nlat - 1) * g.nlon;
    const bl = (arr) => (arr[a + j] * (1 - fx) + arr[a + j1] * fx) * (1 - fy) + (arr[b + j] * (1 - fx) + arr[b + j1] * fx) * fy;
    out[0] = bl(g.u); out[1] = bl(g.v);
    return true;
  };
  const sampleWind = (field, lat, lon, out) => {
    const gl = field[0], rg = field[1];
    sampleGrid(gl, lat, lon, out);
    const tmp = sampleWind.tmp || (sampleWind.tmp = [0, 0]);
    if (sampleGrid(rg, lat, rg.lon0 + (((lon - rg.lon0) % 360) + 360) % 360, tmp)) {
      const ex = Math.min((lat - rg.lat0) / rg.dlat, (rg.lat0 + (rg.nlat - 1) * rg.dlat - lat) / rg.dlat);
      const ey = Math.min((((lon - rg.lon0) % 360) + 360) % 360 / rg.dlon, (rg.nlon - 1) - (((lon - rg.lon0) % 360) + 360) % 360 / rg.dlon);
      const w = Math.max(0, Math.min(1, Math.min(ex, ey)));
      out[0] = out[0] * (1 - w) + tmp[0] * w;
      out[1] = out[1] * (1 - w) + tmp[1] * w;
    }
    return out;
  };

  /* ---------- Sonnenstand: Punkt der Erde, über dem die Sonne gerade senkrecht steht ---------- */
  const subsolar = (date) => {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD;
    const gmst = (280.46061837 + 360.98564736629 * d) % 360;
    let lon = ra - gmst;
    lon = ((lon + 540) % 360) - 180;
    return { lat: dec / RAD, lon };
  };
  const vec = (lat, lon) => {
    const a = lat * RAD, b = lon * RAD;
    return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
  };
  // Ansicht -> Erde: erst um die x-Achse kippen (Breite), dann um die Erdachse drehen (Länge)
  const rotation = (lat, lon) => {
    const ca = Math.cos(lat * RAD), sa = Math.sin(lat * RAD), cb = Math.cos(lon * RAD), sb = Math.sin(lon * RAD);
    // Zeilen der Matrix M = Ry(lon) * Rx(-lat)
    return [
      [cb, -sb * sa, sb * ca],
      [0, ca, sa],
      [-sb, -cb * sa, cb * ca],
    ];
  };

  /* ---------- Shader ---------- */
  const VS = `attribute vec2 aP; uniform vec2 uAsp; varying vec2 vP;
    void main() { vP = aP * uAsp; gl_Position = vec4(aP, 0.0, 1.0); }`;
  const FS = `precision highp float;
    varying vec2 vP;
    uniform sampler2D uDay, uNight, uRadar;
    uniform mat3 uRot;
    uniform vec3 uSun;
    uniform float uR, uPx, uNightOn, uHasNight, uHasRadar;
    const float PI = 3.14159265;
    vec3 globe(vec2 p, float r2, out float lit) {
      float z = sqrt(max(0.0, 1.0 - r2));
      vec3 n = uRot * vec3(p, z);
      float lat = asin(clamp(n.y, -1.0, 1.0));
      float lon = atan(n.x, n.z);
      vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
      vec3 day = texture2D(uDay, uv).rgb;
      float sd = dot(n, uSun);
      lit = uNightOn > 0.5 ? smoothstep(-0.08, 0.1, sd) : 1.0;
      vec3 dayc = uNightOn > 0.5 ? day * (0.62 + 0.5 * clamp(sd * 1.8 + 0.1, 0.0, 1.0)) : day;
      // Nacht: Stadtlichter plus ein schwacher, bläulicher Schein des Tagbilds (wie Mondlicht) – Wolken und Küsten bleiben erkennbar
      vec3 moon = day * vec3(0.08, 0.10, 0.15);
      vec3 nightc = uHasNight > 0.5 ? texture2D(uNight, uv).rgb * 1.45 + moon : day * 0.12;
      vec3 col = mix(nightc, dayc, lit);
      // Dämmerungssaum entlang der Tag/Nacht-Grenze
      col += vec3(1.0, 0.5, 0.2) * exp(-sd * sd * 600.0) * 0.12 * uNightOn * lit;
      if (uHasRadar > 0.5 && abs(lat) < 1.48) {
        float my = 0.5 - log(tan(PI * 0.25 + lat * 0.5)) / (2.0 * PI);
        vec4 rc = texture2D(uRadar, vec2(uv.x, my));
        col = mix(col, rc.rgb * (0.6 + 0.4 * lit), clamp(rc.a * 1.1, 0.0, 0.9));
      }
      // zum Rand hin dunkler, dazu der blaue Dunst der Atmosphäre
      col *= 0.74 + 0.26 * z;
      float rim = pow(1.0 - z, 2.4);
      col = mix(col, vec3(0.42, 0.68, 1.0) * (0.22 + 0.9 * lit), rim * 0.6);
      return col;
    }
    void main() {
      vec2 p = vP / uR;
      float r2 = dot(p, p);
      float r = sqrt(r2);
      float px = uPx / uR;
      // Leuchtsaum der Atmosphäre außerhalb der Kugel
      vec3 nO = uRot * normalize(vec3(p, 0.0001));
      float s = uNightOn > 0.5 ? smoothstep(-0.4, 0.45, dot(nO, uSun)) : 1.0;
      float g = exp(-max(r - 1.0, 0.0) * 16.0) * (0.2 + 0.8 * s) * 0.8;
      vec4 glow = vec4(vec3(0.38, 0.64, 1.0) * g, g);
      if (r > 1.0 + px) { gl_FragColor = glow; return; }
      float lit;
      vec3 col = globe(p / max(r, 1.0), min(r2, 1.0), lit);
      float a = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);
      gl_FragColor = vec4(col * a, a) + glow * (1.0 - a);
    }`;

  /* ---------- Custom Element ---------- */
  class FwcEarth extends HTMLElement {
    constructor() {
      super();
      this._o = null;
      this._ang = 0;     // Drehwinkel durch die Animation (Grad)
      this._uLon = 0;    // vom Nutzer gedreht (Grad)
      this._uLat = 0;
      this._vel = 0;     // Schwung nach dem Loslassen (Grad/s)
      this._drag = null;
      this._idleAt = 0;
      this._vis = true;
      this._raf = 0;
      this._last = 0;
    }

    set opts(o) {
      this._o = o;
      if (this.isConnected) this._sync();
    }
    get opts() { return this._o; }

    connectedCallback() {
      if (!this._mark) {
        this._mark = document.createElement('i');
        this._mark.className = 'fe-mark';
        this._msg = document.createElement('span');
        this._msg.className = 'fe-msg';
        // Windströme: eigene 2D-Fläche über der Kugel
        this._wc = document.createElement('canvas');
        this._wc.className = 'fe-wind';
        this.append(this._wc, this._mark, this._msg);
        this._bindDrag();
      }
      // Canvas bei jedem Einhängen neu anlegen: ein beim Aushängen freigegebener WebGL-Kontext lässt sich
      // auf demselben Canvas nicht wieder nutzen (zeigte nach "Fertig" im Dashboard eine weiße Fläche)
      if (!this._cv) {
        this._cv = document.createElement('canvas');
        this.prepend(this._cv);
        this._noGl = false;
        this.classList.remove('fe-fb', 'fe-spin', 'fe-ready');
      }
      this._ro = new ResizeObserver(() => { this._resize(); this._sync(); });
      this._ro.observe(this);
      this._io = new IntersectionObserver((es) => { this._vis = es.some(e => e.isIntersecting); this._loop(); });
      this._io.observe(this);
      this._onVis = () => this._loop();
      document.addEventListener('visibilitychange', this._onVis);
      // Kontext vom Browser entzogen (z. B. zu viele WebGL-Flächen): beim nächsten Zeichnen mit neuem Canvas neu aufbauen
      this._onLost = (ev) => { ev.preventDefault(); this._renew = true; };
      this._cv.addEventListener('webglcontextlost', this._onLost);
      if (this._o) this._sync();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      document.removeEventListener('visibilitychange', this._onVis);
      this._dropCanvas();
    }

    // Grafikspeicher freigeben (Browser erlauben nur wenige WebGL-Kontexte gleichzeitig) und Canvas entfernen
    _dropCanvas() {
      if (this._cv) {
        this._cv.removeEventListener('webglcontextlost', this._onLost);
        if (this._gl && !this._gl.isContextLost()) {
          const ext = this._gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        }
        this._cv.remove();
      }
      this._cv = null;
      this._gl = null;
      this._tex = null;
      this._has = [false, false, false];
      this._renew = false;
      this._dayUrl = this._nightUrl = this._radarUrl = null;
    }

    // Drehen mit Maus oder Finger (Finger: waagerecht, damit das Dashboard senkrecht scrollbar bleibt)
    _bindDrag() {
      const deg = () => {
        const cm = Math.min(this._css ? this._css.w : 300, this._css ? this._css.h : 300) / 2;
        return 180 / Math.PI / Math.max(1, 0.86 * ((this._o && this._o.zoom) || 1) * cm);
      };
      this.addEventListener('pointerdown', (e) => {
        if (!this._o || !this._o.interactive || !this._gl || (e.pointerType === 'mouse' && e.button !== 0)) return;
        this._drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, t: performance.now() };
        this._vel = 0;
      });
      this.addEventListener('pointermove', (e) => {
        const d = this._drag;
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved) {
          if (Math.hypot(dx, dy) < 5) return;
          d.moved = true;
          try { this.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
          this.classList.add('fe-grab');
        }
        const k = deg(), now = performance.now(), dt = Math.max(1, now - d.t);
        this._uLon = (this._uLon - dx * k) % 360;
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') this._uLat = Math.max(-80, Math.min(80, this._uLat + dy * k));
        this._vel = 0.6 * this._vel + 0.4 * ((dx * k) / dt) * 1000;
        d.x = e.clientX; d.y = e.clientY; d.t = now;
        this._draw();
      });
      const end = (e) => {
        const d = this._drag;
        if (!d || (e && e.pointerId !== d.id)) return;
        this._drag = null;
        this._idleAt = performance.now();
        this.classList.remove('fe-grab');
        if (d.moved) {
          this._dragged = performance.now();
          if (performance.now() - d.t > 80) this._vel = 0; // kurz gehalten -> kein Schwung
          this._vel = Math.max(-240, Math.min(240, this._vel));
        } else this._vel = 0;
        this._loop();
      };
      this.addEventListener('pointerup', end);
      this.addEventListener('pointercancel', end);
      // nach dem Drehen keinen Klick (Info-Dialog) auslösen
      this.addEventListener('click', (e) => {
        if (this._dragged && performance.now() - this._dragged < 300) { e.stopPropagation(); e.preventDefault(); }
      }, true);
    }

    _resize() {
      // Layoutgröße (ohne CSS-Skalierung, z. B. im Designer-Zoom), damit der Standortpunkt genau sitzt
      const r = { width: this.clientWidth, height: this.clientHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      const k = Math.min(1, 1100 / Math.max(w, h)); // große Flächen nicht unnötig hoch auflösen
      this._w = Math.max(1, Math.round(w * k));
      this._h = Math.max(1, Math.round(h * k));
      this._css = { w: r.width, h: r.height };
    }

    _initGl() {
      if (this._gl || this._noGl) return this._gl;
      const gl = this._cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) { this._noGl = true; this.classList.add('fe-fb'); return null; }
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      try {
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
        gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
        gl.useProgram(pr);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'aP');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        this._u = {};
        ['uAsp', 'uDay', 'uNight', 'uRadar', 'uRot', 'uSun', 'uR', 'uPx', 'uNightOn', 'uHasNight', 'uHasRadar'].forEach((n) => { this._u[n] = gl.getUniformLocation(pr, n); });
        gl.uniform1i(this._u.uDay, 0);
        gl.uniform1i(this._u.uNight, 1);
        gl.uniform1i(this._u.uRadar, 2);
        this._tex = [0, 1, 2].map(() => {
          const t = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
          return t;
        });
        this._has = [false, false, false];
        gl.clearColor(0, 0, 0, 0);
        this._gl = gl;
      } catch (err) {
        console.warn('[flexible-weather-card] 3D-Erde: WebGL nicht nutzbar', err);
        this._noGl = true;
        this.classList.add('fe-fb');
      }
      return this._gl;
    }

    _upload(i, src) {
      const gl = this._gl;
      if (!gl) return false;
      try {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, this._tex[i]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        // ohne Mipmaps: keine Naht an der Datumsgrenze; die Bildgröße passt das Element selbst an
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this._has[i] = true;
        return true;
      } catch (err) {
        // z. B. Bild ohne CORS-Freigabe: darf nicht in WebGL verwendet werden
        console.warn('[flexible-weather-card] 3D-Erde: Bild nicht verwendbar', err);
        this._has[i] = false;
        return false;
      }
    }

    // passende Bildgröße: so groß wie nötig für den sichtbaren Kugelumfang, gedeckelt durch die Qualität
    _texSize() {
      const o = this._o;
      const d = Math.min(this._w || 300, this._h || 300) * 0.86 * (o.zoom || 1);
      const need = Math.PI * d * 0.75;
      // normal: bis 2048 px, beim Heranzoomen (ab 200 %) bis 4096 px, damit die Region scharf bleibt
      const cap = o.quality === 'high' ? 4096 : o.quality === 'low' ? 1024 : (o.zoom || 1) >= 2 ? 4096 : 2048;
      return SIZES.find(s => s >= need && s <= cap) || cap;
    }

    _sync() {
      const o = this._o;
      if (!o || !this.isConnected) return;
      this.classList.toggle('fe-drag', !!o.interactive);
      if (this._renew) {
        // verlorenen Kontext durch einen frischen Canvas ersetzen
        this._dropCanvas();
        this._cv = document.createElement('canvas');
        this.prepend(this._cv);
        this._cv.addEventListener('webglcontextlost', this._onLost);
      }
      if (!this._cv) return;
      if (!this._w) this._resize();
      const gl = this._initGl();
      const size = this._texSize();
      const slot = Math.floor(Date.now() / SLOT);
      const day = o.day_image || `${BASE}/${size}x${size / 2}/earth.jpg?s=${slot}`;
      const night = o.night_image || `${BASE}/${size}x${size / 2}/earth-night.jpg?s=${slot}`;
      if (!gl) { this._fallback(day); return; }
      this._want(0, day, '_dayUrl');
      if (o.night) this._want(1, night, '_nightUrl');
      if (o.radar) {
        const rUrl = o.radar.replace('{z}', (o.zoom || 1) >= 2.5 ? 3 : 2);
        if (rUrl !== this._radarUrl) {
          this._radarUrl = rUrl;
          const e = loadRadar(rUrl);
          const apply = () => { if (this._radarUrl === rUrl && e.ok && this._gl) { this._upload(2, e.canvas); this._draw(); } };
          if (e.ok || e.err) apply(); else e.promise.then(apply);
        }
      } else {
        this._radarUrl = null;
        this._has[2] = false;
      }
      this._syncWind();
      this._status();
      this._draw();
      this._loop();
    }

    // Winddaten holen und das Windfeld für die aktuelle Zeit berechnen (alle 10 Minuten neu)
    _syncWind() {
      const o = this._o;
      if (!o.wind) { this._field = null; this._P = null; if (this._wctx) this._wctx.clearRect(0, 0, this._wc.width, this._wc.height); this._wc.style.display = 'none'; return; }
      this._wc.style.display = '';
      const e = loadWind(o.lat, o.lon);
      if (e.data) {
        const slot = Math.floor(Date.now() / 600000);
        if (e.data !== this._wData || slot !== this._wSlot) {
          this._wData = e.data;
          this._wSlot = slot;
          this._field = windField(e.data, Date.now());
        }
      } else if (e.promise && !this._wWait) {
        this._wWait = true;
        e.promise.then(() => { this._wWait = false; if (this.isConnected && this._o) { this._syncWind(); this._draw(); this._loop(); } });
      }
    }

    _want(i, url, key) {
      if (this[key] === url) return;
      this[key] = url;
      const e = loadImage(url);
      const apply = () => {
        if (this[key] !== url || !this._gl) return;
        if (e.ok) this._upload(i, e.img);
        this._status(e.err && i === 0);
        this._draw();
      };
      if (e.ok || e.err) apply(); else e.promise.then(apply);
    }

    _status(failed) {
      const o = this._o || {};
      if (this._has[0]) this._msg.textContent = '';
      else this._msg.textContent = failed ? (o.t_error || 'offline') : (o.t_loading || '…');
      this.classList.toggle('fe-ready', !!this._has[0]);
    }

    _fallback(day) {
      // einfache CSS-Kugel ohne WebGL: Bild läuft hinter einer runden Maske durch
      this.style.setProperty('--fe-img', `url("${day}")`);
      // Standort in die Mitte: Bild ist doppelt so breit wie die Kugel (86 % der kürzeren Seite)
      this.style.setProperty('--fe-x', `${(-(((this._o.lon + 180) / 360) * 172 - 43)).toFixed(1)}cqmin`);
      this.classList.toggle('fe-spin', !!(this._o.rotate && this._o.anim));
      this._mark.style.display = 'none';
      this._msg.textContent = '';
    }

    // Nutzer-Drehung läuft noch nach (Schwung) oder dreht zum Standort zurück?
    _settling() {
      if (this._drag) return false;
      if (Math.abs(this._vel) > 0.5) return true;
      const back = !this._o.rotate ? Math.abs(this._uLon) > 0.05 || Math.abs(this._uLat) > 0.05 : Math.abs(this._uLat) > 0.05;
      return back;
    }

    _loop() {
      const o = this._o;
      const windAnim = !!(o && o.wind && o.anim && this._field);
      const run = o && this._vis && !document.hidden && this._gl && this.isConnected && ((o.rotate && o.anim) || windAnim || this._settling());
      if (!run) {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;
        this._last = 0;
        return;
      }
      if (this._raf) return;
      const period = o.period || 90;
      const frame = (ts) => {
        this._raf = requestAnimationFrame(frame);
        if (this._last && ts - this._last < 33) return; // ~30 Bilder/s reichen für eine langsame Drehung
        const dt = this._last ? Math.min(ts - this._last, 200) : 0;
        this._last = ts;
        const s = dt / 1000;
        let changed = false;
        if (o.rotate && o.anim && !this._drag) { this._ang = (this._ang + s * (360 / period)) % 360; changed = true; }
        if (!this._drag) {
          // Schwung abklingen lassen
          if (Math.abs(this._vel) > 0.5) { this._uLon = (this._uLon - this._vel * s) % 360; this._vel *= Math.exp(-s * 2.2); changed = true; } else this._vel = 0;
          // nach 8 s ohne Berührung langsam zurück: fester Standort ganz, drehende Erde nur die Neigung
          if (!this._vel && performance.now() - this._idleAt > 8000) {
            const k = Math.exp(-s * 1.6);
            if (!o.rotate) this._uLon = ((this._uLon + 540) % 360 - 180) * k;
            this._uLat *= k;
            changed = true;
          }
        }
        if (changed) this._draw(true);
        if (o.wind && o.anim && this._field) this._windStep(s);
        if (!(o.rotate && o.anim) && !(o.wind && o.anim && this._field) && !this._settling() && !this._drag) { cancelAnimationFrame(this._raf); this._raf = 0; this._last = 0; }
      };
      this._raf = requestAnimationFrame(frame);
    }

    _draw(fromLoop) {
      const gl = this._gl, o = this._o;
      if (!gl || !o || !this._w) return;
      const cv = this._cv;
      if (cv.width !== this._w || cv.height !== this._h) { cv.width = this._w; cv.height = this._h; }
      gl.viewport(0, 0, this._w, this._h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!this._has[0]) { this._mark.style.display = 'none'; return; }
      const mn = Math.min(this._w, this._h);
      const R = 0.86 * (o.zoom || 1);
      // Blickrichtung: fester Standort oder sich drehende Erde (Erde dreht nach Osten -> Oberfläche wandert nach rechts)
      const baseLat = o.rotate ? Math.max(-50, Math.min(50, o.lat * 0.75)) : Math.max(-75, Math.min(75, o.lat));
      const camLat = Math.max(-85, Math.min(85, baseLat + this._uLat));
      const camLon = o.lon - (o.rotate ? this._ang : 0) + this._uLon;
      const M = rotation(camLat, camLon);
      this._M = M;
      this._Rcm = R * Math.min(this._css.w, this._css.h) / 2;
      const sun = subsolar(new Date());
      const sv = vec(sun.lat, sun.lon);
      gl.uniform2f(this._u.uAsp, this._w / mn, this._h / mn);
      // mat3 erwartet Spalten
      gl.uniformMatrix3fv(this._u.uRot, false, new Float32Array([M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]));
      gl.uniform3f(this._u.uSun, sv[0], sv[1], sv[2]);
      gl.uniform1f(this._u.uR, R);
      gl.uniform1f(this._u.uPx, 2 / mn);
      gl.uniform1f(this._u.uNightOn, o.night ? 1 : 0);
      gl.uniform1f(this._u.uHasNight, o.night && this._has[1] ? 1 : 0);
      gl.uniform1f(this._u.uHasRadar, o.radar && this._has[2] ? 1 : 0);
      [0, 1, 2].forEach((i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this._tex[i]); });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // Standort: Punkt als HTML-Element (pulsiert per CSS, kostet nichts)
      if (o.marker) {
        const v = vec(o.lat, o.lon);
        // Erde -> Ansicht = transponierte Matrix
        const x = M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2];
        const y = M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2];
        const z = M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2];
        const cm = Math.min(this._css.w, this._css.h) / 2;
        const px = this._css.w / 2 + x * R * cm, py = this._css.h / 2 - y * R * cm;
        const show = z > 0.08 && px > 0 && py > 0 && px < this._css.w && py < this._css.h;
        this._mark.style.display = show ? '' : 'none';
        if (show) this._mark.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      } else this._mark.style.display = 'none';
      // Windströme: ohne Animation einmal ein ruhendes Bild der Strömung, sonst zeichnet die Schleife
      if (o.wind && this._field && !(o.anim && fromLoop)) {
        if (!o.anim) this._windStatic();
        else if (!this._raf) this._windStep(0);
      }
    }

    /* ---------- Windströme (Teilchen, die mit dem Wind treiben) ---------- */
    _windSetup() {
      const wc = this._wc;
      if (wc.width !== this._w || wc.height !== this._h) { wc.width = this._w; wc.height = this._h; this._P = null; }
      if (!this._wctx) this._wctx = wc.getContext('2d');
      const area = Math.min(this._css.w * this._css.h, Math.PI * this._Rcm * this._Rcm);
      const n = Math.round(Math.max(180, Math.min(1400, area / 160)));
      if (!this._P || this._P.n !== n) {
        const T = 18;
        this._P = { n, T, lat: new Float32Array(n), lon: new Float32Array(n), age: new Uint16Array(n), max: new Uint16Array(n),
          hx: new Float32Array(n * T), hy: new Float32Array(n * T), hz: new Float32Array(n * T), hn: new Uint8Array(n), sp: new Float32Array(n) };
        for (let i = 0; i < n; i++) { this._spawn(i); this._P.age[i] = Math.floor(Math.random() * this._P.max[i]); }
      }
      return this._P;
    }

    // neues Teilchen an einer zufälligen sichtbaren Stelle der Kugel
    _spawn(i) {
      const P = this._P, M = this._M, w = this._css.w, h = this._css.h, Rc = this._Rcm;
      for (let tries = 0; tries < 8; tries++) {
        const sx = Math.random() * w, sy = Math.random() * h;
        const x = (sx - w / 2) / Rc, y = -(sy - h / 2) / Rc, r2 = x * x + y * y;
        if (r2 >= 0.97) continue;
        const z = Math.sqrt(1 - r2);
        const ex = M[0][0] * x + M[0][1] * y + M[0][2] * z, ey = M[1][0] * x + M[1][1] * y + M[1][2] * z, ez = M[2][0] * x + M[2][1] * y + M[2][2] * z;
        P.lat[i] = Math.asin(Math.max(-1, Math.min(1, ey))) / RAD;
        P.lon[i] = Math.atan2(ex, ez) / RAD;
        break;
      }
      P.age[i] = 0;
      P.max[i] = 60 + Math.floor(Math.random() * 90);
      P.hn[i] = 0;
    }

    _windStep(dt) {
      if (!this._field || !this._M || !this._css) return;
      const P = this._windSetup(), T = P.T, f = this._field, uv = [0, 0];
      // Bildschirm-Tempo: 1 m/s = 2,6 px/s (unabhängig vom Zoom), umgerechnet in Grad
      const k = dt * 2.6 / (this._Rcm * RAD);
      for (let i = 0; i < P.n; i++) {
        if (dt > 0) {
          sampleWind(f, P.lat[i], P.lon[i], uv);
          const c = Math.max(0.15, Math.cos(P.lat[i] * RAD));
          P.lat[i] += uv[1] * k;
          P.lon[i] += (uv[0] * k) / c;
          if (P.lon[i] > 180) P.lon[i] -= 360; else if (P.lon[i] < -180) P.lon[i] += 360;
          P.sp[i] = Math.hypot(uv[0], uv[1]);
          if (++P.age[i] > P.max[i] || Math.abs(P.lat[i]) > 84) { this._spawn(i); continue; }
        }
        // Spur als Einheitsvektoren speichern (dreht sich mit der Kugel mit, ohne zu verschmieren)
        const a = P.lat[i] * RAD, b = P.lon[i] * RAD, ca = Math.cos(a);
        const base = i * T;
        if (P.hn[i] < T) P.hn[i]++;
        for (let t = Math.min(P.hn[i], T) - 1; t > 0; t--) { P.hx[base + t] = P.hx[base + t - 1]; P.hy[base + t] = P.hy[base + t - 1]; P.hz[base + t] = P.hz[base + t - 1]; }
        P.hx[base] = ca * Math.sin(b); P.hy[base] = Math.sin(a); P.hz[base] = ca * Math.cos(b);
      }
      this._windPaint();
    }

    _windStatic() {
      this._windSetup();
      const P = this._P;
      for (let i = 0; i < P.n; i++) { this._spawn(i); P.max[i] = 999; }
      for (let s = 0; s < 14; s++) this._windStep(1 / 30);
    }

    // Spuren zeichnen: nach Tempo gruppiert, ältere Hälfte blasser
    _windPaint() {
      const P = this._P, g = this._wctx, M = this._M, T = P.T;
      const w = this._css.w, h = this._css.h, cx = w / 2, cy = h / 2, Rc = this._Rcm, sc = this._w / w;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this._wc.width, this._wc.height);
      g.setTransform(sc, 0, 0, sc, 0, 0);
      g.lineCap = 'round';
      const BUCKETS = [[0, 3, 'rgba(255,255,255,0.3)', 0.8], [3, 6, 'rgba(255,255,255,0.4)', 0.9], [6, 10, 'rgba(255,255,255,0.58)', 1],
        [10, 15, 'rgba(255,255,255,0.75)', 1.15], [15, 22, 'rgba(255,236,150,0.85)', 1.3], [22, 999, 'rgba(255,170,90,0.92)', 1.5]];
      const px = (j, out) => {
        const x = P.hx[j], y = P.hy[j], z = P.hz[j];
        const vz = M[0][2] * x + M[1][2] * y + M[2][2] * z;
        if (vz < 0.04) return false;
        out[0] = cx + (M[0][0] * x + M[1][0] * y + M[2][0] * z) * Rc;
        out[1] = cy - (M[0][1] * x + M[1][1] * y + M[2][1] * z) * Rc;
        return true;
      };
      const q = [0, 0];
      for (let half = 0; half < 2; half++) {
        const t0 = half ? 0 : Math.floor(T / 2), t1 = half ? Math.ceil(T / 2) : T - 1;
        g.globalAlpha = half ? 1 : 0.35;
        for (const [lo, hi, col, lw] of BUCKETS) {
          g.strokeStyle = col;
          g.lineWidth = lw;
          g.beginPath();
          for (let i = 0; i < P.n; i++) {
            if (P.sp[i] < lo || P.sp[i] >= hi || P.hn[i] < 2) continue;
            const base = i * T, last = Math.min(t1, P.hn[i] - 1);
            let pen = false;
            for (let t = t0; t <= last; t++) {
              if (!px(base + t, q)) { pen = false; continue; }
              if (pen) g.lineTo(q[0], q[1]); else { g.moveTo(q[0], q[1]); pen = true; }
            }
          }
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }
  }
  if (!customElements.get('fwc-earth')) customElements.define('fwc-earth', FwcEarth);

  // Kachel-Adresse für das Radar (RainViewer-Bildliste aus FWC_ONLINE)
  const radarUrl = (rv) => {
    if (!rv || !rv.frames || !rv.frames.length) return null;
    const f = rv.frames[rv.frames.length - 1];
    return `${rv.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`;
  };

  return { subsolar, radarUrl };
})();
