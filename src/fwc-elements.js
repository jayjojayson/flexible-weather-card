/*
 * Flexible Weather Card - ELEMENTE
 * Dateiname: fwc-elements.js
 * Animierte Wettersymbole, 3D-Kuppel (aus der Sun Position Card) und alle Element-Typen,
 * die im Layout-Designer platziert werden können. Jeder Typ beschreibt:
 *   group, icon, Standard-/Mindestgröße, Eigenschaften (fields), benötigte Daten (needs) und render().
 */

// Kleiner Host für fertiges SVG-Markup (setzt innerHTML nur bei Änderung -> Animationen laufen weiter)
if (!customElements.get('fwc-svg')) {
  customElements.define('fwc-svg', class extends HTMLElement {
    set markup(v) {
      if (v === this._m) return;
      this._m = v;
      this.innerHTML = v || '';
    }
    get markup() { return this._m; }
  });
}

const FWC_EL = (() => {
  const U = FWC_U;
  const A = FWC_ASTRO;
  const raw = (markup, cls = '') => html`<fwc-svg class="${cls}" .markup=${markup}></fwc-svg>`;
  const n1 = U.n1;
  // Zwischenspeicher je Card + Element: Cards bekommen nach jedem Neuaufbau (z. B. Dashboard-Wechsel) eine neue Kennung,
  // deshalb nur die zuletzt benutzten Einträge behalten, damit der Speicher auf Wandtablets nicht wächst
  const remember = (map, key, value, max = 48) => {
    map.delete(key);
    map.set(key, value);
    if (map.size > max) map.delete(map.keys().next().value);
    return value;
  };

  /* ----------------------------------------------------------------------------------------------
   * Gemeinsame SVG-Verläufe (einmal pro Card, nie display:none)
   * -------------------------------------------------------------------------------------------- */
  const DEFS = `<svg class="fwc-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="fwc-g-sun" cx=".4" cy=".38" r=".7"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffd54a"/><stop offset="1" stop-color="#ffa000"/></radialGradient>
    <radialGradient id="fwc-g-sunglow"><stop offset="0" stop-color="#ffd54f" stop-opacity=".55"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
    <linearGradient id="fwc-g-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5dde7"/></linearGradient>
    <linearGradient id="fwc-g-cloud-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aab6c4"/><stop offset="1" stop-color="#6f7d8e"/></linearGradient>
    <linearGradient id="fwc-g-cloud-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6cfdb"/><stop offset="1" stop-color="#8d99aa"/></linearGradient>
    <linearGradient id="fwc-g-moon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset="1" stop-color="#f2d47c"/></linearGradient>
    <radialGradient id="fwc-g-moonlit" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fffdf4"/><stop offset=".7" stop-color="#ece6d4"/><stop offset="1" stop-color="#c9c2ad"/></radialGradient>
    <radialGradient id="fwc-g-moonglow"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".7"/><stop offset="1" stop-color="#9fb4e6" stop-opacity="0"/></radialGradient>
    <linearGradient id="fwc-g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64b5f6"/><stop offset="1" stop-color="#1e88e5"/></linearGradient>
  </defs></svg>`;

  /* ----------------------------------------------------------------------------------------------
   * Animierte Wettersymbole (viewBox 0 0 64 64)
   * -------------------------------------------------------------------------------------------- */
  const CLOUD_D = 'M17 46 H45 A9.5 9.5 0 0 0 46.2 27.1 A13.5 13.5 0 0 0 20.6 24.3 A11 11 0 0 0 17 46 Z';
  const sunG = (cx, cy, r, anim) => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = i * 45 * A.RAD;
      rays += `<line x1="${n1(cx + Math.cos(a) * (r + 4))}" y1="${n1(cy + Math.sin(a) * (r + 4))}" x2="${n1(cx + Math.cos(a) * (r + 9))}" y2="${n1(cy + Math.sin(a) * (r + 9))}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="url(#fwc-g-sunglow)" class="${anim ? 'fwc-a-pulse' : ''}"/>`
      + `<g class="${anim ? 'fwc-a-spin' : ''}" stroke="#ffb300" stroke-width="3" stroke-linecap="round">${rays}</g>`
      + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#fwc-g-sun)"/>`;
  };
  // Mondsichel aus zwei Kreisbögen
  const moonG = (cx, cy, r) => {
    const top = [cx + r * 0.42, cy - r * 0.91];
    const bot = [cx + r * 0.42, cy + r * 0.91];
    return `<path d="M ${n1(top[0])} ${n1(top[1])} A ${r} ${r} 0 1 0 ${n1(bot[0])} ${n1(bot[1])} A ${n1(r * 1.15)} ${n1(r * 1.15)} 0 0 1 ${n1(top[0])} ${n1(top[1])} Z" fill="url(#fwc-g-moon)" stroke="#c9a94a" stroke-opacity=".55" stroke-width="1"/>`;
  };
  const cloudG = (dx, dy, s, tone, anim, cls = '') => `<g class="${anim ? 'fwc-a-drift ' : ''}${cls}"><path d="${CLOUD_D}" transform="translate(${dx} ${dy}) scale(${s})" fill="url(#fwc-g-cloud${tone})" stroke="#9aa9bb" stroke-opacity=".55" stroke-width="${n1(1 / s)}"/></g>`;
  const dropsG = (xs, y, anim, heavy) => xs.map((x, i) => `<line class="${anim ? 'fwc-a-drop' : ''}" style="animation-delay:-${((i * 0.37) % 1) * 1.6}s" x1="${x}" y1="${y}" x2="${x - 2}" y2="${y + (heavy ? 9 : 7)}" stroke="#4fa8f5" stroke-width="${heavy ? 3 : 2.6}" stroke-linecap="round"/>`).join('');
  const flakesG = (xs, y, anim) => xs.map((x, i) => `<circle class="${anim ? 'fwc-a-snow' : ''}" style="animation-delay:-${((i * 0.9) % 3) * 1.4}s" cx="${x}" cy="${y + (i % 2) * 4}" r="2.4" fill="#eef5ff" stroke="#6f9fd3" stroke-width="1"/>`).join('');
  const hailG = (xs, y, anim) => xs.map((x, i) => `<circle class="${anim ? 'fwc-a-drop' : ''}" style="animation-delay:-${((i * 0.29) % 1) * 1.6}s" cx="${x}" cy="${y + (i % 2) * 3}" r="2.6" fill="#f3f8ff" stroke="#6f93bb" stroke-width="1.1"/>`).join('');
  const boltG = (anim) => `<polygon class="${anim ? 'fwc-a-bolt' : ''}" points="33,40 25,53 31,53 27,63 40,48 33,48 37,40" fill="#ffd740" stroke="#ffab00" stroke-width="1" stroke-linejoin="round"/>`;
  const fogG = (anim) => [0, 1, 2].map(i => `<rect class="${anim ? 'fwc-a-fog' : ''}" style="animation-delay:-${i * 1.6}s" x="${12 + (i % 2) * 5}" y="${48 + i * 6}" width="${38 - (i % 2) * 8}" height="3.4" rx="1.7" fill="#b7c3d0"/>`).join('');
  const windG = (anim, y0 = 18) => [
    `M8 ${y0} H38 a6 6 0 1 0 -6 -6`,
    `M6 ${y0 + 12} H48 a7 7 0 1 1 -7 7`,
    `M12 ${y0 + 24} H34 a5 5 0 1 1 -5 5`,
  ].map((d, i) => `<path class="${anim ? 'fwc-a-wind' : ''}" style="animation-delay:-${i * 0.6}s" d="${d}" fill="none" stroke="#90a4ae" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  const starsG = (anim) => [[46, 16, 1.6], [54, 30, 1.2], [40, 8, 1]].map(([x, y, r], i) => `<circle class="${anim ? 'fwc-a-twinkle' : ''}" style="animation-delay:-${i}s" cx="${x}" cy="${y}" r="${r}" fill="#ffe082" stroke="#ffb300" stroke-width=".6"/>`).join('');

  const iconSvg = (cond, isDay = true, anim = true) => {
    const c = String(cond || '').toLowerCase();
    const day = isDay !== false && c !== 'clear-night';
    const orb = (cx, cy, r) => (day ? sunG(cx, cy, r, anim) : moonG(cx, cy, r + 1));
    const dark = ['pouring', 'lightning', 'lightning-rainy', 'hail', 'exceptional'].includes(c);
    const tone = dark ? '-d' : (day ? '' : '-n');
    let g = '';
    switch (c) {
      case 'sunny': g = sunG(32, 32, 13, anim); break;
      case 'clear-night': g = moonG(30, 33, 17) + starsG(anim); break;
      case 'partlycloudy': g = orb(23, 23, 10) + cloudG(4, 4, 0.92, tone, anim); break;
      case 'cloudy': g = cloudG(12, -9, 0.72, '-d', anim, 'fwc-a-slow') + cloudG(0, 2, 1, tone, anim); break;
      case 'fog': g = cloudG(0, -6, 0.95, tone, false) + fogG(anim); break;
      case 'rainy': g = cloudG(0, -6, 1, tone, anim) + dropsG([23, 32, 41], 44, anim, false); break;
      case 'pouring': g = cloudG(0, -8, 1, tone, anim) + dropsG([19, 26, 33, 40, 47], 42, anim, true); break;
      case 'snowy': g = cloudG(0, -6, 1, tone, anim) + flakesG([21, 30, 39, 47], 46, anim); break;
      case 'snowy-rainy': g = cloudG(0, -6, 1, tone, anim) + dropsG([22, 40], 44, anim, false) + flakesG([31, 47], 46, anim); break;
      case 'hail': g = cloudG(0, -7, 1, tone, anim) + hailG([21, 30, 39, 47], 45, anim); break;
      case 'lightning': g = cloudG(0, -8, 1, tone, anim) + boltG(anim); break;
      case 'lightning-rainy': g = cloudG(0, -8, 1, tone, anim) + boltG(anim) + dropsG([19, 45], 42, anim, false); break;
      case 'windy': g = windG(anim, 18); break;
      case 'windy-variant': g = cloudG(-2, -12, 0.85, tone, anim) + windG(anim, 34).replace(/stroke-width="3.2"/g, 'stroke-width="2.8"'); break;
      case 'exceptional': g = `<path d="M32 8 L58 54 H6 Z" fill="#ff7043" stroke="#e64a19" stroke-width="2" stroke-linejoin="round"/><rect x="29.5" y="24" width="5" height="16" rx="2.5" fill="#fff"/><circle cx="32" cy="46" r="3" fill="#fff"/>`; break;
      default: g = cloudG(0, 0, 1, tone, anim);
    }
    return `<svg class="fwc-wi" viewBox="0 0 64 64" aria-hidden="true">${g}</svg>`;
  };

  const MDI_COND = {
    'clear-night': 'mdi:weather-night', cloudy: 'mdi:weather-cloudy', fog: 'mdi:weather-fog', hail: 'mdi:weather-hail',
    lightning: 'mdi:weather-lightning', 'lightning-rainy': 'mdi:weather-lightning-rainy', partlycloudy: 'mdi:weather-partly-cloudy',
    pouring: 'mdi:weather-pouring', rainy: 'mdi:weather-rainy', snowy: 'mdi:weather-snowy', 'snowy-rainy': 'mdi:weather-snowy-rainy',
    sunny: 'mdi:weather-sunny', windy: 'mdi:weather-windy', 'windy-variant': 'mdi:weather-windy-variant', exceptional: 'mdi:alert-circle-outline',
  };

  // Zustand übersetzen: eigene Liste, dann HA, dann roh
  const condText = (ctx, cond) => {
    if (!cond) return '–';
    const own = ctx.t(`cond.${cond}`);
    if (own !== `cond.${cond}`) return own;
    const h = ctx.hass;
    const l = h && h.localize ? (h.localize(`component.weather.entity_component._.state.${cond}`) || h.localize(`state.weather.${cond}`)) : '';
    return l || cond;
  };

  /* ----------------------------------------------------------------------------------------------
   * 3D-Kuppel (Sonnen- und Mondbahn) – aus der Sun Position Card übernommen
   * -------------------------------------------------------------------------------------------- */
  const DOME = { cx: 160, cy: 166, R: 128 };
  const domeOutline = () => {
    const { cx, cy, R } = DOME;
    const ry = n1(R * Math.sin(17 * A.RAD));
    return `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} A ${R} ${ry} 0 0 1 ${cx - R} ${cy} Z`;
  };
  const angleDiff = (a, b) => ((b - a + 540) % 360) - 180;

  const moonShape = (uid, x, y, r, elong, southern) => {
    const e = ((elong % 360) + 360) % 360;
    const waxing = e < 180;
    const gibbous = e > 90 && e < 270;
    const rx = Math.abs(Math.cos(e * A.RAD)) * r;
    const limb = waxing ? 1 : 0;
    const term = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
    const p = (v) => v.toFixed(2);
    const lit = `M 0 ${p(-r)} A ${p(r)} ${p(r)} 0 0 ${limb} 0 ${p(r)} A ${p(rx)} ${p(r)} 0 0 ${term} 0 ${p(-r)} Z`;
    return `<g transform="translate(${p(x)} ${p(y)})${southern ? ' rotate(180)' : ''}">`
      + `<circle r="${p(r)}" fill="#2a3244" fill-opacity=".9" stroke="#fff" stroke-opacity=".2" stroke-width="${p(Math.max(0.6, r / 14))}"/>`
      + `<path d="${lit}" fill="url(#fwc-g-moonlit)"/></g>`;
  };

  const domeSvg = (uid, o) => {
    const { cx, cy, R } = DOME;
    const tilt = 17 * A.RAD;
    const ry = R * Math.sin(tilt), rz = R * Math.cos(tilt);
    const f = o.southern ? -1 : 1;
    const project = (az, alt, ground = false) => {
      const a = az * A.RAD, h = alt * A.RAD;
      const e = Math.sin(a) * Math.cos(h), n = Math.cos(a) * Math.cos(h), u = ground ? 0 : Math.sin(h);
      return [cx - f * R * e, cy + f * ry * n - rz * u];
    };
    const el = U.isNum(o.sunEl) ? o.sunEl : -20;
    const sky = el > 6 ? ['#3b8ed8', '#a8d6ff', 0.6, 0.12] : el > -6 ? ['#39407c', '#f2a36a', 0.62, 0.3] : ['#07142e', '#22335f', 0.85, 0.35];
    const dp = domeOutline();
    let grid = '';
    [30, 60].forEach((a) => {
      grid += `<ellipse cx="${cx}" cy="${n1(cy - rz * Math.sin(a * A.RAD))}" rx="${n1(R * Math.cos(a * A.RAD))}" ry="${n1(ry * Math.cos(a * A.RAD))}"/>`;
    });
    const greatArc = (azA, azB) => {
      const pts = [];
      for (let t = 0; t <= 180; t += 6) pts.push(t <= 90 ? project(azA, t) : project(azB, 180 - t));
      return `<path d="M ${pts.map(p => `${n1(p[0])} ${n1(p[1])}`).join(' L ')}"/>`;
    };
    grid += greatArc(0, 180) + greatArc(90, 270);
    let ticks = '';
    for (let a = 0; a < 360; a += 10) {
      const k = a % 90 === 0 ? 0.86 : 0.94;
      const r = a * A.RAD;
      ticks += `<line x1="${n1(cx - f * R * k * Math.sin(r))}" y1="${n1(cy + f * ry * k * Math.cos(r))}" x2="${n1(cx - f * R * Math.sin(r))}" y2="${n1(cy + f * ry * Math.cos(r))}"${a % 90 === 0 ? ' class="major"' : ''}/>`;
    }
    // Bahn: aktueller Durchgang über dem Horizont (oder der nächste)
    const STEP = 6 * 60000;
    const track = (posFn) => {
      const empty = { past: '', future: '', rise: null };
      if (!posFn) return empty;
      const now = o.now.getTime();
      const s = [];
      for (let i = -150; i <= 150; i++) {
        const p = posFn(new Date(now + i * STEP));
        s.push({ i, az: p.az, alt: p.alt });
      }
      const cross = (a, b) => {
        const t = a.alt / (a.alt - b.alt);
        return { i: a.i + t, az: a.az + angleDiff(a.az, b.az) * t, alt: 0 };
      };
      const runs = [];
      let run = null;
      for (let k = 0; k < s.length; k++) {
        const c = s[k], prev = s[k - 1];
        if (c.alt >= 0) {
          if (!run) { run = []; if (prev) run.push(cross(prev, c)); runs.push(run); }
          run.push(c);
        } else if (run) { run.push(cross(prev, c)); run = null; }
      }
      const current = runs.find(r => r[0].i <= 0 && r[r.length - 1].i >= 0);
      const chosen = current || runs.find(r => r[0].i > 0);
      if (!chosen) return empty;
      const toD = (pts) => (pts.length > 1 ? `M ${pts.map(q => { const p = project(q.az, q.alt); return `${n1(p[0])} ${n1(p[1])}`; }).join(' L ')}` : '');
      return {
        past: toD(chosen.filter(q => q.i <= 0)), future: toD(chosen.filter(q => q.i >= 0)),
        rise: current ? null : { az: chosen[0].az, time: new Date(now + chosen[0].i * STEP) },
      };
    };
    const isDay = el > 0;
    const hasLoc = U.isNum(o.lat) && U.isNum(o.lon);
    const tr = track(hasLoc ? (d) => (isDay ? A.sunPosition(d, o.lat, o.lon) : A.moonPosition(d, o.lat, o.lon)) : null);
    let marker = '';
    let focus = [cx, cy - rz * 0.55];
    let trackOpacity = 1;
    if (isDay && U.isNum(o.sunAz)) {
      const [sx, sy] = project(o.sunAz, el);
      const [gx, gy] = project(o.sunAz, el, true);
      focus = [sx, sy];
      marker = `<line class="fwc-dome-drop" x1="${n1(sx)}" y1="${n1(sy)}" x2="${n1(gx)}" y2="${n1(gy)}"/>`
        + `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="7" ry="2.4" fill="rgba(0,0,0,.28)"/>`
        + `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="24" fill="url(#${uid}-sunglow)"/>`
        + `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="10" fill="url(#${uid}-sun)"/>`;
    } else if (hasLoc && o.showMoon !== false) {
      const m = A.moonPosition(o.now, o.lat, o.lon);
      if (m.alt > 0) {
        const [mx, my] = project(m.az, m.alt);
        const [gx, gy] = project(m.az, m.alt, true);
        focus = [mx, my];
        marker = `<line class="fwc-dome-drop moon" x1="${n1(mx)}" y1="${n1(my)}" x2="${n1(gx)}" y2="${n1(gy)}"/>`
          + `<ellipse cx="${n1(gx)}" cy="${n1(gy)}" rx="6" ry="2" fill="rgba(0,0,0,.25)"/>`
          + `<circle cx="${n1(mx)}" cy="${n1(my)}" r="26" fill="url(#fwc-g-moonglow)"/>`
          + moonShape(uid, mx, my, 11, A.moonElongation(o.now), o.southern);
      } else {
        trackOpacity = 0.55;
        if (tr.rise) {
          const [rx, ry0] = project(tr.rise.az, 0);
          const t = o.formatTime ? o.formatTime(o.moonRise || tr.rise.time) : '';
          marker = `<g><line x1="${n1(rx)}" y1="${n1(ry0)}" x2="${n1(rx)}" y2="${n1(ry0 - 7)}" stroke="#cfd8e6" stroke-width="1.6" stroke-linecap="round"/>`
            + `<circle cx="${n1(rx)}" cy="${n1(ry0)}" r="2" fill="#cfd8e6"/>`
            + (t ? `<text x="${n1(rx < cx ? rx + 7 : rx - 7)}" y="${n1(ry0 - 9)}" text-anchor="${rx < cx ? 'start' : 'end'}" class="fwc-dome-time">↑ ${U.esc(t)}</text>` : '')
            + '</g>';
        }
      }
    }
    if (!o.showTrack) { tr.past = ''; tr.future = ''; }
    let stars = '';
    const starOp = Math.max(0, Math.min(1, (-el - 2) / 8));
    if (starOp > 0) {
      let seed = 3;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 46; i++) {
        const az = rnd() * 360, alt = 8 + Math.asin(rnd()) / A.RAD * 0.9;
        const [x, y] = project(az, alt);
        const tw = i % 4 === 0 && o.anim ? ` class="fwc-a-twinkle" style="animation-delay:-${n1(rnd() * 3)}s"` : '';
        stars += `<circle${tw} cx="${n1(x)}" cy="${n1(y)}" r="${n1(0.5 + rnd() * 0.8)}"/>`;
      }
      stars = `<g fill="#fff" opacity="${n1(starOp * 0.85)}">${stars}</g>`;
    }
    const L = o.labels;
    const leftEast = f === 1;
    let labels = `<text x="${cx - R - 7}" y="${cy + 4}" text-anchor="end" class="fwc-dome-card">${leftEast ? L.e : L.w}</text>`
      + `<text x="${cx + R + 7}" y="${cy + 4}" text-anchor="start" class="fwc-dome-card">${leftEast ? L.w : L.e}</text>`
      + `<text x="${cx}" y="${n1(cy + ry + 15)}" text-anchor="middle" class="fwc-dome-card">${f === 1 ? L.n : L.s}</text>`
      + `<text x="${cx}" y="${n1(cy - ry - 4)}" text-anchor="middle" class="fwc-dome-card back">${f === 1 ? L.s : L.n}</text>`;
    if (o.showTimes) {
      const rt = o.rise ? `↑ ${U.esc(o.rise)}` : '';
      const st = o.set ? `↓ ${U.esc(o.set)}` : '';
      labels += `<text x="4" y="${cy + 28}" text-anchor="start" class="fwc-dome-time">${leftEast ? rt : st}</text>`
        + `<text x="316" y="${cy + 28}" text-anchor="end" class="fwc-dome-time">${leftEast ? st : rt}</text>`;
    }
    const trackColor = isDay ? `url(#${uid}-track)` : '#cfd8e6';
    const svg = `<svg viewBox="0 0 320 236" class="fwc-dome-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${U.esc(o.aria || '')}">
      <defs>
        <linearGradient id="${uid}-sky" x1="0" y1="${cy - R}" x2="0" y2="${cy}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${sky[0]}" stop-opacity="${sky[2]}"/><stop offset="1" stop-color="${sky[1]}" stop-opacity="${sky[3]}"/></linearGradient>
        <radialGradient id="${uid}-rim" cx="${cx}" cy="${cy}" r="${R}" gradientUnits="userSpaceOnUse"><stop offset=".82" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></radialGradient>
        <radialGradient id="${uid}-ground" cx=".5" cy=".35" r=".65"><stop offset="0" stop-color="#8a96a8" stop-opacity=".35"/><stop offset="1" stop-color="#2c3440" stop-opacity=".55"/></radialGradient>
        <linearGradient id="${uid}-track" x1="${cx - R}" y1="0" x2="${cx + R}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff9e3d"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff7a3d"/></linearGradient>
        <radialGradient id="${uid}-sun"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd84a"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>
        <radialGradient id="${uid}-sunglow"><stop offset="0" stop-color="#ffd54f" stop-opacity=".75"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
        <filter id="${uid}-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="${uid}-clip"><path d="${dp}"/></clipPath>
      </defs>
      <path d="${dp}" fill="url(#${uid}-sky)"/>
      <path d="${dp}" fill="url(#${uid}-rim)"/>
      ${stars}
      <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${n1(ry)}" fill="url(#${uid}-ground)" class="fwc-dome-ground"/>
      <g class="fwc-dome-grid">${grid}</g>
      <g class="fwc-dome-ticks">${ticks}</g>
      <line class="fwc-dome-axis" x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}"/>
      <line class="fwc-dome-axis" x1="${cx}" y1="${n1(cy - ry)}" x2="${cx}" y2="${n1(cy + ry)}"/>
      <path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}" class="fwc-dome-outline"/>
      <g opacity="${trackOpacity}">
        <path d="${tr.future}" fill="none" stroke="${trackColor}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 5" opacity=".75"/>
        <path d="${tr.past}" fill="none" stroke="${trackColor}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#${uid}-glow)"/>
      </g>
      ${o.overlay ? `<g clip-path="url(#${uid}-clip)"><g transform="translate(${n1(focus[0])} ${n1(focus[1])})">${weatherLayer(uid, o.overlay, isDay, o.anim)}</g></g>` : ''}
      ${marker}
      ${labels}
    </svg>`;
    return svg;
  };

  // Animierter Wetter-Layer rund um Sonne/Mond (aus der Sun Position Card)
  const weatherLayer = (uid, state, isDay, anim) => {
    let seed = 11;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const light = isDay ? ['#ffffff', '#dbe4ee'] : ['#c4cedb', '#8995a6'];
    const dark = isDay ? ['#b9c3cf', '#737e8c'] : ['#7d8898', '#4a5462'];
    const a = (cls) => (anim ? cls : '');
    const defs = `<defs><linearGradient id="${uid}-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light[0]}"/><stop offset="1" stop-color="${light[1]}"/></linearGradient>`
      + `<linearGradient id="${uid}-cd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark[0]}"/><stop offset="1" stop-color="${dark[1]}"/></linearGradient>`
      + `<filter id="${uid}-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>`;
    const cloud = (x, y, s, tone, dur, delay, op = 0.95) => `<g class="${a('fwc-a-drift')}" style="animation-duration:${dur}s;animation-delay:-${delay}s">`
      + `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}" fill="url(#${uid}-${tone})"><ellipse cx="0" cy="8" rx="34" ry="11"/><circle cx="-16" cy="2" r="12"/><circle cx="-1" cy="-6" r="17"/><circle cx="17" cy="0" r="13"/></g></g>`;
    const drops = (count, heavy) => {
      const dur = heavy ? 1.2 : 1.6;
      let s = '';
      for (let i = 0; i < count; i++) {
        const x = -48 + rnd() * 96, y = 12 + rnd() * 8, len = heavy ? 11 : 8;
        s += `<line class="${a('fwc-a-fall')}" style="animation-duration:${dur}s;animation-delay:-${(rnd() * dur).toFixed(2)}s" x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x - 2)}" y2="${n1(y + len)}"/>`;
      }
      return `<g stroke="#8fc8ff" stroke-width="${heavy ? 1.8 : 1.4}" stroke-linecap="round" opacity=".9">${s}</g>`;
    };
    const parts = (count, cls, r, fill, dur) => {
      let s = '';
      for (let i = 0; i < count; i++) s += `<circle class="${a(cls)}" style="animation-duration:${dur}s;animation-delay:-${n1(rnd() * dur)}s" cx="${n1(-48 + rnd() * 96)}" cy="${n1(12 + rnd() * 10)}" r="${n1(r * (0.7 + rnd() * 0.6))}"/>`;
      return `<g fill="${fill}">${s}</g>`;
    };
    const bolt = () => `<polygon class="${a('fwc-a-bolt')}" points="6,10 -5,30 2,30 -5,50 13,24 5,24 11,10" fill="#ffe066" stroke="#fff6bf" stroke-width=".8"/>`;
    const fog = () => {
      let s = '';
      for (let i = 0; i < 4; i++) s += `<rect class="${a('fwc-a-fog')}" style="animation-delay:-${i * 2.3}s" x="${-75 + i * 6}" y="${-18 + i * 11}" width="${150 - i * 12}" height="8" rx="4"/>`;
      return `<g fill="#fff" opacity=".45" filter="url(#${uid}-blur)">${s}</g>`;
    };
    const wind = () => `<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85">`
      + `<path class="${a('fwc-a-wind')}" d="M -80 -10 q 30 -12 60 0 t 60 0 t 40 -6"/><path class="${a('fwc-a-wind')}" style="animation-delay:-1s" d="M -90 8 q 35 -10 70 0 t 70 0"/></g>`;
    let l = '';
    switch (state) {
      case 'partlycloudy': l = cloud(16, 10, 0.75, 'cl', 9, 2); break;
      case 'cloudy': l = cloud(-24, -4, 0.8, 'cl', 11, 4, 0.9) + cloud(20, 8, 0.95, 'cd', 13, 7); break;
      case 'fog': l = fog(); break;
      case 'rainy': l = drops(14, false) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'pouring': l = drops(26, true) + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'snowy': l = parts(16, 'fwc-a-flake', 2, '#fff', 6) + cloud(0, 0, 1, 'cl', 12, 3); break;
      case 'snowy-rainy': l = drops(8, false) + parts(8, 'fwc-a-flake', 2, '#fff', 6) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'hail': l = parts(14, 'fwc-a-fall', 1.8, '#e8f4ff', 1.3) + cloud(0, 0, 1, 'cd', 12, 3); break;
      case 'lightning': l = bolt() + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'lightning-rainy': l = drops(18, true) + bolt() + cloud(-18, -2, 0.85, 'cd', 10, 1) + cloud(18, 2, 1, 'cd', 13, 6); break;
      case 'windy': l = wind(); break;
      case 'windy-variant': l = wind() + cloud(10, -6, 0.8, 'cl', 7, 2); break;
      default: l = '';
    }
    return l ? defs + l : '';
  };

  /* ----------------------------------------------------------------------------------------------
   * Wetterszene: realistische, animierte Darstellung (Himmel, Sonne, Mond, Sterne, Wolken, Regen,
   * Schnee, Hagel, Nebel, Gewitter, Wind) – reines SVG + CSS, Wind beeinflusst Regenwinkel und Wolkentempo
   * -------------------------------------------------------------------------------------------- */
  /* Realistische Wolken: einmalig per Canvas erzeugte Texturen (Puffs + fraktales Rauschen + Selbstschattierung),
   * im SVG als <image> eingebunden und nur noch verschoben – kostet beim Animieren praktisch nichts. */
  const CLOUD_TONES = {
    l: { lit: [255, 255, 255], shade: [142, 156, 175], amb: 0.1 },
    m: { lit: [232, 236, 242], shade: [112, 122, 137], amb: 0.06 },
    d: { lit: [168, 176, 188], shade: [52, 58, 68], amb: 0.02 },
    dd: { lit: [128, 136, 148], shade: [40, 45, 53], amb: 0.02 },
    nd: { lit: [70, 80, 98], shade: [18, 22, 31], amb: 0.02 },
    n: { lit: [96, 108, 130], shade: [24, 30, 42], amb: 0.02 },
    nl: { lit: [138, 150, 174], shade: [38, 46, 62], amb: 0.04 },
  };
  const cloudTexCache = new Map();
  const cloudTex = (kind, seed, tone) => {
    const key = `${kind}|${seed}|${tone}`;
    if (cloudTexCache.has(key)) return cloudTexCache.get(key);
    let out = null;
    try {
      if (typeof document === 'undefined') throw new Error('no document');
      const deck = kind === 'deck';
      const W = deck ? 520 : 300, H = deck ? 150 : 170;
      let sd = (seed * 7919 + 104729) % 2147483647;
      const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      // Wertrauschen, mehrere Oktaven (Deck horizontal gestreckt)
      const oct = [];
      for (let o = 0; o < 6; o++) {
        const cx = (deck ? 130 : 34) / 2 ** o, cy = deck ? cx * 0.38 : cx;
        const gw = Math.ceil(W / cx) + 2, gh = Math.ceil(H / cy) + 2;
        const g = new Float32Array(gw * gh);
        for (let i = 0; i < g.length; i++) g[i] = rnd();
        oct.push({ cx, cy, gw, g, amp: 0.52 ** o });
      }
      const ampSum = oct.reduce((a, o) => a + o.amp, 0);
      const fbm = (x, y) => {
        let v = 0;
        for (const o of oct) {
          const fx = x / o.cx, fy = y / o.cy, ix = fx | 0, iy = fy | 0;
          let tx = fx - ix, ty = fy - iy;
          tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
          const i0 = iy * o.gw + ix, g = o.g;
          const a = g[i0] + (g[i0 + 1] - g[i0]) * tx, b = g[i0 + o.gw] + (g[i0 + o.gw + 1] - g[i0 + o.gw]) * tx;
          v += o.amp * (a + (b - a) * ty);
        }
        return v / ampSum;
      };
      const ss = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      const D = new Float32Array(W * H);
      const N = new Float32Array(W * H);
      const base = H * 0.8;
      if (deck) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const n = fbm(x, y); N[y * W + x] = n;
          D[y * W + x] = 1.25 - (y / H) * 1.45 + (n - 0.5) * 1.7;
        }
      } else {
        // Körper aus wenigen großen Puffs mit flacher Basis, darauf kleinere Quellungen (Blumenkohl)
        const body = [];
        const nb = 4 + Math.floor(rnd() * 2);
        for (let i = 0; i < nb; i++) {
          const t = (i + 0.5) / nb;
          const dome = Math.sin(Math.PI * (0.12 + 0.76 * t));
          const r = H * (0.14 + 0.15 * dome) * (0.88 + rnd() * 0.2);
          body.push([W * (0.25 + 0.5 * t) + (rnd() - 0.5) * 8, base - r * 0.42 - dome * H * 0.07, r]);
        }
        const puffs = body.slice();
        const bumps = [];
        for (let i = 0; i < 16; i++) {
          const j = U.clamp(Math.floor((0.5 + (rnd() + rnd() - 1) * 0.6) * nb), 0, nb - 1);
          const [bx, by, br] = body[j];
          const ang = -Math.PI * (0.1 + rnd() * 0.8);
          const b = [bx + Math.cos(ang) * br * 0.82, by + Math.sin(ang) * br * 0.82, br * (0.26 + rnd() * 0.24)];
          bumps.push(b); puffs.push(b);
        }
        // zweite, feinere Quellungsebene
        for (let i = 0; i < 14; i++) {
          const [bx, by, br] = bumps[Math.floor(rnd() * bumps.length)];
          const ang = -Math.PI * (0.05 + rnd() * 0.9);
          puffs.push([bx + Math.cos(ang) * br * 0.62, by + Math.sin(ang) * br * 0.62, br * (0.42 + rnd() * 0.22)]);
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          let d = 0;
          for (const [px, py, r] of puffs) {
            const q = ((x - px) ** 2 + (y - py) ** 2) / (r * r);
            if (q < 1) d += (1 - q) ** 1.6;
          }
          d = Math.min(d, 1.3);
          const n = fbm(x, y); N[y * W + x] = n;
          d += (n - 0.5) * (1.15 - Math.min(d, 1) * 0.5) * ss(0, 0.3, d); // Ränder zerfranst, keine Streuflecken
          d *= ss(base + H * 0.05, base - H * 0.03, y); // flache Unterseite
          D[y * W + x] = d;
        }
      }
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c2 = cv.getContext('2d');
      const img = c2.createImageData(W, H);
      const T = CLOUD_TONES[tone] || CLOUD_TONES.l;
      const lo = deck ? 0.3 : 0.2, hi = deck ? 0.72 : 0.52;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const al = ss(lo, hi, D[i]);
        if (al <= 0) continue;
        let L;
        if (deck) {
          // Wolkendecke von unten: dicke Stellen dunkel, dünne hell
          L = 1 - ss(0.35, 1.5, D[i]) * 0.75 + (N[i] - 0.5) * 0.35 - ss(H * 0.35, H, y) * 0.15;
        } else {
          let od = 0;
          for (let k = 1; k <= 8; k++) {
            const sx = Math.round(x + k * 1.6), sy = Math.round(y - k * 4);
            if (sx >= 0 && sx < W && sy >= 0) od += Math.max(0, D[sy * W + sx] - 0.2);
          }
          const hgt = ss(base, base - H * 0.5, y);
          L = Math.exp(-od * 0.3) * 0.6 + hgt * 0.4;
          L += (1 - al) * 0.2 + (N[i] - 0.5) * 0.3;
        }
        L = U.clamp(L * (1 - T.amb) + T.amb, 0, 1);
        const o = i * 4;
        img.data[o] = T.shade[0] + (T.lit[0] - T.shade[0]) * L;
        img.data[o + 1] = T.shade[1] + (T.lit[1] - T.shade[1]) * L;
        img.data[o + 2] = T.shade[2] + (T.lit[2] - T.shade[2]) * L;
        img.data[o + 3] = al * 255;
      }
      c2.putImageData(img, 0, 0);
      let url = cv.toDataURL('image/webp', 0.86);
      if (!url.startsWith('data:image/webp')) url = cv.toDataURL('image/png');
      out = { url, w: W, h: H };
    } catch (e) { out = null; }
    cloudTexCache.set(key, out);
    return out;
  };

  const sceneCache = new Map();
  const sceneSvg = (uid, o) => {
    let seed = 17;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const R = (a, b) => a + rnd() * (b - a);
    const c = String(o.cond || 'cloudy');
    const night = !o.isDay;
    const storm = ['lightning', 'lightning-rainy', 'pouring', 'hail', 'exceptional'].includes(c);
    const rain = ['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy', 'exceptional'].includes(c);
    const heavy = ['pouring', 'lightning-rainy', 'exceptional'].includes(c);
    const snow = ['snowy', 'snowy-rainy'].includes(c);
    const hail = c === 'hail';
    const fog = c === 'fog';
    const bolt = ['lightning', 'lightning-rainy'].includes(c);
    const windy = ['windy', 'windy-variant', 'exceptional'].includes(c) || o.windMs > 10;
    const nClouds = { sunny: 0, 'clear-night': 0, partlycloudy: 3, cloudy: 7, fog: 3, windy: 2, 'windy-variant': 5 }[c] ?? (storm ? 8 : 6);
    const dark = storm || rain || hail;
    const a = o.anim;
    // Himmel
    let sky;
    if (night) sky = dark || nClouds > 5 ? ['#141c2c', '#2a3446'] : ['#08142f', '#1b2a52'];
    else if (dark) sky = ['#4a5563', '#8a95a2'];
    else if (nClouds > 5 || fog) sky = ['#7b8897', '#b5c0cb'];
    else sky = ['#2c7bd0', '#86c1f3'];
    // Sonnenauf-/-untergang: warmer Himmel (Sonne bleibt an ihrem Platz, nur die Stimmung ändert sich)
    const dusk = o.dusk && !o.bare ? o.dusk : null;
    if (dusk) {
      const below = dusk === 'low';
      if (dark) sky = below ? ['#26223a', '#7a5560'] : ['#463f5c', '#b07a74'];
      else if (nClouds > 5 || fog) sky = below ? ['#2a3050', '#b07070'] : ['#4f5580', '#d89478'];
      else sky = below ? ['#18205a', '#d8705a'] : ['#2f4590', '#f29a5c'];
    }
    // Wolkentöne
    const tone = night ? (dark || nClouds > 5 ? 'n' : 'nl') : (dark ? 'd' : (nClouds > 5 || fog ? 'm' : 'l'));
    const toneCols = {
      l: ['#ffffff', '#dbe3ec', '#c2ccd8'], m: ['#eef2f6', '#a9b4c1', '#8c97a5'], d: ['#9aa4b1', '#5d6774', '#47505c'],
      n: ['#5e6a7e', '#2f394a', '#252d3b'], nl: ['#7b889d', '#435067', '#343f52'],
    }[tone];
    const windF = U.clamp(1 + (o.windMs || 0) / 6, 1, 4);
    const defs = `<defs>
      <linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}" stop-opacity=".95"/><stop offset=".7" stop-color="${sky[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${sky[1]}" stop-opacity="0"/></linearGradient>
      <radialGradient id="${uid}-cl" cx=".42" cy=".28" r=".75"><stop offset="0" stop-color="${toneCols[0]}"/><stop offset=".65" stop-color="${toneCols[1]}"/><stop offset="1" stop-color="${toneCols[2]}"/></radialGradient>
      <radialGradient id="${uid}-sunglow"><stop offset="0" stop-color="#fff4c4" stop-opacity=".95"/><stop offset=".25" stop-color="#ffe082" stop-opacity=".55"/><stop offset="1" stop-color="#ffca28" stop-opacity="0"/></radialGradient>
      <radialGradient id="${uid}-sun" cx=".42" cy=".4"><stop offset="0" stop-color="#fffef2"/><stop offset=".6" stop-color="${dusk ? '#ffc870' : '#ffe680'}"/><stop offset="1" stop-color="${dusk ? '#ff9a3c' : '#ffc233'}"/></radialGradient>${dusk ? `
      <radialGradient id="${uid}-dusk" cx=".78" cy=".55" r=".6"><stop offset="0" stop-color="#ffa060" stop-opacity="${dusk === 'low' ? '.5' : '.6'}"/><stop offset=".5" stop-color="#ff7a6a" stop-opacity=".2"/><stop offset="1" stop-color="#ff7a6a" stop-opacity="0"/></radialGradient>` : ''}
      <filter id="${uid}-soft" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="${uid}-fog" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${uid}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
    // o.bare: 'stars' = nur Sterne, 'sun' = nur Sonne/Mond (mittig in 240×240), sonst die ganze Szene
    let g = o.bare ? '' : `<rect width="400" height="220" fill="url(#${uid}-sky)"/>${dusk ? `<rect width="400" height="160" fill="url(#${uid}-dusk)"/>` : ''}`;
    // Sterne
    if (o.bare !== 'sun' && night && !dark && nClouds <= 5 && !fog) {
      let st = '';
      for (let i = 0; i < 70; i++) {
        const tw = a && i % 3 === 0 ? ` class="fwc-a-twinkle" style="animation-delay:-${n1(R(0, 3))}s;animation-duration:${n1(R(2, 4.5))}s"` : '';
        st += `<circle${tw} cx="${n1(R(0, 400))}" cy="${n1(R(0, 140))}" r="${n1(R(0.4, 1.3))}" fill="#fff" opacity="${n1(R(0.4, 1))}"/>`;
      }
      g += `<g>${st}</g>`;
    }
    // Sonne bzw. Mond
    const sx = o.bare === 'sun' || o.bare === 'rays' ? 120 : 330, sy = o.bare === 'sun' || o.bare === 'rays' ? 120 : 46;
    if (o.bare === 'stars') { /* kein Himmelskörper */ } else if (!night && !dark && ['sunny', 'partlycloudy', 'windy', 'windy-variant'].includes(c)) {
      let rays = '';
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2, w = 0.07;
        const p = (r, d) => `${n1(sx + Math.cos(ang + d) * r)},${n1(sy + Math.sin(ang + d) * r)}`;
        rays += `<polygon points="${p(30, -w)} ${p(i % 2 ? 80 : 104, 0)} ${p(30, w)}"/>`;
      }
      // o.split (3D-Wetter): Strahlen liegen in einer eigenen Ebene, die sich per CSS dreht (GPU, kein Neuzeichnen)
      if (o.bare === 'rays') g += `<g fill="#fff6c8" opacity=".28">${rays}</g>`;
      else g += `<circle cx="${sx}" cy="${sy}" r="120" fill="url(#${uid}-sunglow)" class="${a && !o.split ? 'fwc-a-pulse' : ''}"/>`
        + (o.split ? '' : `<g class="${a ? 'fwc-sc-rays' : ''}" fill="#fff6c8" opacity=".28">${rays}</g>`)
        + `<circle cx="${sx}" cy="${sy}" r="26" fill="url(#${uid}-sun)"/>`;
    } else if (night && !dark && nClouds <= 5) {
      g += `<circle cx="${sx}" cy="${sy}" r="62" fill="url(#fwc-g-moonglow)" opacity=".8"/>${moonShape(uid, sx, sy, 17, o.moonElong ?? 180, o.southern)}`;
    }
    // Wolken: realistische Texturen (Canvas); Fallback ohne Canvas: weiche Kreisgruppen
    const texDefs = [];
    const useTex = (kind, seed, tn = tone) => {
      const t = cloudTex(kind, seed, tn);
      if (!t) return null;
      const id = `${uid}-${kind}${seed}${tn}`;
      if (!texDefs.some(x => x.id === id)) texDefs.push({ id, t });
      return { id, t };
    };
    const cloudBlob = (x, y, sc, back) => {
      const parts = [[-40, 8, 22], [-16, -6, 30], [14, -13, 34], [42, 0, 26], [62, 10, 17], [-58, 14, 14]];
      const blobs = parts.map(([px, py, r]) => `<circle cx="${n1(px + R(-3, 3))}" cy="${n1(py + R(-3, 3))}" r="${n1(r * R(0.88, 1.12))}"/>`).join('');
      return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(sc)})" opacity="${back ? 0.75 : 0.97}"><g filter="url(#${uid}-soft)"><ellipse cx="4" cy="18" rx="70" ry="15" fill="${toneCols[2]}"/><g fill="url(#${uid}-cl)">${blobs}</g></g></g>`;
    };
    const cloud = (x, y, sc, back, seed) => {
      const dur = n1(R(28, 55) / windF), del = n1(R(0, 30));
      const tx = useTex('cu', seed);
      const inner = tx
        ? `<use href="#${tx.id}" x="${n1(-tx.t.w / 2)}" y="${n1(-tx.t.h * 0.62)}"/>`
        : cloudBlob(0, 0, 1, back);
      const s0 = tx ? 0.62 : 1;
      return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(sc * s0)})" opacity="${back ? 0.82 : 1}">`
        + `<g class="${a ? 'fwc-sc-drift' : ''}" style="animation-duration:${dur}s;animation-delay:-${del}s">${inner}</g></g>`;
    };
    let clouds = '';
    if (nClouds && !o.bare) {
      const slots = c === 'partlycloudy' ? [[95, 66, 0.95], [225, 36, 0.62], [305, 92, 0.8]]
        : dark
          ? Array.from({ length: nClouds }, (_, i) => [((i + 0.5) / nClouds) * 400 + R(-20, 20), R(10, 46), R(1.05, 1.4)])
          : Array.from({ length: nClouds }, (_, i) => [((i + 0.5) / nClouds) * 400 + R(-25, 25), R(26, 74), R(0.75, 1.1)]);
      const back = slots.filter((_, i) => i % 2).map(([x, y, sc], i) => cloud(x, y - 16, sc * 0.75, true, (i % 3) + 4)).join('');
      const front = slots.filter((_, i) => !(i % 2)).map(([x, y, sc], i) => cloud(x, y, sc, false, (i % 3) + 1)).join('');
      clouds = back + front;
      if (storm || nClouds > 5 || fog) {
        const dk = useTex('deck', storm ? 2 : 1, dark ? (night ? 'nd' : 'dd') : tone);
        const deckG = dk ? `<g class="${a ? 'fwc-sc-fog' : ''}" style="animation-duration:${n1(60 / windF)}s"><use href="#${dk.id}" x="-60" y="-12" transform="scale(1 ${dark ? 1.3 : 0.85})"/></g>` : '';
        // Bei Regen/Gewitter liegt die dunkle Wolkendecke vor den Quellwolken (nur deren Kuppen schauen heraus)
        clouds = dk
          ? (dark ? `${clouds}${deckG}` : `${deckG}${clouds}`)
          : `<rect width="400" height="70" fill="${toneCols[1]}" opacity="${night ? 0.5 : 0.35}" filter="url(#${uid}-fog)"/>${clouds}`;
      }
    }
    // Gewitter: Blitz + Aufhellen
    let flash = '';
    if (bolt) {
      const x0 = R(140, 260);
      let pts = `${n1(x0)},70`;
      let x = x0;
      for (let y = 90; y <= 200; y += 22) { x += R(-18, 18); pts += ` ${n1(x)},${y}`; }
      g += `<rect width="400" height="220" fill="#fff" class="${a ? 'fwc-sc-flash' : ''}" opacity="${a ? 0 : 0}"/>`;
      flash = `<polyline points="${pts}" fill="none" stroke="#fff7cc" stroke-width="2.6" stroke-linejoin="round" filter="url(#${uid}-glow)" class="${a ? 'fwc-sc-bolt' : ''}" opacity="${a ? 0 : 0.9}"/>`;
    }
    // Niederschlag
    let prec = '';
    const slant = U.clamp((o.windMs || 0) * 1.6, 0, 30);
    if (rain) {
      const nDrops = heavy ? 95 : (c === 'snowy-rainy' ? 32 : 55);
      for (let i = 0; i < nDrops; i++) {
        const x = R(-20, 420), y = R(40, 80), len = R(10, 18);
        prec += `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x - slant * len / 60)}" y2="${n1(y + len)}" class="${a ? 'fwc-sc-rain' : ''}" style="--sx:${n1(-slant * 3)}px;animation-duration:${n1(R(1.3, 1.9))}s;animation-delay:-${n1(R(0, 2))}s"${a ? '' : ` transform="translate(0 ${n1(R(0, 120))})"`}/>`;
      }
      prec = `<g stroke="${night ? '#9fb6d6' : '#cfe3ff'}" stroke-width="1.3" stroke-linecap="round" opacity=".8">${prec}</g>`;
    }
    if (snow) {
      let f = '';
      for (let i = 0; i < 60; i++) {
        f += `<circle cx="${n1(R(-10, 410))}" cy="${n1(R(45, 80))}" r="${n1(R(1.2, 2.8))}" class="${a ? 'fwc-sc-snow' : ''}" style="--sx:${n1(-slant * 2)}px;animation-duration:${n1(R(8, 14))}s;animation-delay:-${n1(R(0, 14))}s"${a ? '' : ` transform="translate(0 ${n1(R(0, 120))})"`}/>`;
      }
      prec += `<g fill="#fff" opacity=".92">${f}</g>`;
    }
    if (hail) {
      let h = '';
      for (let i = 0; i < 45; i++) {
        h += `<circle cx="${n1(R(-10, 410))}" cy="${n1(R(45, 80))}" r="${n1(R(1.6, 2.6))}" class="${a ? 'fwc-sc-hail' : ''}" style="--sx:${n1(-slant)}px;animation-duration:${n1(R(1.2, 1.7))}s;animation-delay:-${n1(R(0, 1.7))}s"${a ? '' : ` transform="translate(0 ${n1(R(0, 120))})"`}/>`;
      }
      prec += `<g fill="#f4f8ff" stroke="#a9bfd8" stroke-width=".6">${h}</g>`;
    }
    // Nebel
    let fogL = '';
    if (fog) {
      for (let i = 0; i < 6; i++) {
        fogL += `<ellipse cx="${n1(R(60, 340))}" cy="${n1(60 + i * 24)}" rx="${n1(R(170, 240))}" ry="${n1(R(16, 26))}" class="${a ? 'fwc-sc-fog' : ''}" style="animation-duration:${n1(R(16, 30))}s;animation-delay:-${n1(R(0, 20))}s"/>`;
      }
      fogL = `<g fill="${night ? '#8e9aac' : '#e6ebf0'}" opacity="${night ? 0.4 : 0.6}" filter="url(#${uid}-fog)">${fogL}</g>`;
    }
    // Wind
    let wind = '';
    if (windy) {
      for (let i = 0; i < 6; i++) {
        const y = R(40, 170);
        wind += `<path d="M -40 ${n1(y)} q 100 ${n1(R(-18, 18))} 200 0 t 200 ${n1(R(-10, 10))} t 120 0" class="${a ? 'fwc-sc-wind' : ''}" style="animation-duration:${n1(R(2.2, 4) / Math.sqrt(windF))}s;animation-delay:-${n1(R(0, 4))}s"/>`;
      }
      wind = `<g fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="${night ? 0.25 : 0.45}" stroke-dasharray="70 420">${wind}</g>`;
    }
    if (o.bare === 'sun' || o.bare === 'rays') return `<svg viewBox="0 0 240 240" class="sc-svg" aria-hidden="true">${defs}${g}</svg>`;
    if (o.bare) return `<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" class="sc-svg" aria-hidden="true">${defs}${g}</svg>`;
    const tdefs = texDefs.length ? `<defs>${texDefs.map(x => `<image id="${x.id}" href="${x.t.url}" width="${x.t.w}" height="${x.t.h}" preserveAspectRatio="none"/>`).join('')}</defs>` : '';
    return `<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMin slice" class="sc-svg" aria-hidden="true">${defs}${tdefs}${g}${clouds}${flash}${prec}${fogL}${wind}</svg>`;
  };
  const scene = (el, m, ctx) => {
    const uid = `fwcs${String(ctx.uid)}${String(el.id).replace(/[^a-z0-9]/gi, '')}`;
    const ws = m.cur.wind_speed;
    const windMs = ws ? U.windToMs(ws.v, ws.u) : 0;
    const o = {
      cond: m.condition || 'cloudy', isDay: m.isDay, anim: ctx.anim && el.animated !== false, windMs: Math.round(windMs),
      moonElong: m.moon ? Math.round(m.moon.elong / 5) * 5 : 180, southern: !!(m.loc && m.loc.lat < 0),
    };
    // Dämmerung: Sonne zwischen −6° und +7° Höhe
    const sunEl = m.sun && U.isNum(m.sun.el) ? m.sun.el : null;
    if (sunEl !== null && sunEl > -6 && sunEl < 7) o.dusk = sunEl < 0 ? 'low' : 'high';
    const key = JSON.stringify(o);
    let e = sceneCache.get(uid);
    if (!e || e.key !== key) e = remember(sceneCache, uid, { key, markup: sceneSvg(uid, o) });
    return html`<div class="cur-scene">${raw(e.markup)}</div>`;
  };

  /* ----------------------------------------------------------------------------------------------
   * Hilfen für die Element-Renderer
   * -------------------------------------------------------------------------------------------- */
  const valOf = (ctx, el, m, field) => {
    // Element-Entität hat Vorrang (z. B. eigener Temperatursensor)
    if (el.entity && ctx.hass.states[el.entity]) {
      const s = ctx.hass.states[el.entity];
      const v = field === 'wind_bearing' ? U.bearing(s.state) : U.toNum(s.state);
      if (v !== null) return { v, u: s.attributes.unit_of_measurement || '', src: 'sensor', e: el.entity };
    }
    return m.cur[field] || null;
  };
  const tempC = (val) => (val ? U.toC(val.v, val.u) : null);
  const noData = (ctx, icon = 'mdi:cloud-off-outline') => html`<div class="fwc-empty"><ha-icon .icon=${icon}></ha-icon><span>${ctx.t('w.no_data')}</span></div>`;
  const tFmt = (ctx, v, d = 0) => (U.isNum(v) ? `${ctx.f.num(v, d)}°` : '–');
  const pick = (v, d) => (v === undefined || v === null || v === '' ? d : v);
  // Senkrechter Farbverlauf nach Temperatur (feine Abstufung), y in % des Kurvenbereichs
  const tempGradient = (gid, lo, hi, top, bot, unit) => {
    const stops = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const v = hi - (hi - lo) * i / n;
      stops.push(`<stop offset="${(top + (bot - top) * i / n).toFixed(2)}%" stop-color="${U.tempColor(U.toC(v, unit))}"/>`);
    }
    return `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">${stops.join('')}</linearGradient>`;
  };
  // Wind-Zelle: Pfeil in Windrichtung (wohin er weht), Farbe nach Beaufort, darunter Geschwindigkeit
  const windCell = (ctx, m, wind, bearing) => {
    if (!U.isNum(wind)) return '';
    const ms = U.windToMs(wind, m.units.wind);
    const bft = U.msToBft(ms);
    const col = U.windColor(ms);
    const rot = U.isNum(bearing) ? (bearing + 180) % 360 : null;
    return html`<span class="wc" title="${ctx.f.num(wind, 0)} ${m.units.wind}${U.isNum(bearing) ? ` · ${ctx.t('compass')[Math.round(bearing / 22.5) % 16]}` : ''} · ${bft} ${ctx.t('w.beaufort')}">
      ${raw(`<svg viewBox="0 0 24 24" class="wc-ic" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-opacity=".6"/>${rot !== null
        ? `<path d="M12 4.5 L17 17 L12 14 L7 17 Z" fill="${col}" transform="rotate(${n1(rot)} 12 12)"/>` : `<circle cx="12" cy="12" r="3" fill="${col}"/>`}</svg>`)}
      <b style="color:${col}">${ctx.f.num(wind, 0)}</b></span>`;
  };

  /* ----------------------------------------------------------------------------------------------
   * Felder (Eigenschaften im Designer)
   * -------------------------------------------------------------------------------------------- */
  const F = {
    entity: (key, label, opts = {}) => ({ key, type: 'entity', label, ...opts }),
    bool: (key, label, def) => ({ key, type: 'bool', label, def }),
    num: (key, label, def, min, max, step = 1, unit = '') => ({ key, type: 'number', label, def, min, max, step, unit }),
    select: (key, label, options, def) => ({ key, type: 'select', label, options, def }),
    text: (key, label, def = '', placeholder = '') => ({ key, type: 'text', label, def, placeholder }),
  };
  const TEMP_SENS = { domain: ['sensor', 'input_number'], device_class: 'temperature' };
  // Wert aus den Karteneinstellungen, der greift, solange das Element keine eigene Entität hat (Anzeige im Designer)
  const fromSensors = (key) => {
    const fn = (el, cfg) => ((cfg && cfg.sensors) || {})[typeof key === 'function' ? key(el) : key] || '';
    fn.sensorKey = key;
    return fn;
  };
  // Eigene Sensoren der Elemente kartenweit nutzen: hat z. B. das Luftfeuchte-Element einen eigenen Sensor und die Karte
  // keinen, verwenden alle anderen Elemente (3D Wetter, Aktuelles Wetter, Verlauf …) denselben Sensor.
  // Reihenfolge je Wert: Sensor der Karte > Sensor eines Elements > HA-Wetterintegration > Open-Meteo.
  const elementSensors = (elements) => {
    const out = {};
    (elements || []).forEach((el) => {
      const d = TYPES[el.type];
      if (!d || !d.fields) return;
      d.fields.forEach((f) => {
        const inh = f.inherit;
        if (!inh || !inh.sensorKey || !el[f.key]) return;
        const k = typeof inh.sensorKey === 'function' ? inh.sensorKey(el) : inh.sensorKey;
        if (k && !out[k]) out[k] = el[f.key];
      });
    });
    return out;
  };

  /* ----------------------------------------------------------------------------------------------
   * Element-Typen
   * -------------------------------------------------------------------------------------------- */
  const TYPES = {};

  /* --- Titel & Datum ------------------------------------------------------------------------- */
  TYPES.header = {
    group: 'current', icon: 'mdi:format-title', w: 6, h: 1, minW: 2, minH: 1, titled: false, style: 'none',
    fields: [
      F.text('text', 'f.header_text', '', ''),
      F.bool('show_date', 'f.show_date', true),
      F.bool('show_time', 'f.show_time', true),
      F.bool('show_condition', 'f.show_condition', false),
      F.select('align', 'f.align', ['left', 'center', 'right'], 'left'),
    ],
    needs: (el) => ({ condition: el.show_condition === true, fields: el.show_condition ? { temperature: 1 } : {} }),
    entity: (el, m) => m.weatherId,
    render(el, m, ctx) {
      const title = el.text || (ctx.hass.config && ctx.hass.config.location_name) || ctx.t('el.header');
      const sub = [];
      if (el.show_date !== false) sub.push(ctx.f.date(m.now));
      if (el.show_time !== false) sub.push(ctx.f.time(m.now));
      const t = m.cur.temperature;
      return html`<div class="hdr a-${el.align || 'left'}">
        <div class="hdr-txt"><div class="hdr-title">${title}</div>${sub.length ? html`<div class="hdr-sub">${sub.join(' · ')}</div>` : ''}</div>
        ${el.show_condition && m.condition ? html`<div class="hdr-cond">${raw(iconSvg(m.condition, m.isDay, false))}<span>${t ? tFmt(ctx, t.v, 0) : ''}</span></div>` : ''}
      </div>`;
    },
  };

  /* --- Aktuelles Wetter ---------------------------------------------------------------------- */
  TYPES.current = {
    group: 'current', icon: 'mdi:weather-partly-cloudy', w: 6, h: 3, minW: 2, minH: 2, titled: false,
    fields: [
      F.select('display', 'f.current_display', ['icon', 'scene'], 'icon'),
      F.entity('entity', 'f.temp_entity', { ...TEMP_SENS, inherit: fromSensors('temperature') }),
      F.bool('show_condition', 'f.show_condition', true),
      F.bool('show_feels_like', 'f.show_feels_like', true),
      F.bool('show_minmax', 'f.show_minmax', true),
      F.bool('show_details', 'f.show_details', true),
      F.bool('temp_colors', 'f.temp_colors', false),
      F.bool('animated', 'f.animated', true),
    ],
    background: (el, m, ctx) => (el.display === 'scene' ? scene(el, m, ctx) : ''),
    needs: (el) => ({
      condition: true, daily: el.show_minmax !== false,
      fields: { temperature: 1, ...(el.display === 'scene' ? { wind_speed: 1 } : {}), ...(el.show_feels_like !== false ? { apparent_temperature: 1 } : {}), ...(el.show_details !== false ? { humidity: 1, wind_speed: 1, precipitation_probability: 1 } : {}) },
    }),
    entity: (el, m) => el.entity || m.weatherId || (m.cur.temperature && m.cur.temperature.e),
    render(el, m, ctx) {
      const t = valOf(ctx, el, m, 'temperature');
      const fl = m.cur.apparent_temperature;
      const color = el.temp_colors && t ? U.tempColor(tempC(t)) : '';
      const anim = ctx.anim && el.animated !== false;
      const hum = m.cur.humidity, wind = m.cur.wind_speed, pop = m.cur.precipitation_probability;
      const details = el.show_details !== false ? [
        hum ? html`<span><ha-icon icon="mdi:water-percent"></ha-icon>${ctx.f.num(hum.v, 0)} %</span>` : '',
        wind ? html`<span><ha-icon icon="mdi:weather-windy"></ha-icon>${ctx.f.num(wind.v, 0)} ${wind.u}</span>` : '',
        pop ? html`<span><ha-icon icon="mdi:umbrella-outline"></ha-icon>${ctx.f.num(pop.v, 0)} %</span>` : '',
      ].filter(Boolean) : [];
      const sceneMode = el.display === 'scene';
      return html`<div class="cur ${details.length ? 'has-det' : ''} ${sceneMode ? 'scene' : ''}">
        ${sceneMode ? '' : html`<div class="cur-icon">${raw(iconSvg(m.condition || 'cloudy', m.isDay, anim))}</div>`}
        <div class="cur-main">
          <div class="cur-temp" style="${color ? `color:${color}` : ''}">${t ? ctx.f.num(t.v, 1) : '–'}<span class="u">${t ? t.u : ''}</span></div>
          ${el.show_condition !== false ? html`<div class="cur-cond">${condText(ctx, m.condition)}</div>` : ''}
        </div>
        <div class="cur-side">
          ${el.show_feels_like !== false && fl ? html`<div class="cur-fl">${ctx.t('w.feels_like')} <b>${tFmt(ctx, fl.v, 0)}</b></div>` : ''}
          ${el.show_minmax !== false && (U.isNum(m.today.max) || U.isNum(m.today.min)) ? html`<div class="cur-hl">
            <span class="hi"><ha-icon icon="mdi:arrow-up-thin"></ha-icon>${tFmt(ctx, m.today.max, 0)}</span>
            <span class="lo"><ha-icon icon="mdi:arrow-down-thin"></ha-icon>${tFmt(ctx, m.today.min, 0)}</span></div>` : ''}
        </div>
        ${details.length ? html`<div class="cur-det">${details}</div>` : ''}
      </div>`;
    },
  };

  /* --- 3D Wetter ------------------------------------------------------------------------------ */
  // Diorama aus CSS-3D-Ebenen: Himmel, Wolken in mehreren Tiefen, schwebende Insel mit Bäumen & Windrad,
  // Niederschlag mit Tiefe und Wertekarten aus Glas. Die Szene wird einmal erzeugt (deterministisch) und gecacht.
  const w3dState = (c, night) => {
    const storm = ['lightning', 'lightning-rainy', 'pouring', 'hail', 'exceptional'].includes(c);
    const rain = ['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy', 'exceptional'].includes(c);
    const heavy = ['pouring', 'lightning-rainy', 'exceptional'].includes(c);
    const snow = ['snowy', 'snowy-rainy'].includes(c);
    const hail = c === 'hail', fog = c === 'fog', bolt = ['lightning', 'lightning-rainy'].includes(c);
    const nCl = { sunny: 0, 'clear-night': 0, partlycloudy: 3, cloudy: 7, fog: 3, windy: 2, 'windy-variant': 4 }[c] ?? (storm ? 7 : 5);
    const dark = storm || rain || hail;
    const tone = night ? (dark || nCl > 5 ? 'n' : 'nl') : (dark ? 'd' : (nCl > 5 || fog ? 'm' : 'l'));
    let sky;
    if (night) sky = dark || nCl > 5 ? ['#0b1220', '#1d2738', '#2a3548'] : ['#050c20', '#14224a', '#243a6e'];
    else if (dark) sky = ['#38424f', '#6b7786', '#9aa5b3'];
    else if (nCl > 5 || fog) sky = ['#62707f', '#9aa7b5', '#c5ced8'];
    else sky = ['#1f62b5', '#4f9be0', '#a9d6f8'];
    return { storm, rain, heavy, snow, hail, fog, bolt, nCl, dark, tone, sky, night };
  };
  // Baum als SVG (Farben über CSS-Variablen der Insel); zwei gekreuzte Ebenen ergeben von jeder Seite einen Körper
  // Natürlicher See: unregelmäßiges Ufer, flacher heller Rand, dunkle Mitte, Steine, Schilf und Rohrkolben
  const W3D_LAKE = 'M8 30 C5 19 17 10 31 12 C41 13 45 6 57 7 C71 8 79 13 86 21 C94 30 91 43 79 48 C68 53 58 49 47 53 C35 57 19 55 12 46 C8 41 9 35 8 30 Z';
  const W3D_REED = '<svg viewBox="0 0 60 80" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-width="2.4">'
    + '<path d="M30 80 Q28 50 24 18" stroke="var(--c2)"/><path d="M34 80 Q36 52 40 24" stroke="var(--c2)"/><path d="M27 80 Q18 60 8 46" stroke="var(--c1)"/>'
    + '<path d="M36 80 Q46 62 56 50" stroke="var(--c1)"/><path d="M31 80 Q31 56 31 32" stroke="var(--c1)"/><path d="M29 80 Q22 64 16 34" stroke="var(--c2)"/></g>'
    + '<g fill="#7a4f2c"><rect x="21.5" y="10" width="5" height="15" rx="2.5"/><rect x="37.5" y="16" width="5" height="14" rx="2.5"/><rect x="13.5" y="27" width="4.4" height="12" rx="2.2"/></g>'
    + '<path class="snowcap" d="M21.5 12 h5 v3 h-5z M37.5 18 h5 v3 h-5z" fill="#fff"/></svg>';
  const W3D_POND = `<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
    <path d="${W3D_LAKE}" fill="none" stroke="var(--g2)" stroke-width="9" stroke-linejoin="round" opacity=".55"/>
    <path d="${W3D_LAKE}" fill="var(--shore)" stroke="var(--shore)" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="${W3D_LAKE}" fill="color-mix(in srgb, var(--shore) 55%, #000)" opacity=".35" transform="translate(1.2 1.6)"/>
    <g class="pd-w">
      <path d="${W3D_LAKE}" fill="color-mix(in srgb, var(--water) 72%, #fff)"/>
      <path d="${W3D_LAKE}" fill="var(--water)" transform="translate(49 31) scale(.84) translate(-49 -31)"/>
      <path class="pd-deep" d="${W3D_LAKE}" fill="color-mix(in srgb, var(--water) 60%, #0a2c58)" opacity=".42" transform="translate(52 31) scale(.62) translate(-52 -31)"/>
      <path class="pd-deep" d="${W3D_LAKE}" fill="color-mix(in srgb, var(--water) 50%, #082048)" opacity=".28" transform="translate(53 31) scale(.38) translate(-53 -31)"/>
      <g class="pd-ice"><path d="${W3D_LAKE}" fill="#fff" opacity=".35" transform="translate(49 31) scale(.92) translate(-49 -31)"/>
        <g fill="none" stroke="#9cc4dc" stroke-width=".9" stroke-linecap="round" opacity=".9"><path d="M22 26 L34 30 L40 24 L52 29 M34 30 L37 40 L48 44 M52 29 L64 26 L74 31 M58 38 L66 34"/></g>
        <g fill="#fff"><path d="M12 36 Q20 30 28 36 Q20 40 12 36Z"/><path d="M66 46 Q74 41 82 45 Q75 49 66 46Z"/><path d="M48 12 Q56 9 62 13 Q55 16 48 12Z" opacity=".8"/></g></g>
      <g class="pd-gloss" fill="none" stroke="#fff" stroke-linecap="round" opacity=".55">
        <path d="M24 22 Q34 17 44 21" stroke-width="1.6"/><path d="M58 38 Q66 35 73 38" stroke-width="1.3"/><path d="M33 41 Q38 39 43 41" stroke-width="1"/>
      </g>
    </g>
    <g class="pd-stones"><ellipse cx="76" cy="12.5" rx="6" ry="3.6" fill="#8d8f8a"/><ellipse cx="75" cy="11.6" rx="4.6" ry="2.4" fill="#a9aba5"/>
      <ellipse cx="83.5" cy="14.5" rx="3.4" ry="2.2" fill="#7f817c"/><ellipse cx="18" cy="51" rx="4.4" ry="2.6" fill="#8d8f8a"/><ellipse cx="17.4" cy="50.3" rx="3.2" ry="1.7" fill="#a9aba5"/></g>
    <g class="pd-reed" stroke="var(--c2)" stroke-width="1.1" stroke-linecap="round" fill="none">
      <path d="M10 41 q-3 -7 -1 -14"/><path d="M12 42 q0 -8 3 -13"/><path d="M14 43 q2 -6 6 -9"/><path d="M9 44 q-4 -4 -6 -4"/>
      <path d="M88 24 q2 -8 1 -14"/><path d="M90 26 q4 -6 7 -8"/><path d="M86 25 q-2 -6 -5 -9"/>
      <path d="M60 52 q1 -5 3 -8"/><path d="M62 52 q3 -4 6 -5"/>
    </g>
    <g class="pd-reed" fill="#7a4f2c"><ellipse cx="9" cy="27.5" rx="1.1" ry="2.6"/><ellipse cx="15" cy="29.5" rx="1.1" ry="2.6"/><ellipse cx="89" cy="10.5" rx="1.1" ry="2.6"/><ellipse cx="63" cy="44.5" rx="1" ry="2.3"/></g>
  </svg>`;

  const W3D_PINE = '<svg viewBox="0 0 100 150" aria-hidden="true"><rect x="43" y="124" width="14" height="26" fill="#6b4a2b"/><rect x="50" y="124" width="7" height="26" fill="#52371f"/>'
    + [['50 80 4 134 96 134', 134], ['50 52 12 110 88 110', 110], ['50 28 20 78 80 78', 78], ['50 6 28 46 72 46', 46]].map(([p]) => {
      const [tx, ty, lx, ly, rx, ry] = p.split(' ').map(Number);
      return `<polygon points="${tx},${ty} ${lx},${ly} ${tx},${ly}" fill="var(--p1)"/><polygon points="${tx},${ty} ${rx},${ry} ${tx},${ry}" fill="var(--p2)"/>`
        + `<polygon class="snowcap" points="${tx},${ty} ${n1(tx + (rx - tx) * 0.42)},${n1(ty + (ry - ty) * 0.42)} ${n1(tx + (lx - tx) * 0.42)},${n1(ty + (ly - ty) * 0.42)}" fill="#fff"/>`;
    }).join('') + '</svg>';
  // Laubbaum: Krone (Sommer/Herbst), Blüten (Frühling), kahle Äste (Winter)
  const W3D_ROUND = '<svg viewBox="0 0 100 130" aria-hidden="true"><rect x="45" y="70" width="10" height="60" rx="2" fill="#6b4a2b"/><rect x="51" y="70" width="4" height="60" fill="#52371f"/>'
    + '<g class="crown"><circle cx="50" cy="48" r="38" fill="var(--c2)"/><circle cx="30" cy="58" r="26" fill="var(--c2)"/><circle cx="70" cy="58" r="27" fill="var(--c2)"/>'
    + '<circle cx="44" cy="40" r="30" fill="var(--c1)"/><circle cx="64" cy="48" r="20" fill="var(--c1)"/><circle cx="34" cy="52" r="18" fill="var(--c1)"/>'
    + '<circle cx="38" cy="32" r="12" fill="#fff" opacity=".18"/>'
    + '<g class="blossom">' + [[28, 40], [44, 24], [62, 34], [70, 56], [36, 60], [54, 50], [22, 58], [50, 12], [78, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#ffd6e6"/><circle cx="${x}" cy="${y}" r="1.3" fill="#f59ab9"/>`).join('') + '</g>'
    + '<path class="snowcap" d="M16 40 Q50 -2 84 40 Q50 22 16 40Z" fill="#fff"/></g>'
    + '<g class="bare" fill="none" stroke="#5e4128" stroke-linecap="round"><path d="M50 74 Q48 50 50 24" stroke-width="6"/><path d="M50 58 Q36 48 24 34" stroke-width="4"/><path d="M50 50 Q64 40 76 28" stroke-width="4"/>'
    + '<path d="M36 47 Q30 34 32 22" stroke-width="2.4"/><path d="M66 40 Q72 30 70 18" stroke-width="2.4"/><path d="M50 36 Q42 26 40 14" stroke-width="2.4"/><path d="M28 40 Q18 38 12 30" stroke-width="2"/><path d="M72 36 Q82 36 88 28" stroke-width="2"/>'
    + '<path class="snowtwig" d="M24 34 L30 40 M32 22 L35 28 M70 18 L68 26 M40 14 L43 22 M76 28 L70 33 M12 30 L18 33 M88 28 L82 31" stroke="#fff" stroke-width="2.4"/></g></svg>';
  const W3D_BUSH = '<svg viewBox="0 0 100 70" aria-hidden="true"><ellipse cx="50" cy="52" rx="46" ry="16" fill="var(--c2)"/><circle cx="30" cy="40" r="22" fill="var(--c2)"/><circle cx="68" cy="38" r="24" fill="var(--c2)"/><circle cx="44" cy="30" r="22" fill="var(--c1)"/><circle cx="68" cy="34" r="14" fill="var(--c1)"/><path class="snowcap" d="M18 34 Q46 4 82 30 Q50 22 18 34Z" fill="#fff"/></svg>';
  const W3D_SNOWMAN = '<svg viewBox="0 0 60 90" aria-hidden="true">'
    + '<path d="M17 50 L4 38 M43 50 L57 36" stroke="#6b4a2b" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
    + '<ellipse cx="30" cy="72" rx="19" ry="17" fill="#f7fbff"/><ellipse cx="30" cy="46" rx="14" ry="13" fill="#f2f8fd"/><circle cx="30" cy="25" r="10" fill="#fafdff"/>'
    + '<path d="M30 74 a19 17 0 0 0 19 -6 a19 17 0 0 1 -19 15z M30 48 a14 13 0 0 0 14 -4 a14 13 0 0 1 -14 13z" fill="#c9d9e8"/>'
    + '<path d="M20 34 Q30 39 40 34 L41 37 Q30 42 19 37Z" fill="#e5484d"/><path d="M36 36 l4 10 l-5 -1z" fill="#c43d42"/>'
    + '<rect x="21" y="8" width="18" height="10" rx="1.5" fill="#2b2f36"/><rect x="17" y="16" width="26" height="3" rx="1.5" fill="#2b2f36"/>'
    + '<circle cx="26.5" cy="23" r="1.4" fill="#222"/><circle cx="33.5" cy="23" r="1.4" fill="#222"/><path d="M30 26 l9 2 l-9 1.5z" fill="#f08a24"/>'
    + '<circle cx="30" cy="44" r="1.5" fill="#222"/><circle cx="30" cy="50" r="1.5" fill="#222"/></svg>';
  const W3D_DUCK = '<svg viewBox="0 0 40 26" aria-hidden="true"><ellipse cx="18" cy="18" rx="15" ry="7" fill="#8a6a4a"/><path d="M4 16 Q2 10 8 12 Z" fill="#6f5238"/>'
    + '<ellipse cx="17" cy="16" rx="8" ry="4" fill="#a4835f"/><circle cx="29" cy="9" r="5.5" fill="#2f7a4a"/><path d="M33.5 9 l6 1.6 l-6 1.4z" fill="#f2b233"/>'
    + '<circle cx="30.5" cy="8" r="1" fill="#111"/><rect x="25.5" y="13" width="6" height="1.6" fill="#fff"/><path d="M3 21 Q18 27 33 21" stroke="#fff" stroke-opacity=".5" fill="none"/></svg>';
  const W3D_FLY = (c) => `<svg viewBox="0 0 30 20" aria-hidden="true"><g class="wl"><path d="M15 10 Q4 -2 2 8 Q4 14 15 11Z" fill="${c}"/><path d="M15 11 Q6 20 9 18 Q13 17 15 12Z" fill="${c}" opacity=".8"/></g>`
    + `<g class="wr"><path d="M15 10 Q26 -2 28 8 Q26 14 15 11Z" fill="${c}"/><path d="M15 11 Q24 20 21 18 Q17 17 15 12Z" fill="${c}" opacity=".8"/></g><rect x="14.2" y="6" width="1.6" height="9" rx=".8" fill="#2b2b2b"/></svg>`;
  const W3D_STRIKE = (pts) => `<svg viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#fff3b0" stroke-width="2.4" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round"/></svg>`;
  // Hütte in derselben Schrägansicht wie die Insel (wird zur Kamera gedreht), mit Fensterlicht und Schornstein
  const w3dHut = (cl) => {
    const P = (x, y) => `${n1(x)},${n1(y)}`;
    const F = [40, 96], L = [13, 75.4], Rr = [86.7, 78.1], hw = 30;
    const up = ([x, y], d = hw) => [x, y - d];
    const Ft = up(F), Lt = up(L), Rt = up(Rr), B = [L[0] + Rr[0] - F[0], L[1] + Rr[1] - F[1]], Bt = up(B);
    const P1 = [(Ft[0] + Lt[0]) / 2, (Ft[1] + Lt[1]) / 2 - 22], P2 = [P1[0] + (Rt[0] - Ft[0]), P1[1] + (Rt[1] - Ft[1])];
    const on = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    // Fenster/Tür als Parallelogramme auf der rechten Wand (Richtung F→R) bzw. der Giebelwand (Richtung F→L)
    const quad = (base, dir, t0, t1, h0, h1) => { const a = on(base, dir, t0), b = on(base, dir, t1); return `${P(a[0], a[1] - h0)} ${P(b[0], b[1] - h0)} ${P(b[0], b[1] - h1)} ${P(a[0], a[1] - h1)}`; };
    const win1 = quad(F, Rr, 0.14, 0.32, 12, 23), win2 = quad(F, Rr, 0.68, 0.86, 12, 23), door = quad(F, Rr, 0.42, 0.58, 0, 21), win3 = quad(F, L, 0.3, 0.7, 14, 24);
    const ch = on(P1, P2, 0.72);
    // Rauch: mehrere Wölkchen in hellem und dunklerem Grau, damit er vor hellem und dunklem Himmel sichtbar ist
    w3dHut.chimney = [n1(ch[0] + 1), n1(ch[1] - 15)];
    // Zeichenfläche nach oben erweitert, damit der Rauch Platz hat (außerhalb würde er abgeschnitten)
    return `<svg viewBox="0 -80 100 180" aria-hidden="true" overflow="visible">
      <polygon points="${P(...F)} ${P(...Rr)} ${P(...Rt)} ${P(...Ft)}" fill="${cl.wallR}"/>
      <polygon points="${P(...F)} ${P(...L)} ${P(...Lt)} ${P(...Ft)}" fill="${cl.wallL}"/>
      <g stroke="${cl.plank}" stroke-width=".6" opacity=".55">${[0.33, 0.66].map(t => { const a = on(F, Rr, 0), b = on(F, Rr, 1); return `<line x1="${n1(a[0])}" y1="${n1(a[1] - hw * t)}" x2="${n1(b[0])}" y2="${n1(b[1] - hw * t)}"/>`; }).join('')}</g>
      <polygon points="${P(...Lt)} ${P(...Ft)} ${P(...P1)}" fill="${cl.wallL}"/>
      <polygon class="hw" points="${win3}" fill="${cl.win}"/><polygon class="hw" points="${win1}" fill="${cl.win}"/><polygon class="hw" points="${win2}" fill="${cl.win}"/>
      <polygon points="${door}" fill="${cl.door}"/>
      <polygon points="${P(Lt[0] - 2, Lt[1] + 1)} ${P(...P1)} ${P(...P2)} ${P(Bt[0], Bt[1])}" fill="${cl.roofB}"/>
      <rect x="${n1(ch[0] - 3)}" y="${n1(ch[1] - 12)}" width="6.5" height="14" fill="${cl.chim}"/><rect x="${n1(ch[0] - 4)}" y="${n1(ch[1] - 14)}" width="8.5" height="3" fill="${cl.chimTop}"/>
      <polygon points="${P(Ft[0] - 1.5, Ft[1] + 2.5)} ${P(Rt[0] + 2.5, Rt[1] + 1.5)} ${P(P2[0] + 1, P2[1] - 1)} ${P(P1[0] - 1.5, P1[1] - 0.5)}" fill="${cl.roof}"/>
      <polygon class="hsnow" points="${P(Ft[0] - 1.5, Ft[1] + 2.5)} ${P(Rt[0] + 2.5, Rt[1] + 1.5)} ${P(P2[0] + 1, P2[1] - 1)} ${P(P1[0] - 1.5, P1[1] - 0.5)}" fill="#f4f9fd"/>
    </svg>`;
  };
  const W3D_SOCK = '<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">'
    + [0, 1, 2, 3, 4].map(i => { const x0 = i * 20, x1 = x0 + 20, t0 = 2 + i * 3, t1 = 2 + (i + 1) * 3; return `<polygon points="${x0},${t0} ${x1},${t1} ${x1},${40 - t1} ${x0},${40 - t0}" fill="${i % 2 ? '#fff' : '#e8452c'}"/>`; }).join('')
    + '<rect x="0" y="1" width="3" height="38" fill="#9aa4ad"/></svg>';
  // Unförmige Pfützen: geschlossene, weiche Kurve durch unregelmäßige Radien (je Pfütze feste Form)
  const W3D_PUD = [[1, .78, 1.05, .7, .92, 1.08, .74, .96, 1.02, .8], [.95, 1.06, .82, .98, .76, 1, 1.04, .86, .94], [1.04, .8, .96, .9, 1.06, .74, .98], [.9, 1.05, .8, 1, .95, .78, 1.02, .88]]
    .map((rs) => {
      const n = rs.length;
      const p = rs.map((r, i) => { const t = (i / n) * Math.PI * 2 + 0.3; return [50 + Math.cos(t) * 44 * r, 50 + Math.sin(t) * 44 * r]; });
      // Catmull-Rom → Bézier
      let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
      for (let i = 0; i < n; i++) {
        const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
        d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
      }
      d += 'Z';
      return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="w3dpg" cx="45%" cy="45%" r="60%"><stop offset="30%" class="s1"/><stop offset="100%" class="s2"/></radialGradient><radialGradient id="w3dph" cx="34%" cy="32%" r="34%"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`
        + `<path d="${d}" class="o"/><path d="${d}" class="m"/><path d="${d}" class="w"/><path d="${d}" fill="url(#w3dph)"/><path d="${d}" class="l"/></svg>`;
    });
  const w3dCache = new Map();
  const w3dScene = (uid, o) => {
    let seed = 11;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const R = (a, b) => a + rnd() * (b - a);
    const w = w3dState(o.cond, o.night);
    // Dämmerung (Sonne knapp über / unter dem Horizont): warmer Himmel und Abendlicht, die Sonne bleibt an ihrem Platz
    if (o.dusk) {
      const below = o.dusk === 'low';
      if (w.dark) w.sky = below ? ['#1c1a30', '#4a3a52', '#8a5a5a'] : ['#3a3550', '#7a5a6a', '#c48a6a'];
      else if (w.nCl > 5 || w.fog) w.sky = below ? ['#232a48', '#6a4d6e', '#c27a6a'] : ['#4a4f78', '#a06a80', '#e8a07a'];
      else w.sky = below ? ['#121a46', '#5a3f7a', '#e0795a'] : ['#2c3f86', '#c2607a', '#f7a85a'];
    }
    const a = o.anim;
    const windF = U.clamp(1 + (o.windMs || 0) / 6, 1, 4);
    const skyO = { cond: o.cond, isDay: !o.night, anim: a, windMs: o.windMs, moonElong: o.moonElong, southern: o.southern };
    const starsSvg = o.scene ? sceneSvg(`${uid}k`, { ...skyO, bare: 'stars' }) : '';
    const sunSvg = o.scene ? sceneSvg(`${uid}s`, { ...skyO, bare: 'sun', split: true }) : '';
    // Sonnenstrahlen: eigene Ebene, dreht sich langsam (nur bei Animation und wenn die Sonne zu sehen ist)
    const raysSvg = o.scene && a ? sceneSvg(`${uid}r`, { ...skyO, bare: 'rays' }) : '';
    const hasRays = raysSvg.includes('<polygon');

    /* Wolken in drei Tiefen */
    const cl = [];
    const addCloud = (kind, ts, tone, x, y, wd, z, op, dur, del, cls = '') => {
      const t = cloudTex(kind, ts, tone);
      if (!t) return;
      cl.push(html`<div class="w3d-cl ${cls}" style="left:${n1(x)}%;top:${n1(y)}%;width:${n1(wd)}cqw;opacity:${n1(op * 0.78)};transform:translateZ(${z}px)"><img src="${t.url}" alt="" draggable="false" class="${a ? 'w3d-drift' : ''}" style="animation-duration:${n1(dur)}s;animation-delay:-${n1(del)}s"></div>`);
    };
    if (o.scene) {
      if (w.nCl) {
        const depths = [[-200, 30, 0.85], [-130, 36, 0.93], [-70, 42, 1]];
        for (let i = 0; i < w.nCl; i++) {
          const d = depths[i % 3];
          const x = (i / w.nCl) * 105 - 14 + R(-5, 5);
          // vordere Wolken etwas höher, damit sie über der Insel schweben und nicht auf dem Boden zu laufen scheinen
          const y = (w.dark ? R(-6, 10) : R(-4, 16)) - (i % 3) * 3;
          addCloud('cu', (i % 6) + 1, w.tone, x, y, d[1] * R(0.85, 1.15), d[0], d[2], R(32, 58) / windF, R(0, 30));
        }
        if (w.dark || w.fog) addCloud('deck', w.storm ? 2 : 1, w.dark ? (w.night ? 'nd' : 'dd') : w.tone, -12, -10, 124, -150, w.dark ? 0.95 : 0.7, 70 / windF, 10, 'deck');
      }
    }

    /* Insel: Boden und Erde folgen dem Wetter */
    const snowG = w.snow || (o.tempC !== null && o.tempC <= -2);
    const frost = !snowG && o.tempC !== null && o.tempC <= 1;       // Bodenfrost
    const dry = !snowG && !w.rain && !!o.dry;                          // Dürre
    const wet = w.rain && !snowG;
    let grass, soil, lip, pine, crown, water;
    if (snowG) { grass = ['#f7fbff', '#cddbe9']; soil = ['#6e7d8c', '#3b4856']; lip = '#eaf3fb'; pine = ['#4f8f72', '#2f6a52']; crown = ['#79a58c', '#4f7f66']; }
    else if (frost) { grass = ['#a9c9b6', '#7ea993']; soil = ['#66788a', '#3a4756']; lip = '#d5e6ee'; pine = ['#3d8a62', '#26694a']; crown = ['#6aa882', '#468463']; }
    else if (dry) { grass = ['#cdb86a', '#a38d48']; soil = ['#b08a5c', '#7c5b38']; lip = '#c7a85c'; pine = ['#7c8a3f', '#56622a']; crown = ['#b9b04a', '#8c8a33']; }
    else if (wet) { grass = ['#4a9a5a', '#2f7448']; soil = ['#7b5a3b', '#4a3624']; lip = '#2f7448'; pine = ['#348a50', '#1c5e38']; crown = ['#4aaa5e', '#287a42']; }
    else if (o.season === 'summer') { grass = ['#9cc07a', '#759a55']; soil = ['#a07650', '#6e4e32']; lip = '#759a55'; pine = ['#3f9a55', '#1f6a3a']; crown = ['#68c75a', '#2f8a45']; }
    else { grass = ['#74c45e', '#4a9a43']; soil = ['#9a6f47', '#6a4a2e']; lip = '#4a9a43'; pine = ['#3f9a55', '#1f6a3a']; crown = ['#68c75a', '#2f8a45']; }
    if (w.night) {
      const dim = (c) => U.rgb(U.hex(c).map(v => v * 0.45));
      grass = grass.map(dim); soil = soil.map(dim); lip = dim(lip); pine = pine.map(dim); crown = crown.map(dim);
    }
    water = w.night ? '#27487a' : (snowG || frost ? '#9fd0ee' : (dry ? '#8cc4d8' : '#5fb4f0'));
    let shore = snowG ? '#e9f1f8' : frost ? '#b7c6cf' : dry ? '#b99b62' : wet ? '#6b4f33' : '#8d6c45';
    if (w.night) shore = U.rgb(U.hex(shore).map(v => v * 0.5));
    // See friert bei Minusgraden (oder Schnee) zu
    const ice = snowG || (o.tempC !== null && o.tempC < 0);
    if (ice) water = w.night ? '#5d7a9e' : '#d4ebf7';
    const season = o.season || 'summer';
    const dimC = (c) => (w.night ? U.rgb(U.hex(c).map(v => v * 0.45)) : c);
    // Laubfarben je Jahreszeit (Herbst: jeder Baum etwas anders)
    const autumn = [['#f0a43a', '#c8681e'], ['#e0532f', '#a8341d'], ['#ecc540', '#b88e1f'], ['#d97a2b', '#9f4e1a']];
    const leafOf = (i) => {
      if (snowG || dry || frost) return null;
      if (season === 'autumn') return autumn[i % autumn.length].map(dimC);
      if (season === 'spring') return ['#9be07a', '#5fb24c'].map(dimC);
      return null;
    };
    const mild = !w.rain && !w.snow && !w.hail && !w.storm && !w.fog;
    // Himmelsrichtungen wie auf einer Karte: Norden = oben im Bild (wie der Pfeil in der Wind-Anzeige).
    // Die Insel ist um 38° gedreht, deshalb wird die Windrichtung für Windrad und Windsack um 38° versetzt.
    const brg = o.bearing ?? 270;
    const dirX = Math.sin(((brg + 180) * Math.PI) / 180) >= 0 ? 1 : -1; // Windrichtung auf dem Bildschirm (links/rechts)
    const ms = o.windMs || 0;
    // Bäume wiegen sich ab frischem Wind in Windrichtung hin und her
    const amp = ms < 3.4 ? 0 : Math.min(11, 0.8 + (ms - 3.4) * 0.8);
    const sdur = n1(U.clamp(3.8 - ms * 0.13, 1.1, 3.8));
    const treeDefs = [
      ['pine', 0.2, 0.2, 0.22, 0.42], ['pine', 0.36, 0.1, 0.16, 0.3], ['round', 0.8, 0.22, 0.24, 0.31],
      ['pine', 0.15, 0.58, 0.18, 0.34], ['round', 0.86, 0.6, 0.17, 0.23], ['round', 0.9, 0.47, 0.19, 0.26], ['bush', 0.7, 0.5, 0.16, 0.1], ['bush', 0.07, 0.4, 0.16, 0.1],
      ['reed', 0.305, 0.73, 0.07, 0.1], ['reed', 0.74, 0.67, 0.065, 0.09], ['reed', 0.58, 0.86, 0.05, 0.065],
    ];
    const svgOf = { pine: W3D_PINE, round: W3D_ROUND, bush: W3D_BUSH, reed: W3D_REED };
    const trees = treeDefs.map(([k, x, y, ww, hh], i) => html`<div class="w3d-tree ${k}" style="--x:${x};--y:${y};--w:${ww};--h:${hh};${(k === 'round' || k === 'bush') && leafOf(i) ? `--c1:${leafOf(i)[0]};--c2:${leafOf(i)[1]}` : ''}"><i class="${a && amp ? 'on' : ''}" style="--amp:${n1(amp * (k === 'bush' ? 0.4 : k === 'reed' ? 1.6 : 1) * dirX)}deg;--dur:${n1(sdur * (0.85 + (i % 3) * 0.15))}s;animation-delay:-${n1(i * 0.7)}s">${raw(svgOf[k])}</i></div>`);
    // Windrad: Drehzahl nach Windstärke, Ausrichtung gegen die Windrichtung
    const spin = a ? n1(U.clamp(10 / (0.25 + ms / 1.8), 0.6, 16)) : 0;
    const yaw = Math.round(brg + 38 - 180);
    const blades = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><g stroke="#9aa8b6" stroke-width="1">'
      + [0, 120, 240].map(r => `<g transform="rotate(${r})"><path d="M-3.2 -4 Q-5.5 -28 -0.5 -48 Q4 -28 3.2 -4Z" fill="#fbfcfd"/><path d="M0 -4 Q4 -28 -0.5 -48 Q4 -28 3.2 -4Z" fill="#dfe6ec" stroke="none"/><path d="M-1.8 -38 Q-0.5 -49 1.6 -38Z" fill="#e5484d" stroke="none"/></g>`).join('')
      + '</g><circle r="6" fill="#eef2f6" stroke="#8d9aa8" stroke-width="1.4"/><circle r="2.6" fill="#e5484d"/></svg>';
    const mast = ['turbine', 'windsock', 'both'].includes(o.mast) ? o.mast : 'both';
    const turbine = mast === 'windsock' ? '' : html`<div class="w3d-tb" style="--x:0.66;--y:0.3;--yaw:${yaw}deg"><i class="pole"></i><i class="pole q"></i><div class="nac"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="e"></i><i class="f"></i></div><i class="nose"></i><i class="nose q"></i>${w.night ? html`<i class="beacon ${a ? 'on' : ''}"></i>` : ''}<div class="rotor"><span class="${a ? 'w3d-spin' : ''}" style="animation-duration:${spin}s">${raw(blades)}${[0, 120, 240].map(r => html`<i class="edge" style="--r:${r}deg"></i>`)}</span></div></div>`;
    // Billboard: steht auf dem Boden der Insel und ist immer zur Kamera gedreht
    const bb = (cls, x, y, ww, hh, inner, style = '') => html`<div class="w3d-bb ${cls}" style="--x:${x};--y:${y};--w:${ww};--h:${hh};${style}"><i>${inner}</i></div>`;
    const extras = [];
    // 1) Windsack: hängt bei Flaute, steht bei Sturm waagerecht, zeigt mit dem Wind
    const droop = n1(U.clamp(78 - ms * 10, 3, 78));
    const flap = n1(U.clamp(2.4 - ms * 0.12, 0.35, 2.4));
    if (mast !== 'turbine') extras.push(html`<div class="w3d-ws ${mast === 'windsock' ? 'big' : ''}" style="--x:${mast === 'windsock' ? 0.62 : 0.5};--y:${mast === 'windsock' ? 0.3 : 0.33};--yaw:${Math.round(brg + 38 + 90)}deg;--droop:${droop}deg;--flap:${flap}s">
      <i class="pole"></i><i class="pole q"></i><div class="sock ${a && ms > 0.5 ? 'on' : ''}"><i>${raw(W3D_SOCK)}</i><i class="h">${raw(W3D_SOCK)}</i></div></div>`);
    // 3) Schneemann bei Schnee
    if (snowG) extras.push(bb('snowman', 0.86, 0.9, 0.1, 0.15, raw(W3D_SNOWMAN)));
    // 8) Hütte am See – Fenster leuchten nachts / bei trübem Wetter, bei Kälte raucht der Schornstein
    const hutLit = w.night || w.storm || o.overcast;
    const hutCl = {
      wallR: dimC('#b98353'), wallL: dimC('#8f5f3a'), plank: dimC('#6e4628'), door: dimC('#5b3a22'),
      roof: dimC(snowG ? '#9c5a4a' : '#a8432d'), roofB: dimC('#7a2f20'), chim: dimC('#8c8f94'), chimTop: dimC('#6d7076'),
      win: hutLit ? '#ffcf6b' : dimC('#9fd3f2'), smoke: o.tempC !== null && o.tempC < 12,
    };
    const hutSvg = w3dHut(hutCl);
    const [chx, chy] = w3dHut.chimney;
    const puffs = hutCl.smoke ? [0, 1, 2, 3, 4, 5, 6].map(i => html`<b class="hs ${i % 2 ? 'd' : ''}" style="left:${chx}%;top:${n1((+chy + 80) / 1.8)}%;animation-delay:-${n1(i * 0.86)}s"></b>`) : '';
    extras.push(bb(`hut ${hutLit ? 'lit' : ''} ${snowG ? 'snow' : ''} ${a ? 'anim' : ''}`, 0.47, 0.55, 0.27, 0.486, html`${raw(hutSvg)}${puffs}`, `--sdx:${n1(dirX * (5 + ms * 1.4))}`));
    // 13) Enten bei schönem Wetter auf dem (nicht gefrorenen) See
    if (!w.night && mild && !ice && !dry && o.tempC !== null && o.tempC > 2) {
      extras.push(bb(`duck ${a ? 'on' : ''}`, 0.47, 0.76, 0.06, 0.04, raw(W3D_DUCK), '--sw:0s'));
      extras.push(bb(`duck ${a ? 'on' : ''}`, 0.58, 0.8, 0.05, 0.033, raw(W3D_DUCK), '--sw:-5s'));
    }
    // 13) Schmetterlinge im warmen Sommer
    if (!w.night && mild && o.tempC !== null && o.tempC >= 15 && ms < 6 && (season === 'summer' || season === 'spring')) {
      extras.push(bb(`fly ${a ? 'on' : ''}`, 0.3, 0.5, 0.07, 0.047, raw(W3D_FLY('#ffb43b')), '--fz:.12;--fd:7s;--fdl:0s'));
      extras.push(bb(`fly ${a ? 'on' : ''}`, 0.8, 0.48, 0.06, 0.04, raw(W3D_FLY('#7cc8ff')), '--fz:.16;--fd:9s;--fdl:-3s'));
    }
    // 6) Blitzeinschlag neben dem Windrad
    if (w.bolt) {
      let bx = 20, pts = '20,0';
      for (let y = 12; y < 100; y += 11) { bx = U.clamp(bx + R(-9, 9), 4, 36); pts += ` ${n1(bx)},${y}`; }
      pts += ' 20,100';
      extras.push(bb(`strike ${a ? 'on' : ''}`, 0.42, 0.3, 0.16, 1.15, raw(W3D_STRIKE(pts))));
    }
    // 2) Pfützen bei Regen / nassem Boden
    // erste Pfütze: groß, vorne links neben dem See (gut sichtbar); bei Starkregen kommt eine vierte dazu
    // [x, y, Breite, Höhe, Drehung] – die vordere ist schräg gestellt, damit die Pfützen nicht wie in einer Reihe liegen
    const puddleSpots = [[0.055, 0.735, 0.17, 0.11, 45], [0.115, 0.335, 0.17, 0.09, 0], [0.815, 0.375, 0.15, 0.08, 0], [0.295, 0.195, 0.13, 0.07, 0]];
    const puddles = (wet || (o.wetGround && !snowG && !dry && !ice)) ? puddleSpots.slice(0, w.heavy ? 4 : 3).map(([x, y, pw, ph, rot], i) => html`<i class="w3d-pud" style="left:${x * 100}%;top:${y * 100}%;width:${pw * 100}%;height:${ph * 100}%;${rot ? `transform:rotate(${rot}deg);` : ''}">${raw(W3D_PUD[i])}${wet && a ? html`<b class="w3d-rip on" style="left:${n1(R(40, 60))}%;top:${n1(R(42, 58))}%;animation-delay:-${n1(R(0, 2))}s"></b>` : ''}</i>`) : '';
    // 5) Bodennebel über der ganzen Wiese
    // (dichter über dem See; die früheren senkrechten See-Schwaden zerschnitten sich mit Hütte und Bäumen)
    const gfog = w.fog ? html`<div class="w3d-gfog ${a ? 'on' : ''}"><i></i><i class="b"></i><i class="lake"></i></div>` : '';
    const ripples = wet ? Array.from({ length: w.heavy ? 8 : 5 }, () => html`<i class="w3d-rip ${a ? 'on' : ''}" style="left:${n1(R(18, 84))}%;top:${n1(R(18, 86))}%;animation-delay:-${n1(R(0, 2))}s;animation-duration:${n1(R(1.1, 1.9))}s"></i>`) : '';
    const isle = o.landscape === false ? '' : html`<div class="w3d-isle-pos"><div class="w3d-shadow"></div>
      <div class="w3d-isle ${dry ? 'dry' : ''} ${snowG ? 'snowy' : ''} ${frost ? 'frosty' : ''} ${wet ? 'wet' : ''} ${ice ? 'ice' : ''} season-${snowG || dry || frost ? (season === 'winter' ? 'winter' : 'summer') : season} " style="--g1:${grass[0]};--g2:${grass[1]};--shore:${shore};--s1:${soil[0]};--s2:${soil[1]};--lip:${lip};--p1:${pine[0]};--p2:${pine[1]};--c1:${crown[0]};--c2:${crown[1]};--water:${water}">
        <div class="w3d-sides">${[0, 1, 2, 3].map(k => html`<div class="sd" style="transform:rotateZ(${k * 90}deg)"><b class="f"></b></div>`)}</div>
        <div class="w3d-top">${raw(W3D_POND, 'w3d-pond')}${puddles}${ripples}</div>
        ${gfog}${trees}${turbine}${extras}
      </div></div>`;

    // Nur die Insel (in der Sonnenstand-Kuppel): Himmel, Wolken, Niederschlag usw. zeichnet dort die Kuppel selbst
    if (o.isle) return { back: '', front: isle, over: '' };

    /* Niederschlag in 3D (Tiefe = Größe & Geschwindigkeit) */
    const prec = [];
    const slant = U.clamp(ms * 0.9, 0, 14);
    // Jede Tiefenebene ist EIN Element mit einer gekachelten Grafik voller Tropfen, die nach unten durchläuft –
    // statt jedem Tropfen ein eigenes 3D-Objekt zu geben (deutlich weniger Arbeit für den Browser)
    // Regenstärke: 0 leicht, 1 mäßig, 2 stark – bestimmt Tropfenzahl, Länge und Fallgeschwindigkeit
    const rLvl = w.heavy ? 2 : (o.rainLvl === 0 || o.rainLvl === 2 ? o.rainLvl : 1);
    const sheet = (kind, n, durs, col) => {
      [-140, -30, 70].forEach((z, li) => {
        const k = 1 + z / 500, cnt = Math.round(n / 3);
        let g = '';
        for (let j = 0; j < cnt; j++) {
          const x = n1(R(0, 100)), y = n1(R(0, 100));
          if (kind === 'rain') g += `<line x1="${x}" y1="${y}" x2="${x}" y2="${n1(+y + (4 + rLvl) * k)}"/>`;
          else g += `<line x1="${x}" y1="${y}" x2="${x}" y2="${n1(+y + 0.01)}"/>`;
        }
        const sw = kind === 'rain' ? n1(1.3 * k) : kind === 'snow' ? n1(R(3.4, 4.6) * k) : n1(3.4 * k);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="${col}" stroke-width="${sw}" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none">${g.replace(/<line /g, '<line vector-effect="non-scaling-stroke" ')}</g></svg>`;
        const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        const dur = n1(R(durs[0], durs[1]) / k);
        prec.push(html`<b class="w3d-ps ${kind} ${a ? 'on' : ''}" style="transform:translateZ(${z}px) skewX(${n1(slant * 2.2)}deg);opacity:${li === 0 ? 0.7 : 1}"><i style="background-image:${url};animation-duration:${dur}s;animation-delay:-${n1(R(0, +dur))}s"></i></b>`);
      });
    };
    const night = w.night;
    if (w.rain) sheet('rain', [34, 50, 72][rLvl], [[3, 3.8], [2.4, 3], [1.8, 2.3]][rLvl], o.scene ? (night ? '#a9bdd8' : '#e1f0ff') : '#467dc8');
    if (w.snow) sheet('snow', 34, [9, 13], '#ffffff');
    if (w.hail) sheet('hail', 26, [1.2, 1.7], '#f4f8ff');
    // 4) Blätter wirbeln bei starkem Wind / Sturm über die Insel
    if (a && ms >= 10.8 && !snowG) {
      const lc = season === 'autumn' ? ['#f0a43a', '#e0532f', '#ecc540', '#c8681e'] : season === 'winter' ? ['#a8865a', '#8a6a42'] : ['#6fbf4a', '#3f8f3a', '#9bd16a'];
      for (let i = 0; i < 12; i++) {
        prec.push(html`<b class="w3d-leaf" style="top:${n1(R(30, 88))}%;--dx:${dirX};transform:translateZ(${Math.round(R(-60, 80))}px)"><s style="animation-duration:${n1(R(2.2, 4) / Math.min(2, ms / 10))}s;animation-delay:-${n1(R(0, 4))}s"><i style="background:${lc[i % lc.length]};animation-duration:${n1(R(0.5, 1))}s;animation-delay:-${n1(R(0, 1))}s"></i></s></b>`);
      }
    }
    // 13) Vögel ziehen bei schönem Wetter über den Himmel
    if (a && !w.night && mild && ms < 9 && ['sunny', 'partlycloudy', 'windy'].includes(o.cond)) {
      // Nur ab und zu ein Überflug: lange, ungleiche Zyklen (Primzahl-ähnlich), der Flug selbst dauert nur ~15 % davon
      const cycles = [67, 97, 131];
      for (let i = 0; i < 3; i++) {
        const cyc = cycles[i] + R(0, 12);
        prec.push(html`<b class="w3d-bird" style="top:${n1(R(8, 26))}%;--dx:${i === 1 ? -1 : 1};transform:translateZ(${Math.round(R(-120, -20))}px)"><s style="animation-duration:${n1(cyc)}s;animation-delay:-${n1(R(0, cyc))}s"><i><svg viewBox="0 0 24 10" aria-hidden="true" style="animation-duration:${n1(R(0.35, 0.5))}s"><path d="M0 2 Q6 -1 12 6 Q18 -1 24 2" fill="none" stroke="#2d3540" stroke-width="1.8" stroke-linecap="round"/></svg></i></s></b>`);
      }
    }
    // Nebel (Schwaden vor der Szene)
    const fogs = w.fog ? Array.from({ length: 4 }, (_, i) => html`<b class="w3d-fg" style="top:${n1(34 + i * 15)}%;left:${n1(R(-30, 10))}%"><i class="${a ? 'on' : ''}" style="animation-duration:${n1(R(18, 34))}s;animation-delay:-${n1(R(0, 20))}s"></i></b>`) : '';
    // Blitz
    let bolt = '';
    if (w.bolt) {
      let x = R(40, 64), pts = `${n1(x)},4`;
      for (let y = 20; y <= 70; y += 12) { x += R(-7, 7); pts += ` ${n1(x)},${y}`; }
      bolt = html`<div class="w3d-bolt ${a ? 'on' : ''}" style="transform:translateZ(-60px)"><svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#fff7cc" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`;
    }
    // Himmel, Sterne, Sonne/Mond stehen fest (flach hinter der 3D-Bühne); nur Wolken, Insel & Wetter bewegen sich
    // 14) Regenbogen gegenüber der Sonne, wenn nach / bei Regen die Sonne scheint
    const bow = o.rainbow ? html`<div class="w3d-bow ${a ? 'on' : ''}">${raw('<svg viewBox="0 0 200 110" aria-hidden="true"><g fill="none" stroke-width="5">'
      + ['#ff4b4b', '#ff9a3c', '#ffe14d', '#5ed36a', '#4aa8ff', '#6a5cff', '#b45cff'].map((c, i) => `<path d="M${10 + i * 5} 110 A${90 - i * 5} ${90 - i * 5} 0 0 1 ${190 - i * 5} 110" stroke="${c}"/>`).join('') + '</g></svg>')}</div>` : '';
    const back = o.scene ? html`<div class="w3d-sky" style="background:linear-gradient(180deg,${w.sky[0]} 0%,${w.sky[1]} 55%,${w.sky[2]} 100%)">${raw(starsSvg)}</div>
      ${o.dusk ? html`<div class="w3d-dusk-glow"></div>` : ''}
      <div class="w3d-sun">${hasRays ? html`<div class="w3d-rays">${raw(raysSvg)}</div>` : ''}${raw(sunSvg)}</div>${bow}` : bow;
    // Nebelschwaden und Blitz-Aufhellung liegen flach über der Szene: mit den aufrechten Objekten der Insel
    // im selben 3D-Raum würde der Browser sie in eckige Stücke zerschneiden
    const over = html`${o.dusk && o.scene ? html`<div class="w3d-dusk"></div>` : ''}${fogs}${w.bolt && o.landscape !== false ? html`<div class="w3d-glow ${a ? 'on' : ''}"></div>` : ''}${w.bolt && o.scene ? html`<div class="w3d-flash ${a ? 'on' : ''}"></div>` : ''}`;
    return { back, front: html`${cl}${isle}${bolt}<div class="w3d-prec">${prec}</div>`, over };
  };

  TYPES.weather3d = {
    group: 'current', icon: 'mdi:cube-scan', w: 6, h: 5, minW: 3, minH: 3, titled: false, flush: true, style: 'none', accent: 'var(--primary-color)',
    fields: [
      F.entity('entity', 'f.temp_entity', { ...TEMP_SENS, inherit: fromSensors('temperature') }),
      F.bool('show_scene', 'f.w3d_scene', true),
      F.bool('show_landscape', 'f.w3d_landscape', true),
      F.bool('show_values', 'f.w3d_values', false),
      F.select('season', 'f.w3d_season', ['auto', 'spring', 'summer', 'autumn', 'winter'], 'auto'),
      F.select('wind_object', 'f.w3d_wind_object', ['both', 'turbine', 'windsock'], 'both'),
      F.bool('show_temp', 'f.w3d_temp', true),
      { ...F.bool('show_condition', 'f.show_condition', true), visible: el => el.show_temp !== false },
      { ...F.bool('show_feels_like', 'f.show_feels_like', true), visible: el => el.show_temp !== false },
      { ...F.bool('show_minmax', 'f.show_minmax', true), visible: el => el.show_temp !== false },
      { ...F.bool('temp_colors', 'f.temp_colors', true), visible: el => el.show_temp !== false },
      F.bool('show_wind', 'f.w3d_wind', true),
      F.bool('show_humidity', 'f.w3d_humidity', true),
      F.bool('show_pressure', 'f.w3d_pressure', true),
      F.bool('show_precip', 'f.w3d_precip', true),
      F.bool('show_uv', 'f.w3d_uv', true),
      F.bool('show_sun', 'f.w3d_sun', true),
      F.bool('show_visibility', 'f.w3d_visibility', false),
      F.bool('show_dew_point', 'f.w3d_dew', false),
      F.bool('show_clouds', 'f.w3d_clouds', false),
      F.bool('animated', 'f.animated', true),
    ],
    needs: (el) => ({
      condition: true, daily: true,
      fields: {
        temperature: 1, wind_speed: 1, wind_bearing: 1, humidity: 1, precipitation: 1, cloud_coverage: 1,
        ...(el.show_feels_like !== false ? { apparent_temperature: 1 } : {}),
        ...(el.show_wind !== false ? { wind_gust: 1 } : {}),
        ...(el.show_pressure !== false || el.show_values === true ? { pressure: 1 } : {}),
        ...(el.show_precip !== false ? { precipitation_probability: 1 } : {}),
        ...(el.show_uv !== false ? { uv_index: 1 } : {}),
        ...(el.show_visibility === true ? { visibility: 1 } : {}),
        ...(el.show_dew_point === true ? { dew_point: 1 } : {}),
        ...(el.show_clouds === true ? { cloud_coverage: 1 } : {}),
      },
    }),
    entity: (el, m) => el.entity || m.weatherId || (m.cur.temperature && m.cur.temperature.e),
    render(el, m, ctx) {
      const t = valOf(ctx, el, m, 'temperature');
      const tc = t ? tempC(t) : null;
      const anim = ctx.anim && el.animated !== false;
      const ws = m.cur.wind_speed, wb = m.cur.wind_bearing;
      const windMs = ws ? U.windToMs(ws.v, ws.u) : 0;
      const uid = `w3d${String(ctx.uid)}${String(el.id).replace(/[^a-z0-9]/gi, '')}`;
      const hum = m.cur.humidity;
      const o = {
        cond: m.condition || 'cloudy', night: !m.isDay, anim, windMs: Math.round(windMs), landscape: el.show_landscape !== false, scene: el.show_scene !== false,
        mast: el.wind_object || 'both', isle: el.isle_only === true,
        bearing: wb && U.isNum(wb.v) ? Math.round(((wb.v + (Number(el.bearing_offset) || 0)) % 360) / 10) * 10 : null, tempC: tc === null ? null : Math.round(tc),
        dry: tc !== null && (tc >= 27 || (tc >= 23 && hum && hum.v <= 35)),
        moonElong: m.moon ? Math.round(m.moon.elong / 5) * 5 : 180, southern: !!(m.loc && m.loc.lat < 0),
      };
      // Jahreszeit (Südhalbkugel umgedreht), nasser Boden nach Regen, Regenbogen
      const mon = ((m.now || new Date()).getMonth() + (o.southern ? 6 : 0)) % 12;
      o.season = ['spring', 'summer', 'autumn', 'winter'].includes(el.season) ? el.season
        : mon >= 2 && mon <= 4 ? 'spring' : mon >= 5 && mon <= 7 ? 'summer' : mon >= 8 && mon <= 10 ? 'autumn' : 'winter';
      const rainNow = ['rainy', 'pouring', 'lightning-rainy', 'snowy-rainy'].includes(o.cond);
      const curPr = m.cur.precipitation && U.isNum(m.cur.precipitation.v) ? m.cur.precipitation.v : 0;
      // Regenstärke aus der aktuellen Niederschlagsmenge (ohne Wert: mäßig)
      const prMm = curPr > 0 ? U.precToMm(curPr, m.cur.precipitation.u || m.units.precipitation) : 0;
      o.rainLvl = !rainNow ? null : prMm <= 0 ? 1 : prMm < 1 ? 0 : prMm < 4 ? 1 : 2;
      o.wetGround = rainNow || curPr > 0 || !!(m.today && U.isNum(m.today.precip) && m.today.precip >= 1 && hum && hum.v >= 80);
      const sunEl = m.sun && U.isNum(m.sun.el) ? m.sun.el : null;
      const ccov = m.cur.cloud_coverage && U.isNum(m.cur.cloud_coverage.v) ? m.cur.cloud_coverage.v : null;
      o.overcast = ccov !== null && ccov >= 95;
      // Sonnenauf- / -untergang: Sonne zwischen −6° und +7° über dem Horizont
      o.dusk = sunEl !== null && sunEl > -6 && sunEl < 7 ? (sunEl < 0 ? 'low' : 'high') : null;
      o.rainbow = !o.night && sunEl !== null && sunEl > 3 && sunEl < 42
        && ((o.cond === 'rainy' && ccov !== null && ccov < 85) || (['sunny', 'partlycloudy'].includes(o.cond) && (curPr > 0 || o.wetGround)));
      const key = JSON.stringify(o);
      let e = w3dCache.get(uid);
      if (!e || e.key !== key) e = remember(w3dCache, uid, { key, ...w3dScene(uid, o) }, 32);

      const color = el.temp_colors !== false && tc !== null ? U.tempColor(tc) : '#ffffff';
      const fl = m.cur.apparent_temperature;
      const chips = [];
      // Länge der Texte steuert die Schriftgröße, damit alles in der Karte bleibt
      const L = (v) => String(v).length;
      const chip = (icon, label, val, unit, sub, col) => chips.push(html`<div class="w3d-chip" style="--c:${col || '#fff'};--ll:${L(label) + 2.6};--len:${n1(L(val) + (unit ? L(unit) * 0.6 + 0.5 : 0))};--sl:${L(sub || '')}">
        <div class="w3d-cl-h"><ha-icon .icon=${icon}></ha-icon><span>${label}</span></div>
        <div class="w3d-cv"><b>${val}</b>${unit ? html`<small>${unit}</small>` : ''}</div>${sub ? html`<div class="w3d-cs">${sub}</div>` : ''}</div>`);
      if (el.show_wind !== false && ws) {
        const col = U.windColor(windMs), g = m.cur.wind_gust;
        const rot = wb && U.isNum(wb.v) ? (wb.v + 180) % 360 : null;
        const dir = wb && U.isNum(wb.v) ? ctx.t('compass')[Math.round(wb.v / 22.5) % 16] : '';
        const sub = [dir, g && U.isNum(g.v) ? `${ctx.t('w.gust')} ${ctx.f.num(g.v, 0)}` : ''].filter(Boolean).join(' · ');
        const v = ctx.f.num(ws.v, 0);
        chips.push(html`<div class="w3d-chip" style="--c:${col};--ll:${L(ctx.t('el.wind')) + 2.6};--len:${n1(L(v) + L(ws.u) * 0.6 + 0.5)};--sl:${L(sub)}">
          <div class="w3d-cl-h"><span class="w3d-arrow">${raw(`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${col}" fill-opacity=".25" stroke="${col}"/>${rot !== null ? `<g transform="rotate(${rot} 12 12)"><path d="M12 4.5 L16 15 L12 12.8 L8 15Z" fill="${col}"/></g>` : ''}</svg>`)}</span><span>${ctx.t('el.wind')}</span></div>
          <div class="w3d-cv"><b>${v}</b><small>${ws.u}</small></div>
          ${sub ? html`<div class="w3d-cs">${sub}</div>` : ''}</div>`);
      }
      if (el.show_humidity !== false && hum) chip('mdi:water-percent', ctx.t('el.humidity'), ctx.f.num(hum.v, 0), '%', '', '#7fd4ff');
      const pr = m.cur.pressure;
      if (el.show_pressure !== false && pr) chip('mdi:gauge', ctx.t('el.pressure'), ctx.f.num(U.pressToHpa(pr.v, pr.u), 0), 'hPa', '', '#c5b3ff');
      const pop = m.cur.precipitation_probability;
      if (el.show_precip !== false && (pop || U.isNum(m.today.precip))) {
        chip('mdi:umbrella-outline', ctx.t('el.precipitation'), pop ? ctx.f.num(pop.v, 0) : '–', pop ? '%' : '',
          U.isNum(m.today.precip) ? `${ctx.f.num(m.today.precip, 1)} ${m.units.precipitation}` : '', '#82b8ff');
      }
      const uvv = m.cur.uv_index ? m.cur.uv_index.v : m.today.uv;
      if (el.show_uv !== false && U.isNum(uvv)) {
        const ci = uvv < 3 ? 0 : uvv < 6 ? 1 : uvv < 8 ? 2 : uvv < 11 ? 3 : 4;
        chip('mdi:sun-wireless-outline', ctx.t('el.uv'), ctx.f.num(uvv, uvv < 10 ? 1 : 0), '', ctx.t('uv')[ci], U.uvColor(uvv));
      }
      if (el.show_sun !== false && m.sun && m.sun.rise && m.sun.set) {
        const lab = String(m.lang || '').startsWith('de') ? 'Sonne' : 'Sun';
        chips.push(html`<div class="w3d-chip" style="--c:#ffcf70;--ll:${L(lab) + 2.6};--len:8.5;--sl:0"><div class="w3d-cl-h"><ha-icon icon="mdi:weather-sunset"></ha-icon><span>${lab}</span></div>
          <div class="w3d-cv sm"><ha-icon icon="mdi:arrow-up-thin"></ha-icon><b>${ctx.f.time(m.sun.rise)}</b></div>
          <div class="w3d-cv sm"><ha-icon icon="mdi:arrow-down-thin"></ha-icon><b>${ctx.f.time(m.sun.set)}</b></div></div>`);
      }
      const vis = m.cur.visibility;
      if (el.show_visibility === true && vis) chip('mdi:eye-outline', ctx.t('el.visibility'), ctx.f.num(vis.v, vis.v < 10 ? 1 : 0), vis.u, '', '#b0c4d6');
      const dp = m.cur.dew_point;
      if (el.show_dew_point === true && dp) chip('mdi:thermometer-water', ctx.t('w.dew_point'), ctx.f.num(dp.v, 1), dp.u, '', '#7fe0d6');
      const cc = m.cur.cloud_coverage;
      if (el.show_clouds === true && cc) chip('mdi:cloud-outline', ctx.t('w.clouds'), ctx.f.num(cc.v, 0), '%', '', '#d5dde6');
      const n = chips.length;
      const showTemp = el.show_temp !== false;
      const hasHL = el.show_minmax !== false && (U.isNum(m.today.max) || U.isNum(m.today.min));
      // Werte direkt in der Grafik: Temperatur frei oben links (nur ohne Temperaturfeld),
      // daneben unten rechts eine kleine freie Liste mit Wind, Luftfeuchte und Luftdruck – ohne Linien und Boxen
      const tags = [];
      if (el.show_values === true) {
        if (!showTemp && t) tags.push(html`<div class="w3d-tag temp" style="--c:${color}"><b>${ctx.f.num(t.v, 1)}</b><small>${t.u}</small></div>`);
        const rows = [];
        const row = (col, icon, val, unit) => rows.push(html`<div class="w3d-vr" style="--c:${col}">${icon}<b>${val}</b><small>${unit}</small></div>`);
        // Werte, die schon als Karte angezeigt werden, nicht doppelt zeigen
        const dup = (k) => n > 0 && el[k] !== false;
        if (ws && !dup('show_wind')) {
          const rotT = wb && U.isNum(wb.v) ? (wb.v + 180) % 360 : null;
          const colT = U.windColor(windMs);
          row(colT, rotT !== null ? html`<span class="w3d-arrow">${raw(`<svg viewBox="0 0 24 24"><g transform="rotate(${rotT} 12 12)"><path d="M12 3 L17 16 L12 13 L7 16 Z" fill="${colT}"/></g></svg>`)}</span>` : html`<ha-icon icon="mdi:weather-windy"></ha-icon>`, ctx.f.num(ws.v, 0), ws.u);
        }
        if (hum && !dup('show_humidity')) row('#7fd4ff', html`<ha-icon icon="mdi:water-percent"></ha-icon>`, ctx.f.num(hum.v, 0), '%');
        const prv = m.cur.pressure;
        if (prv && !dup('show_pressure')) row('#c5b3ff', html`<ha-icon icon="mdi:gauge"></ha-icon>`, ctx.f.num(U.pressToHpa(prv.v, prv.u), 0), 'hPa');
        if (rows.length) tags.push(html`<div class="w3d-tag list">${rows}</div>`);
      }
      const mode = `${n === 0 ? 'solo' : ''} ${showTemp ? '' : 'notemp'} ${o.scene ? '' : 'noscene'} ${o.landscape ? '' : 'noland'} ${tags.length ? 'vals' : ''}`;
      return html`<div class="w3d ${anim ? 'anim' : ''} n${Math.min(n, 9)} ${mode}">
        ${e.back}
        <div class="w3d-stage"><div class="w3d-sway">
          ${e.front}
          <div class="w3d-ui">
            ${showTemp ? html`<div class="w3d-main w3d-glass" style="--tc:${color}">
              <div class="w3d-temp">${t ? ctx.f.num(t.v, 1) : '–'}<span>${t ? t.u : ''}</span></div>
              ${el.show_condition !== false ? html`<div class="w3d-cond">${condText(ctx, m.condition)}</div>` : ''}
              <div class="w3d-hl">
                ${el.show_feels_like !== false && fl ? html`<span>${ctx.t('w.feels_like')} <b>${tFmt(ctx, fl.v, 0)}</b></span>` : ''}
                ${hasHL ? html`<span class="hi"><ha-icon icon="mdi:arrow-up-thin"></ha-icon>${tFmt(ctx, m.today.max, 0)}</span><span class="lo"><ha-icon icon="mdi:arrow-down-thin"></ha-icon>${tFmt(ctx, m.today.min, 0)}</span>` : ''}
              </div>
            </div>` : html`<div></div>`}
            ${n ? html`<div class="w3d-chips">${chips}</div>` : ''}
          </div>
        </div></div>
        <div class="w3d-over ${n ? 'chips' : ''}">${e.over}</div>
        ${tags.length ? html`<div class="w3d-tags">${tags}</div>` : ''}
      </div>`;
    },
  };

  /* --- Temperatur ---------------------------------------------------------------------------- */
  TYPES.temperature = {
    group: 'measure', icon: 'mdi:thermometer', w: 2, h: 2, minW: 1, minH: 1, accent: 'var(--orange-color, #ff9800)',
    fields: [
      F.entity('entity', 'f.temp_entity', { ...TEMP_SENS, inherit: fromSensors(el => el.metric || 'temperature') }),
      F.select('metric', 'f.temp_metric', ['temperature', 'apparent_temperature', 'dew_point'], 'temperature'),
      F.bool('show_feels_like', 'f.show_feels_like', true),
      F.bool('temp_colors', 'f.temp_colors', true),
      F.bool('show_thermometer', 'f.show_thermometer', true),
      F.num('decimals', 'f.decimals', 1, 0, 2),
      F.bool('show_scene', 'f.show_scene', false),
    ],
    background: (el, m, ctx) => (el.show_scene === true ? scene(el, m, ctx) : ''),
    needs: (el) => ({ ...(el.show_scene === true ? { condition: true } : {}), fields: { [el.metric || 'temperature']: 1, apparent_temperature: 1, ...(el.show_scene === true ? { wind_speed: 1 } : {}) } }),
    label: (el, ctx) => (el.metric && el.metric !== 'temperature' ? ctx.t(`metric.${el.metric}`) : ctx.t('el.temperature')),
    entity: (el, m) => el.entity || (m.cur[el.metric || 'temperature'] || {}).e,
    render(el, m, ctx) {
      const t = valOf(ctx, el, m, el.metric || 'temperature');
      if (!t) return noData(ctx, 'mdi:thermometer-off');
      const c = tempC(t);
      const color = el.temp_colors !== false ? U.tempColor(c) : 'var(--primary-text-color)';
      const fl = m.cur.apparent_temperature;
      // Thermometer: Füllstand (-15 … 40 °C) und Farbe folgen der Temperatur, die Säule zeigt den Farbverlauf bis zum aktuellen Wert
      const TMIN = -15, TMAX = 40, Y0 = 60, Y1 = 6;
      const fill = U.clamp((c - TMIN) / (TMAX - TMIN), 0.03, 1);
      const yTop = Y0 - (Y0 - Y1) * fill;
      const tcol = el.temp_colors !== false ? U.tempColor(c) : 'var(--primary-text-color)';
      const tgid = `fwc-th-${String(ctx.uid)}-${String(el.id).replace(/[^a-z0-9_-]/gi, '')}`;
      let tstops = '';
      for (let i = 0; i <= 11; i++) { // Offsets aufsteigend: oben (warm) → unten (kalt)
        const v = TMAX - (TMAX - TMIN) * i / 11;
        tstops += `<stop offset="${((i / 11) * 100).toFixed(1)}%" stop-color="${el.temp_colors !== false ? U.tempColor(v) : 'currentColor'}"/>`;
      }
      let ticks = '';
      for (let v = -10; v <= 40; v += 10) {
        const y = Y0 - (Y0 - Y1) * ((v - TMIN) / (TMAX - TMIN));
        ticks += `<line x1="21.5" x2="${v % 20 === 0 ? 25.5 : 24}" y1="${n1(y)}" y2="${n1(y)}"/>`;
        if (v === 0 || v === 20 || v === 40) ticks += `<text x="27" y="${n1(y + 2)}" class="th-l">${v}</text>`;
      }
      const thermo = `<svg viewBox="0 0 36 80" class="thermo" aria-hidden="true">
        <defs><linearGradient id="${tgid}" x1="0" y1="${Y1}" x2="0" y2="${Y0}" gradientUnits="userSpaceOnUse">${tstops}</linearGradient></defs>
        <g stroke="currentColor" stroke-opacity=".45" stroke-width=".9">${ticks}</g>
        <rect x="9.5" y="2" width="11" height="62" rx="5.5" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".35" stroke-width="1.3"/>
        <circle cx="15" cy="69" r="9" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".35" stroke-width="1.3"/>
        <rect class="th-fill" x="12.2" y="${n1(yTop)}" width="5.6" height="${n1(66 - yTop)}" rx="2.8" fill="url(#${tgid})"/>
        <circle cx="15" cy="69" r="6.6" fill="${tcol}"/>
        <rect x="13" y="6" width="1.4" height="50" rx=".7" fill="#fff" opacity=".18"/>
      </svg>`;
      return html`<div class="big ${el.show_scene === true ? 'scene' : ''}">
        <div class="big-main">
          <div class="big-val" style="color:${color}">${ctx.f.num(t.v, pick(el.decimals, 1))}<span class="u">${t.u}</span></div>
          ${el.show_feels_like !== false && fl && (el.metric || 'temperature') === 'temperature' ? html`<div class="big-sub">${ctx.t('w.feels_like')} ${tFmt(ctx, fl.v, 0)}</div>` : ''}
        </div>
        ${el.show_thermometer !== false ? raw(thermo, 'big-gfx') : ''}
      </div>`;
    },
  };

  /* --- Min / Max ----------------------------------------------------------------------------- */
  TYPES.minmax = {
    group: 'measure', icon: 'mdi:thermometer-lines', w: 3, h: 1, minW: 2, minH: 1, accent: 'var(--orange-color, #ff9800)', titled: false,
    fields: [
      { ...F.entity('min_entity', 'f.min_entity', { domain: ['sensor', 'input_number'] }), inherit: fromSensors('temperature_min') },
      { ...F.entity('max_entity', 'f.max_entity', { domain: ['sensor', 'input_number'] }), inherit: fromSensors('temperature_max') },
      F.entity('entity', 'f.temp_entity', { ...TEMP_SENS, inherit: fromSensors('temperature') }),
      F.bool('show_current', 'f.show_current', true),
      F.bool('show_label', 'f.show_label', true),
      F.bool('show_times', 'f.show_minmax_times', true),
    ],
    needs: el => ({ ...(el.min_entity && el.max_entity ? {} : { daily: true, hourly: true }), fields: { temperature: 1 } }),
    entity: (el, m) => el.min_entity || el.max_entity || m.weatherId,
    render(el, m, ctx) {
      const num = id => (id && ctx.hass.states[id] ? U.toNum(ctx.hass.states[id].state) : null);
      const lo = el.min_entity ? num(el.min_entity) : m.today.min;
      const hi = el.max_entity ? num(el.max_entity) : m.today.max;
      if (!U.isNum(lo) || !U.isNum(hi)) return noData(ctx);
      const t = valOf(ctx, el, m, 'temperature');
      const u = (t && t.u) || (el.min_entity && ctx.hass.states[el.min_entity] && ctx.hass.states[el.min_entity].attributes.unit_of_measurement) || m.units.temperature;
      const cl = U.tempColor(U.toC(lo, u)), ch = U.tempColor(U.toC(hi, u));
      const pos = t && hi > lo ? U.clamp((t.v - lo) / (hi - lo), 0, 1) : null;
      // Uhrzeit von Tiefst-/Höchstwert aus der stündlichen Vorhersage (nur ohne eigene Entitäten)
      let tLo = null, tHi = null;
      if (el.show_times !== false) {
        const day = (m.hourlyAll || []).filter(f => U.sameDay(f.t, m.now) && U.isNum(f.temp));
        if (day.length > 3) {
          if (!el.min_entity) { const f = day.reduce((x, y) => (y.temp < x.temp ? y : x)); if (Math.abs(f.temp - lo) < 1) tLo = f.t; }
          if (!el.max_entity) { const f = day.reduce((x, y) => (y.temp > x.temp ? y : x)); if (Math.abs(f.temp - hi) < 1) tHi = f.t; }
        }
      }
      const sub = (key, d) => html`<small class="mm-sub">${ctx.t(key)}${d ? html` · ${ctx.f.time(d)}` : ''}</small>`;
      return html`<div class="mm">
        ${el.show_label !== false ? html`<span class="mm-lbl">${ctx.t('w.today')}</span>` : ''}
        <span class="mm-v lo"><span class="mm-top"><ha-icon icon="mdi:arrow-down-thin"></ha-icon><span class="mm-num">${tFmt(ctx, lo, 0)}</span></span>${sub('w.lowest', tLo)}</span>
        <span class="mm-bar" style="background: linear-gradient(90deg, ${cl}, ${ch})">
          ${el.show_current !== false && pos !== null ? html`<i style="left:${(pos * 100).toFixed(1)}%"><em class="mm-cur">${tFmt(ctx, t.v, 1)}</em></i>` : ''}
        </span>
        <span class="mm-v hi"><span class="mm-top"><ha-icon icon="mdi:arrow-up-thin"></ha-icon><span class="mm-num">${tFmt(ctx, hi, 0)}</span></span>${sub('w.highest', tHi)}</span>
      </div>`;
    },
  };

  /* --- Luftfeuchte --------------------------------------------------------------------------- */
  // Säulen-Ansicht im Stil von „Niederschlag“: Messrohr links, großer Wert, Zusatzwert rechts, Untertitel und Stundenbalken
  const columnView = (el, ctx, o) => {
    const top = 8 + 84 * (1 - U.clamp(o.fill, 0, 1));
    let ticks = '';
    for (let i = 0; i <= 4; i++) ticks += `<line x1="27" x2="${i % 2 ? 31 : 33}" y1="${n1(8 + 84 * i / 4)}" y2="${n1(8 + 84 * i / 4)}"/>`;
    const gid = `fwc-cg-${U.esc(el.id)}`;
    const body = o.fill > 0.01
      ? `<path class="${ctx.anim ? 'fwc-a-wave' : ''}" d="M-12 ${n1(top)} q 4 -2.2 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 V 96 H -12 Z" fill="url(#${gid}-f)"/>` : '';
    const gauge = `<svg viewBox="0 0 40 100" class="rg" aria-hidden="true">
      <defs><clipPath id="${gid}"><rect x="9" y="6" width="16" height="88" rx="5"/></clipPath>
        <linearGradient id="${gid}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}" stop-opacity=".95"/><stop offset="1" stop-color="${o.color2 || o.color}" stop-opacity=".95"/></linearGradient></defs>
      <rect x="9" y="6" width="16" height="88" rx="5" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".3" stroke-width="1.2"/>
      <g clip-path="url(#${gid})">${body}</g>
      <g stroke="currentColor" stroke-opacity=".45" stroke-width="1">${ticks}</g>
      ${o.max !== undefined ? `<text x="35" y="11" class="rg-l" text-anchor="middle">${o.max}</text>` : ''}
    </svg>`;
    return html`<div class="pr" style="--fwc-accent:${o.accent || o.color}">
      ${el.show_gauge !== false ? raw(gauge, 'pr-gfx') : ''}
      <div class="pr-main">
        <div class="pr-row">
          <div class="pr-val ${String(o.val).length >= 4 ? 'long' : ''}">${o.val}<span class="u">${o.unit}</span></div>
          ${o.badge ? html`<div class="pr-pop">${o.badge}</div>` : ''}
        </div>
        ${o.sub ? html`<div class="pr-sub">${o.sub}</div>` : ''}
        ${el.show_bars !== false && o.bars && o.bars.length ? html`<div class="pr-bars">${o.bars}</div>
          <div class="pr-axis"><span>${ctx.t('w.now')}</span><span>${ctx.t('w.next_hours', { n: o.bars.length })}</span></div>` : ''}
      </div>
    </div>`;
  };
  // Luftdruck in hPa (HA liefert je nach Einstellung hPa, mbar, kPa, inHg oder mmHg)
  const pressHpaGuess = (v) => (!U.isNum(v) ? null : v < 40 ? v * 33.8639 : v < 200 ? v * 10 : v < 900 ? v * 1.33322 : v);
  const COLUMN_FIELDS = () => [
    F.select('view', 'f.gauge_view', ['ring', 'column'], 'ring'),
    { ...F.num('hours', 'f.hours', 12, 3, 24), visible: el => el.view === 'column' },
    { ...F.bool('show_bars', 'f.show_bars', true), visible: el => el.view === 'column' },
    { ...F.bool('show_gauge', 'f.show_tube', true), visible: el => el.view === 'column' },
  ];

  const HUM_STOPS = [[0, '#ffb74d'], [30, '#ffd54f'], [40, '#81c784'], [60, '#4fc3f7'], [80, '#1e88e5'], [100, '#3949ab']];
  TYPES.humidity = {
    group: 'measure', icon: 'mdi:water-percent', w: 2, h: 2, minW: 1, minH: 2, accent: 'var(--light-blue-color, #03a9f4)',
    fields: [F.entity('entity', 'f.hum_entity', { domain: ['sensor', 'input_number'], device_class: 'humidity', inherit: fromSensors('humidity') }), ...COLUMN_FIELDS(), F.bool('show_dew_point', 'f.show_dew_point', true), F.bool('show_comfort', 'f.show_comfort', true)],
    needs: el => ({ fields: { humidity: 1, dew_point: 1 }, ...(el.view === 'column' ? { hourly: true, fhum: true } : {}) }),
    entity: (el, m) => el.entity || (m.cur.humidity || {}).e,
    render(el, m, ctx) {
      const h = valOf(ctx, el, m, 'humidity');
      if (!h) return noData(ctx, 'mdi:water-off-outline');
      const v = U.clamp(h.v, 0, 100);
      const color = U.scale(HUM_STOPS, v);
      if (el.view === 'column') {
        const dp = m.cur.dew_point;
        const ci = v < 20 ? 0 : v < 35 ? 1 : v < 60 ? 2 : v < 75 ? 3 : 4;
        const hours = m.hourly.slice(0, U.clamp(pick(el.hours, 12), 3, 48)).filter(f => f.hum !== null);
        const bars = hours.map(f => html`<i style="height:${Math.max(4, U.clamp(f.hum, 0, 100)).toFixed(0)}%;background:${U.scale(HUM_STOPS, f.hum)}" title="${ctx.f.hour(f.t)}: ${ctx.f.num(f.hum, 0)} %"></i>`);
        return columnView(el, ctx, {
          fill: v / 100, color: U.scale(HUM_STOPS, Math.min(100, v + 15)), color2: color, accent: color, max: 100,
          val: ctx.f.num(h.v, 0), unit: '%',
          badge: el.show_dew_point !== false && dp ? html`<ha-icon icon="mdi:thermometer-water"></ha-icon>${tFmt(ctx, dp.v, 1)}` : '',
          sub: el.show_comfort !== false ? ctx.t('humidity')[ci] : '',
          bars,
        });
      }
      const r = 40, C = 2 * Math.PI * r, arc = C * 0.75;
      const ring = `<svg viewBox="0 0 100 100" class="ring" aria-hidden="true">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="9" stroke-linecap="round" stroke-dasharray="${n1(arc)} ${n1(C)}" transform="rotate(135 50 50)"/>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${n1(arc * v / 100)} ${n1(C)}" transform="rotate(135 50 50)"/>
        <text x="50" y="54" text-anchor="middle" class="ring-val">${Math.round(v)}<tspan class="ring-u" dx="1">%</tspan></text>
        <g class="drop" transform="translate(50 76)"><path d="M0 -8 C 4 -2 6 1 6 3.5 A 6 6 0 0 1 -6 3.5 C -6 1 -4 -2 0 -8 Z" fill="${color}"/></g>
      </svg>`;
      const dp = m.cur.dew_point;
      const ci = v < 20 ? 0 : v < 35 ? 1 : v < 60 ? 2 : v < 75 ? 3 : 4;
      return html`<div class="gauge">
        ${raw(ring, 'gauge-gfx')}
        <div class="gauge-info">
          ${el.show_comfort !== false ? html`<div class="gi-main" style="color:${color}">${ctx.t('humidity')[ci]}</div>` : ''}
          ${el.show_dew_point !== false && dp ? html`<div class="gi-sub">${ctx.t('w.dew_point')} ${tFmt(ctx, dp.v, 1)}</div>` : ''}
        </div>
      </div>`;
    },
  };

  /* --- Luftdruck ----------------------------------------------------------------------------- */
  TYPES.pressure = {
    group: 'measure', icon: 'mdi:gauge', w: 2, h: 2, minW: 2, minH: 2, accent: 'var(--deep-purple-color, #673ab7)',
    fields: [
      ...COLUMN_FIELDS(),
      F.entity('entity', 'f.press_entity', { domain: ['sensor', 'input_number'], device_class: ['pressure', 'atmospheric_pressure'], inherit: fromSensors('pressure') }),
      F.num('min', 'f.press_min', 960, 900, 1000, 5, 'hPa'), F.num('max', 'f.press_max', 1060, 1020, 1100, 5, 'hPa'),
      F.bool('show_label', 'f.show_weather_label', true),
      F.bool('show_normal', 'f.show_press_normal', true),
    ],
    needs: el => ({ fields: { pressure: 1 }, ...(el.view === 'column' ? { hourly: true, fpress: true } : {}) }),
    entity: (el, m) => el.entity || (m.cur.pressure || {}).e,
    render(el, m, ctx) {
      const p = valOf(ctx, el, m, 'pressure');
      if (!p) return noData(ctx);
      const hpa = U.pressToHpa(p.v, p.u);
      const lo = pick(el.min, 960), hi = pick(el.max, 1060);
      const fr = U.clamp((hpa - lo) / (hi - lo), 0, 1);
      if (el.view === 'column') {
        const zonesC = [[990, '#5c6bc0'], [1005, '#29b6f6'], [1020, '#66bb6a'], [1035, '#ffca28'], [9999, '#ffa726']];
        const zcol = (x) => zonesC.find(([b]) => x < b)[1];
        const ciC = hpa < 990 ? 0 : hpa < 1005 ? 1 : hpa < 1020 ? 2 : hpa < 1035 ? 3 : 4;
        const hours = m.hourly.slice(0, U.clamp(pick(el.hours, 12), 3, 48)).map(f => ({ t: f.t, p: pressHpaGuess(f.press) })).filter(f => f.p !== null);
        // Balken zeigen den Verlauf: Bereich um die Werte herum, damit kleine Änderungen sichtbar werden
        const all = [hpa, ...hours.map(f => f.p)];
        const bLo = Math.min(...all) - 3, bHi = Math.max(...all) + 1;
        const bars = hours.map(f => html`<i style="height:${Math.max(4, (f.p - bLo) / (bHi - bLo) * 100).toFixed(0)}%;background:${zcol(f.p)}" title="${ctx.f.hour(f.t)}: ${ctx.f.num(f.p, 0)} hPa"></i>`);
        // Tendenz der nächsten 3 Stunden
        const h3 = hours.find(f => f.t.getTime() >= Date.now() + 2.5 * 3600e3);
        const dlt = h3 ? h3.p - hpa : null;
        const trendIcon = dlt === null ? '' : dlt > 0.6 ? 'mdi:trending-up' : dlt < -0.6 ? 'mdi:trending-down' : 'mdi:trending-neutral';
        const diffN = Math.round(hpa - 1013);
        const subTxt = [el.show_label !== false ? ctx.t('pressure')[ciC] : '', el.show_normal !== false ? `Normal${Math.abs(diffN) <= 1 ? '' : ` ${diffN > 0 ? '+' : '−'}${Math.abs(diffN)} hPa`}` : ''].filter(Boolean).join(' · ');
        return columnView(el, ctx, {
          fill: fr, color: zcol(hpa + 8), color2: zcol(hpa), accent: zcol(hpa),
          val: ctx.f.num(p.v, /inhg|psi/i.test(p.u) ? 2 : 0, 0, false), unit: p.u,
          badge: dlt !== null ? html`<ha-icon icon="${trendIcon}"></ha-icon>${dlt > 0 ? '+' : dlt < 0 ? '−' : '±'}${ctx.f.num(Math.abs(dlt), 1)}` : '',
          sub: subTxt, bars,
        });
      }
      // gleicher Ring wie bei der Luftfeuchte (270°), Farbzonen als Skala, Zeiger als Markierung am Ring
      const r = 40, C = 2 * Math.PI * r, arc = C * 0.75;
      const ang = f => (135 + f * 270) * Math.PI / 180;
      const pt = (f, rr) => [50 + Math.cos(ang(f)) * rr, 50 + Math.sin(ang(f)) * rr];
      const zones = [[960, 990, '#5c6bc0'], [990, 1005, '#29b6f6'], [1005, 1020, '#66bb6a'], [1020, 1035, '#ffca28'], [1035, 1070, '#ffa726']];
      let zs = '';
      zones.forEach(([a, b, c]) => {
        const f0 = U.clamp((a - lo) / (hi - lo), 0, 1), f1 = U.clamp((b - lo) / (hi - lo), 0, 1);
        if (f1 <= f0) return;
        const len = arc * (f1 - f0) - 1.2;
        if (len > 0) zs += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${c}" stroke-opacity=".9" stroke-width="9" stroke-dasharray="${n1(len)} ${n1(C)}" stroke-dashoffset="${n1(-arc * f0 - 0.6)}" transform="rotate(135 50 50)"/>`;
      });
      let ticks = '';
      for (let v = Math.ceil(lo / 10) * 10; v <= hi; v += 10) {
        const f = (v - lo) / (hi - lo);
        const major = v % 20 === 0;
        const a = pt(f, r - 7.5), b = pt(f, r - (major ? 12 : 10));
        ticks += `<line x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}" stroke-width="${major ? 1.3 : 0.8}"/>`;
      }
      const ci = hpa < 990 ? 0 : hpa < 1005 ? 1 : hpa < 1020 ? 2 : hpa < 1035 ? 3 : 4;
      const zc = (zones.find(([a, b]) => hpa >= a && hpa < b) || zones[hpa < 990 ? 0 : 4])[2];
      const mk = pt(fr, r), m1 = pt(fr - 0.022, r + 7.5), m2 = pt(fr + 0.022, r + 7.5), mi = pt(fr, r - 5.5);
      const dec = /inhg|psi/i.test(p.u) ? 2 : 0;
      const val = ctx.f.num(p.v, dec, 0, false);
      const fsz = String(val).length > 5 ? 15 : String(val).length > 4 ? 17 : 19;
      const ring = `<svg viewBox="0 0 100 100" class="ring" aria-hidden="true">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="9" stroke-linecap="round" stroke-dasharray="${n1(arc)} ${n1(C)}" transform="rotate(135 50 50)"/>
        ${zs}
        <g stroke="currentColor" stroke-opacity=".45">${ticks}</g>
        <path d="M ${n1(m1[0])} ${n1(m1[1])} L ${n1(mi[0])} ${n1(mi[1])} L ${n1(m2[0])} ${n1(m2[1])} Z" fill="var(--primary-text-color)" stroke="var(--fwc-tile-solid)" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="${n1(mk[0])}" cy="${n1(mk[1])}" r="2.2" fill="var(--fwc-tile-solid)"/>
        <text x="50" y="${n1(50 + fsz * 0.3)}" text-anchor="middle" class="ring-val" style="font-size:${fsz}px">${val}</text>
        <text x="50" y="${n1(50 + fsz * 0.3 + 11)}" text-anchor="middle" class="ring-u">${p.u}</text>
        <text x="27" y="93" text-anchor="middle" class="tick-l">${lo}</text><text x="73" y="93" text-anchor="middle" class="tick-l">${hi}</text>
      </svg>`;
      const diff = Math.round(hpa - 1013);
      // Abweichung vom mittleren Luftdruck (1013 hPa), kurz gehalten
      const normTxt = `Normal${Math.abs(diff) <= 1 ? '' : ` ${diff > 0 ? '+' : '−'}${Math.abs(diff)} hPa`}`;
      return html`<div class="gauge">
        ${raw(ring, 'gauge-gfx')}
        <div class="gauge-info">
          ${el.show_label !== false ? html`<div class="gi-main" style="color:${zc}">${ctx.t('pressure')[ci]}</div>` : ''}
          ${el.show_normal !== false ? html`<div class="gi-sub">${normTxt}</div>` : ''}
        </div>
      </div>`;
    },
  };

  /* --- Wind ---------------------------------------------------------------------------------- */
  TYPES.wind = {
    group: 'measure', icon: 'mdi:weather-windy', w: 3, h: 3, minW: 2, minH: 2, accent: 'var(--teal-color, #009688)',
    fields: [
      F.entity('entity', 'f.wind_entity', { domain: ['sensor', 'input_number'], device_class: 'wind_speed', inherit: fromSensors('wind_speed') }),
      F.entity('direction_entity', 'f.wind_dir_entity', { domain: ['sensor', 'input_number'], inherit: fromSensors('wind_bearing') }),
      F.entity('gust_entity', 'f.gust_entity', { domain: ['sensor', 'input_number'], device_class: 'wind_speed', inherit: fromSensors('wind_gust') }),
      F.bool('show_gust', 'f.show_gust', true),
      F.bool('show_beaufort', 'f.show_beaufort', true),
      F.bool('show_details', 'f.show_side', true),
    ],
    needs: () => ({ fields: { wind_speed: 1, wind_gust: 1, wind_bearing: 1 } }),
    entity: (el, m) => el.entity || (m.cur.wind_speed || {}).e,
    render(el, m, ctx) {
      const sp = valOf(ctx, el, m, 'wind_speed');
      const dirEl = el.direction_entity && ctx.hass.states[el.direction_entity];
      const dir = dirEl ? U.bearing(dirEl.state) : (m.cur.wind_bearing ? m.cur.wind_bearing.v : null);
      const gEl = el.gust_entity && ctx.hass.states[el.gust_entity];
      const gust = gEl ? { v: U.toNum(gEl.state), u: gEl.attributes.unit_of_measurement || '' } : m.cur.wind_gust;
      if (!sp && dir === null) return noData(ctx);
      const bft = sp ? U.msToBft(U.windToMs(sp.v, sp.u)) : 0;
      const color = U.BFT_COLORS[bft];
      const comp = ctx.t('compass');
      const cardinals = [comp[0], comp[4], comp[8], comp[12]];
      let ticks = '';
      for (let a = 0; a < 360; a += 10) {
        const r = a * A.RAD, major = a % 90 === 0, mid = a % 30 === 0;
        const r1 = major ? 37 : (mid ? 40 : 42);
        ticks += `<line x1="${n1(50 + Math.sin(r) * r1)}" y1="${n1(50 - Math.cos(r) * r1)}" x2="${n1(50 + Math.sin(r) * 45)}" y2="${n1(50 - Math.cos(r) * 45)}" stroke-width="${major ? 1.6 : 0.8}" stroke-opacity="${major ? 0.8 : (mid ? 0.5 : 0.3)}"/>`;
      }
      const labels = cardinals.map((c, i) => {
        const r = i * 90 * A.RAD;
        return `<text x="${n1(50 + Math.sin(r) * 30)}" y="${n1(50 - Math.cos(r) * 30 + 3.4)}" text-anchor="middle" class="cmp-l${i === 0 ? ' n' : ''}">${U.esc(c)}</text>`;
      }).join('');
      let arrow = '';
      if (dir !== null) {
        // Pfeil zeigt, wohin der Wind weht; Marker am Rand, woher er kommt
        arrow = `<g transform="rotate(${n1(dir)} 50 50)">`
          + `<line x1="50" y1="12" x2="50" y2="76" stroke="${color}" stroke-width="2.6" stroke-linecap="round" class="${ctx.anim ? 'fwc-a-flow' : ''}" stroke-dasharray="4 3"/>`
          + `<path d="M50 90 L43.5 77 L50 80 L56.5 77 Z" fill="${color}"/>`
          + `<circle cx="50" cy="9" r="3.6" fill="${color}" stroke="var(--fwc-tile-solid)" stroke-width="1.4"/></g>`;
      }
      const svg = `<svg viewBox="0 0 100 100" class="cmp" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>
        <g stroke="currentColor">${ticks}</g>${labels}${arrow}
        <circle cx="50" cy="50" r="17.5" fill="var(--fwc-tile-solid)" stroke="${color}" stroke-opacity=".55" stroke-width="1.4"/>
        <text x="50" y="${sp ? 51.5 : 54}" text-anchor="middle" class="cmp-v">${sp ? U.esc(ctx.f.num(sp.v, sp.v < 10 ? 1 : 0)) : '–'}</text>
        <text x="50" y="59.5" text-anchor="middle" class="cmp-u">${U.esc(sp ? sp.u : '')}</text>
      </svg>`;
      const dirTxt = dir !== null ? `${comp[Math.round(dir / 22.5) % 16]} · ${Math.round(dir)}°` : '';
      return html`<div class="wind">
        ${raw(svg, 'wind-gfx')}
        ${el.show_details !== false ? html`<div class="wind-info">
          ${dirTxt ? html`<div class="wi-row"><ha-icon icon="mdi:compass-outline"></ha-icon><span>${dirTxt}</span></div>` : ''}
          ${el.show_gust !== false && gust && U.isNum(gust.v) ? html`<div class="wi-row"><ha-icon icon="mdi:weather-windy-variant"></ha-icon><span>${ctx.t('w.gust')} <b>${ctx.f.num(gust.v, 0)}</b> ${gust.u}</span></div>` : ''}
          ${el.show_beaufort !== false && sp ? html`<div class="wi-bft"><i style="background:${color}"></i><span><b>${bft} ${ctx.t('w.beaufort')}</b> · ${ctx.t('beaufort')[bft]}</span></div>` : ''}
        </div>` : ''}
      </div>`;
    },
  };

  /* --- Sichtweite ---------------------------------------------------------------------------- */
  TYPES.visibility = {
    group: 'measure', icon: 'mdi:eye-outline', w: 3, h: 2, minW: 2, minH: 1, accent: 'var(--blue-grey-color, #607d8b)', titled: false, ownTitle: true,
    fields: [F.entity('entity', 'f.vis_entity', { domain: ['sensor', 'input_number'], device_class: 'distance', inherit: fromSensors('visibility') }), F.bool('show_label', 'f.show_label', true)],
    needs: () => ({ fields: { visibility: 1 } }),
    entity: (el, m) => el.entity || (m.cur.visibility || {}).e,
    render(el, m, ctx) {
      const vis = valOf(ctx, el, m, 'visibility');
      if (!vis) return noData(ctx, 'mdi:eye-off-outline');
      const km = U.lenToKm(vis.v, vis.u || 'km');
      const f = (dist) => U.clamp(km / dist, 0.04, 1);
      const layer = (dist, d, op) => `<path d="${d}" fill="currentColor" fill-opacity="${n1(op * f(dist))}"/>`;
      const ci = km < 0.2 ? 0 : km < 1 ? 1 : km < 4 ? 2 : km < 10 ? 3 : km < 20 ? 4 : km < 40 ? 5 : 6;
      const haze = U.clamp(1 - km / 10, 0, 0.85);
      const svg = `<svg viewBox="0 0 200 80" preserveAspectRatio="xMidYMax slice" class="vis-svg" aria-hidden="true">
        <defs><linearGradient id="fwc-vis-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64b5f6" stop-opacity=".16"/><stop offset="1" stop-color="#64b5f6" stop-opacity="0"/></linearGradient>
          <linearGradient id="fwc-vis-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0bec5" stop-opacity="0"/><stop offset=".45" stop-color="#b0bec5" stop-opacity=".9"/><stop offset="1" stop-color="#b0bec5"/></linearGradient></defs>
        <rect width="200" height="80" fill="url(#fwc-vis-sky)"/>
        ${layer(40, 'M0 52 L22 40 L40 46 L62 32 L84 44 L106 34 L132 46 L156 30 L178 42 L200 36 V80 H0 Z', 0.1)}
        ${layer(20, 'M0 58 Q30 44 60 54 T120 50 T200 52 V80 H0 Z', 0.14)}
        ${layer(8, 'M0 65 Q40 53 80 62 T150 60 T200 62 V80 H0 Z', 0.2)}
        ${layer(2, 'M0 73 Q50 64 100 71 T200 69 V80 H0 Z', 0.28)}
        <g fill="currentColor" fill-opacity="${n1(0.4 * f(1.5))}"><path d="M166 70 l5 -12 l5 12 Z"/><rect x="170" y="70" width="2" height="3"/><path d="M180 71 l4 -9 l4 9 Z"/><rect x="183" y="71" width="2" height="2.5"/></g>
        <rect y="26" width="200" height="54" fill="url(#fwc-vis-haze)" opacity="${n1(haze)}" class="${ctx.anim ? 'fwc-a-haze' : ''}"/>
      </svg>`;
      return html`<div class="vis">
        ${raw(svg, 'vis-gfx')}
        <div class="vis-txt">
          ${el.show_title !== false ? html`<div class="vis-lbl"><ha-icon icon="mdi:eye-outline"></ha-icon>${el.title || ctx.t('metric.visibility')}</div>` : ''}
          <div class="vis-val">${ctx.f.num(vis.v, vis.v < 10 ? 1 : 0)}<span class="u">${vis.u}</span></div>
          ${el.show_label !== false ? html`<div class="vis-cat">${ctx.t('visibility')[ci]}</div>` : ''}
        </div>
      </div>`;
    },
  };

  /* --- Niederschlag -------------------------------------------------------------------------- */
  TYPES.precipitation = {
    group: 'measure', icon: 'mdi:weather-pouring', w: 3, h: 2, minW: 2, minH: 2, accent: 'var(--blue-color, #2196f3)',
    fields: [
      F.entity('entity', 'f.precip_entity', { domain: ['sensor', 'input_number'], device_class: ['precipitation', 'precipitation_intensity'], inherit: fromSensors('precipitation') }),
      F.select('mode', 'f.precip_mode', ['today', 'current'], 'today'),
      F.num('hours', 'f.hours', 12, 3, 24),
      F.bool('show_bars', 'f.show_bars', true),
      F.bool('show_gauge', 'f.show_gauge', true),
    ],
    needs: (el) => ({ daily: true, hourly: true, fields: { precipitation_probability: 1, ...(el.mode === 'current' ? { precipitation: 1 } : {}) } }),
    entity: (el, m) => el.entity || m.weatherId,
    render(el, m, ctx) {
      const unit = m.units.precipitation;
      let amount = null, au = unit;
      if (el.entity && ctx.hass.states[el.entity]) {
        const s = ctx.hass.states[el.entity];
        amount = U.toNum(s.state); au = s.attributes.unit_of_measurement || unit;
      } else if (el.mode === 'current') {
        if (m.cur.precipitation) { amount = m.cur.precipitation.v; au = m.cur.precipitation.u; }
      } else {
        amount = m.today.precip;
      }
      const pop = m.cur.precipitation_probability;
      const hours = m.hourly.slice(0, U.clamp(pick(el.hours, 12), 3, 48));
      if (amount === null && !pop && !hours.length) return noData(ctx);
      const mm = amount !== null ? U.precToMm(amount, au) : 0;
      const scaleMax = [1, 2, 5, 10, 20, 50, 100, 200].find(s => s >= mm * 1.15) || 200;
      const fill = U.clamp(mm / scaleMax, 0, 1);
      const top = 8 + 84 * (1 - fill);
      let ticks = '';
      for (let i = 0; i <= 4; i++) ticks += `<line x1="27" x2="${i % 2 ? 31 : 33}" y1="${n1(8 + 84 * i / 4)}" y2="${n1(8 + 84 * i / 4)}"/>`;
      const wave = fill > 0.01 ? `<path class="${ctx.anim ? 'fwc-a-wave' : ''}" d="M-12 ${n1(top)} q 4 -2.2 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 V 96 H -12 Z" fill="url(#fwc-g-water)"/>` : '';
      const gauge = `<svg viewBox="0 0 40 100" class="rg" aria-hidden="true">
        <defs><clipPath id="fwc-rg-${U.esc(el.id)}"><rect x="9" y="6" width="16" height="88" rx="5"/></clipPath></defs>
        <rect x="9" y="6" width="16" height="88" rx="5" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".3" stroke-width="1.2"/>
        <g clip-path="url(#fwc-rg-${U.esc(el.id)})">${wave}</g>
        <g stroke="currentColor" stroke-opacity=".45" stroke-width="1">${ticks}</g>
        <text x="35" y="11" class="rg-l" text-anchor="middle">${scaleMax}</text>
      </svg>`;
      const maxP = Math.max(1, ...hours.map(f => U.precToMm(f.precip || 0, unit)));
      const bars = hours.map((f) => {
        const v = U.precToMm(f.precip || 0, unit);
        const h = v > 0 ? Math.max(6, v / maxP * 100) : 3;
        const op = f.pop !== null ? 0.35 + 0.65 * f.pop / 100 : 0.9;
        return html`<i style="height:${h.toFixed(0)}%;opacity:${op.toFixed(2)}" title="${ctx.f.hour(f.t)}: ${ctx.f.num(f.precip || 0, 1)} ${unit}${f.pop !== null ? ` · ${f.pop} %` : ''}"></i>`;
      });
      return html`<div class="pr">
        ${el.show_gauge !== false ? raw(gauge, 'pr-gfx') : ''}
        <div class="pr-main">
          <div class="pr-row">
            <div class="pr-val">${amount !== null ? ctx.f.num(amount, amount < 10 ? 1 : 0) : '–'}<span class="u">${amount !== null ? au : ''}</span></div>
            ${pop ? html`<div class="pr-pop"><ha-icon icon="mdi:umbrella-outline"></ha-icon>${ctx.f.num(pop.v, 0)} %</div>` : ''}
          </div>
          <div class="pr-sub">${el.mode === 'current' ? ctx.t('w.now') : ctx.t('w.today_sum')}</div>
          ${el.show_bars !== false && hours.length ? html`<div class="pr-bars">${bars}</div>
            <div class="pr-axis"><span>${ctx.t('w.now')}</span><span>${ctx.t('w.next_hours', { n: hours.length })}</span></div>` : ''}
        </div>
      </div>`;
    },
  };

  /* --- UV-Index ------------------------------------------------------------------------------ */
  TYPES.uv = {
    group: 'measure', icon: 'mdi:sun-wireless-outline', w: 3, h: 2, minW: 2, minH: 1, accent: 'var(--amber-color, #ffc107)',
    fields: [F.entity('entity', 'f.uv_entity', { domain: ['sensor', 'input_number'], inherit: fromSensors('uv_index') }), F.bool('show_hint', 'f.show_hint', true), F.bool('show_max', 'f.show_max', true)],
    needs: () => ({ daily: true, fields: { uv_index: 1 } }),
    entity: (el, m) => el.entity || (m.cur.uv_index || {}).e,
    render(el, m, ctx) {
      const uv = valOf(ctx, el, m, 'uv_index');
      if (!uv) return noData(ctx);
      const v = Math.max(0, uv.v);
      const ci = v < 3 ? 0 : v < 6 ? 1 : v < 8 ? 2 : v < 11 ? 3 : 4;
      const color = U.uvColor(v);
      const pos = U.clamp(v / 12, 0, 1) * 100;
      return html`<div class="uv">
        <div class="uv-top">
          <div class="uv-val" style="color:${color}">${ctx.f.num(v, v < 10 ? 1 : 0)}</div>
          <div class="uv-txt"><div class="uv-cat" style="color:${color}">${ctx.t('uv')[ci]}</div>
            ${el.show_hint !== false ? html`<div class="uv-hint">${ctx.t('uv_hint')[ci]}</div>` : ''}</div>
        </div>
        <div class="uv-scale"><i style="left:${pos.toFixed(1)}%"></i></div>
        ${el.show_max !== false && U.isNum(m.today.uv) ? html`<div class="uv-max">${ctx.t('w.max_today')}: <b>${ctx.f.num(m.today.uv, 0)}</b></div>` : ''}
      </div>`;
    },
  };

  /* --- Sonnenstand 3D ------------------------------------------------------------------------ */
  const domeCache = new Map();
  // Einstellungen für die Insel in der Sonnenstand-Kuppel: nur Insel, keine Szene, keine Werte
  const DOME_ISLE = el => ({
    id: `${el.id}-isle`, type: 'weather3d', show_scene: false, show_temp: false, show_values: false,
    show_wind: false, show_humidity: false, show_pressure: false, show_precip: false, show_uv: false, show_sun: false,
    wind_object: el.wind_object, season: el.season, animated: el.animated, bearing_offset: 180, isle_only: true,
  });
  TYPES.sun = {
    group: 'astro', icon: 'mdi:sun-angle-outline', w: 6, h: 4, minW: 3, minH: 3, accent: 'var(--amber-color, #ffc107)', titleDefault: false,
    fields: [
      F.bool('show_times', 'f.show_times', true),
      F.bool('show_track', 'f.show_track', true),
      F.bool('show_moon', 'f.show_moon', true),
      F.bool('weather_overlay', 'f.weather_overlay', true),
      F.bool('show_info', 'f.show_sun_info', false),
      F.bool('show_island', 'f.dome_island', false),
      F.bool('show_values', 'f.dome_values', false),
      { ...F.select('wind_object', 'f.w3d_wind_object', ['both', 'turbine', 'windsock'], 'both'), visible: el => el.show_island === true },
      { ...F.select('season', 'f.w3d_season', ['auto', 'spring', 'summer', 'autumn', 'winter'], 'auto'), visible: el => el.show_island === true },
    ],
    needs: (el) => {
      const n = el.show_island === true ? { ...TYPES.weather3d.needs(DOME_ISLE(el)), condition: true } : { condition: el.weather_overlay !== false };
      if (el.show_values === true) n.fields = { ...(n.fields || {}), temperature: 1, humidity: 1, pressure: 1, wind_speed: 1, wind_bearing: 1 };
      return n;
    },
    entity: (el, m) => (m.sun && m.sun.e) || null,
    render(el, m, ctx) {
      if (!m.sun || !m.loc) return noData(ctx, 'mdi:map-marker-off-outline');
      const uid = `fwcd-${String(ctx.uid)}-${String(el.id).replace(/[^a-z0-9_-]/gi, '')}`;
      const s = m.sun;
      const rise = el.show_times !== false ? ctx.f.time(s.nextRise) : '';
      const set = el.show_times !== false ? ctx.f.time(s.nextSet) : '';
      const overlay = el.weather_overlay !== false && m.condition && !['sunny', 'clear-night'].includes(m.condition) ? m.condition : '';
      const key = [Math.round((s.az || 0) * 2), Math.round((s.el || 0) * 2), Math.floor(m.now.getTime() / 300000), rise, set, overlay,
        el.show_track !== false, el.show_moon !== false, ctx.anim, ctx.lang].join('|');
      let svg = domeCache.get(uid);
      if (!svg || svg.key !== key) {
        const comp = ctx.t('compass');
        svg = {
          key,
          markup: domeSvg(uid, {
            now: m.now, lat: m.loc.lat, lon: m.loc.lon, southern: m.loc.lat < 0, sunAz: s.az, sunEl: s.el,
            showTimes: el.show_times !== false, showTrack: el.show_track !== false, showMoon: el.show_moon !== false,
            rise, set, moonRise: m.moon && m.moon.rise, formatTime: ctx.f.time, overlay, anim: ctx.anim,
            labels: { n: comp[0], e: comp[4], s: comp[8], w: comp[12] }, aria: ctx.t('el.sun'),
          }),
        };
        remember(domeCache, uid, svg);
      }
      // 3D-Insel aus „3D Wetter“ im Zentrum der Kuppel (Wolken/Regen zeigt die Kuppel selbst)
      const isle = el.show_island === true ? html`<div class="dome-isle">${TYPES.weather3d.render(DOME_ISLE(el), m, ctx)}</div>` : '';
      // Wetterwerte frei in den beiden oberen Ecken neben der Kuppel (dort ist durch die runde Form Platz) –
      // die Kuppel selbst wird dadurch nicht kleiner
      let vals = '';
      if (el.show_values === true) {
        const t = valOf(ctx, el, m, 'temperature');
        const tc = t ? tempC(t) : null;
        const rows = [];
        const row = (col, icon, val, unit) => rows.push(html`<div class="w3d-vr" style="--c:${col}">${icon}<b>${val}</b><small>${unit}</small></div>`);
        const ws = m.cur.wind_speed, wb = m.cur.wind_bearing, hum = m.cur.humidity, prv = m.cur.pressure;
        if (prv) row('#9d86e8', html`<ha-icon icon="mdi:gauge"></ha-icon>`, ctx.f.num(U.pressToHpa(prv.v, prv.u), 0), 'hPa');
        if (ws) {
          const colT = U.windColor(U.windToMs(ws.v, ws.u));
          const rotT = wb && U.isNum(wb.v) ? (wb.v + 180) % 360 : null;
          row(colT, rotT !== null ? html`<span class="w3d-arrow">${raw(`<svg viewBox="0 0 24 24"><g transform="rotate(${rotT} 12 12)"><path d="M12 3 L17 16 L12 13 L7 16 Z" fill="${colT}"/></g></svg>`)}</span>` : html`<ha-icon icon="mdi:weather-windy"></ha-icon>`, ctx.f.num(ws.v, 0), ws.u);
        }
        if (hum) row('#4fb3ea', html`<ha-icon icon="mdi:water-percent"></ha-icon>`, ctx.f.num(hum.v, 0), '%');
        vals = html`${t ? html`<div class="dome-temp" style="color:${tc !== null ? U.tempColor(tc) : 'var(--primary-text-color)'}"><b>${ctx.f.num(t.v, 1)}</b><small>${t.u}</small></div>` : ''}
          ${rows.length ? html`<div class="dome-vals">${rows}</div>` : ''}`;
      }
      return html`<div class="dome ${el.show_island === true ? 'has-isle' : ''} ${el.show_info ? 'info' : ''}">
        ${vals}
        ${isle ? html`<div class="dome-box">${raw(svg.markup, 'dome-gfx')}${isle}</div>` : raw(svg.markup, 'dome-gfx')}
        ${el.show_info ? html`<div class="dome-info"><span>${ctx.t('w.elevation')} <b>${ctx.f.num(s.el, 1)}°</b></span><span>${ctx.t('w.azimuth')} <b>${ctx.f.num(s.az, 0)}°</b></span></div>` : ''}
      </div>`;
    },
  };

  /* --- Sonnenauf- & -untergang --------------------------------------------------------------- */
  TYPES.sun_times = {
    group: 'astro', icon: 'mdi:weather-sunset', w: 3, h: 2, minW: 2, minH: 2, accent: 'var(--orange-color, #ff9800)',
    fields: [
      F.bool('show_day_length', 'f.show_day_length', true), F.bool('show_remaining', 'f.show_remaining', true),
      F.num('sun_size', 'f.sun_size', 100, 50, 250, 10, '%'),
      F.bool('animate_sun', 'f.animate_sun', false),
    ],
    needs: () => ({}),
    entity: (el, m) => (m.sun && m.sun.e) || null,
    render(el, m, ctx) {
      const s = m.sun;
      if (!s || !s.rise || !s.set) return noData(ctx, 'mdi:weather-sunset');
      const now = m.now.getTime();
      const dayLen = s.set - s.rise;
      const frac = U.clamp((now - s.rise) / dayLen, 0, 1);
      const isDay = now >= s.rise.getTime() && now <= s.set.getTime();
      // Bogen als Halbellipse von (14,62) nach (186,62)
      const pt = (f) => [100 - Math.cos(f * Math.PI) * 86, 62 - Math.sin(f * Math.PI) * 54];
      let d = '';
      for (let i = 0; i <= 40; i++) { const p = pt(i / 40); d += `${i ? ' L' : 'M'} ${n1(p[0])} ${n1(p[1])}`; }
      let past = '';
      const steps = Math.max(1, Math.round(frac * 40));
      for (let i = 0; i <= steps; i++) { const p = pt(frac * i / steps); past += `${i ? ' L' : 'M'} ${n1(p[0])} ${n1(p[1])}`; }
      const sp = pt(frac);
      // Sonnengröße (in %) und optionale Animation (Strahlen drehen sich, Schein pulsiert)
      const k = U.clamp(Number(el.sun_size) || 100, 50, 250) / 100;
      const anim = ctx.anim && el.animate_sun === true;
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = i * 30 * Math.PI / 180, r0 = 8 * k, r1 = (i % 2 ? 10.5 : 12) * k;
        rays += `<line x1="${n1(Math.cos(a) * r0)}" y1="${n1(Math.sin(a) * r0)}" x2="${n1(Math.cos(a) * r1)}" y2="${n1(Math.sin(a) * r1)}"/>`;
      }
      const sunG = `<g transform="translate(${n1(sp[0])} ${n1(sp[1])})">
          <circle r="${n1(12 * k)}" fill="url(#fwc-g-sunglow)" class="${anim ? 'st-pulse' : ''}"/>
          ${anim ? `<g class="st-rays" stroke="#ffc94a" stroke-width="${n1(1.3 * Math.sqrt(k))}" stroke-linecap="round">${rays}</g>` : ''}
          <circle r="${n1(5.5 * k)}" fill="url(#fwc-g-sun)"/></g>`;
      const svg = `<svg viewBox="0 0 200 70" class="st" aria-hidden="true" overflow="visible">
        <defs><linearGradient id="fwc-st-g" x1="0" x2="1"><stop offset="0" stop-color="#ffb74d"/><stop offset=".5" stop-color="#ffd54f"/><stop offset="1" stop-color="#ff8a65"/></linearGradient></defs>
        <path d="${d} Z" fill="#ffd54f" fill-opacity=".1"/>
        <path d="${d}" fill="none" stroke="#ffb74d" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="1.5 4" stroke-linecap="round"/>
        ${isDay ? `<path d="${past}" fill="none" stroke="url(#fwc-st-g)" stroke-width="3" stroke-linecap="round"/>` : ''}
        <line x1="4" x2="196" y1="62" y2="62" stroke="currentColor" stroke-opacity=".35" stroke-width="1.2"/>
        ${isDay ? sunG
        : `<circle cx="${now < s.rise ? 14 : 186}" cy="${n1(62 - 6 * k)}" r="${n1(5.5 * k)}" fill="url(#fwc-g-sun)" opacity=".35"/>`}
      </svg>`;
      const remaining = isDay ? s.set - now : null;
      return html`<div class="st-wrap">
        ${el.show_day_length !== false ? html`<div class="st-mid">${ctx.f.duration(dayLen)}${el.show_remaining !== false && remaining ? html`<small> · ${ctx.t('w.remaining')} ${ctx.f.duration(remaining)}</small>` : ''}</div>` : ''}
        ${raw(svg, 'st-gfx')}
        <div class="st-row">
          <span class="st-t"><ha-icon icon="mdi:weather-sunset-up"></ha-icon><b>${ctx.f.time(s.rise)}</b></span>
          <span class="st-t"><b>${ctx.f.time(s.set)}</b><ha-icon icon="mdi:weather-sunset-down"></ha-icon></span>
        </div>
      </div>`;
    },
  };

  /* --- Mond ---------------------------------------------------------------------------------- */
  TYPES.moon = {
    group: 'astro', icon: 'mdi:moon-waxing-crescent', w: 3, h: 2, minW: 2, minH: 2, accent: 'var(--blue-grey-color, #607d8b)',
    fields: [F.entity('entity', 'f.moon_entity', { domain: ['sensor'], inheritAuto: false, inherit: (el, cfg, hass) => (cfg && cfg.moon_entity) || (hass && hass.states['sensor.moon_phase'] ? 'sensor.moon_phase' : '') }), F.bool('show_times', 'f.show_times', true), F.bool('show_next', 'f.show_next_phase', true)],
    needs: () => ({}),
    entity: (el, m) => el.entity || (m.moon && m.moon.e) || null,
    render(el, m, ctx) {
      const mo = m.moon;
      if (!mo) return noData(ctx);
      let phase = mo.phase;
      if (el.entity && ctx.hass.states[el.entity]) phase = A.normalizePhase(ctx.hass.states[el.entity].state) || phase;
      const svg = `<svg viewBox="0 0 60 60" class="moon-svg" aria-hidden="true"><circle cx="30" cy="30" r="29" fill="url(#fwc-g-moonglow)" opacity=".7"/>${moonShape('', 30, 30, 22, mo.elong, m.loc && m.loc.lat < 0)}</svg>`;
      const full = mo.daysToFull, nw = mo.daysToNew;
      let next = '';
      if (full < 0.6 || full > 29) next = ctx.t('w.full_today');
      else if (nw < 0.6 || nw > 29) next = ctx.t('w.new_today');
      else next = full < nw ? ctx.t('w.full_in', { n: Math.round(full) }) : ctx.t('w.new_in', { n: Math.round(nw) });
      return html`<div class="moon">
        ${raw(svg, 'moon-gfx')}
        <div class="moon-info">
          <div class="moon-name">${ctx.t(`moon.${phase}`)}</div>
          <div class="moon-sub">${ctx.f.num(mo.illum * 100, 0)} % ${ctx.t('w.illuminated')}</div>
          ${el.show_times !== false && (mo.rise || mo.set) ? html`<div class="moon-times">
            ${mo.rise ? html`<span><ha-icon icon="mdi:arrow-up-thin"></ha-icon>${ctx.f.time(mo.rise)}</span>` : ''}
            ${mo.set ? html`<span><ha-icon icon="mdi:arrow-down-thin"></ha-icon>${ctx.f.time(mo.set)}</span>` : ''}</div>` : ''}
          ${el.show_next !== false ? html`<div class="moon-next">${next}</div>` : ''}
        </div>
      </div>`;
    },
  };

  /* --- Tagesvorhersage ----------------------------------------------------------------------- */
  const notList = el => (el.variant || 'auto') !== 'list';
  const notCols = el => (el.variant || 'auto') !== 'columns';

  // Horizontales Wischen: Inhalt wird breiter als die Kachel (n Punkte, davon vis sichtbar)
  const swipeOn = (el, n) => el.swipe !== false && n > Math.max(2, pick(el.visible, 0));
  const swipeWrap = (el, n, content) => (swipeOn(el, n)
    ? html`<div class="fwc-swipe"><div class="fwc-swipe-in" style="width:${((n / Math.max(2, pick(el.visible, n))) * 100).toFixed(2)}%">${content}</div></div>`
    : content);
  // Wischen ist immer aktiv (abschaltbar nur per YAML "swipe: false"): Anzahl Tage/Stunden bzw. Zeitraum = sichtbarer Bereich,
  // geladen werden alle verfügbaren Daten

  // Spalten-Ansicht (Tage oder Stunden): feste Zeilen, optional Kurven für Temperatur / Luftfeuchte, Regenbalken, Wind
  // items: { label, cond, day, temp, low, hum, precip, pop, wind, bearing }
  const columnsView = (el, m, ctx, items, anim) => {
    const n = items.length;
    const unit = m.units.temperature;
    const tempLine = el.show_temp_line === true;
    const humLine = el.show_humidity_line === true && items.some(d => U.isNum(d.hum));
    const rainBars = el.show_rain_bars !== false && items.some(d => (d.precip || 0) > 0);
    const windRow = el.show_wind === true && items.some(d => U.isNum(d.wind));
    const hasLow = items.some(d => U.isNum(d.low));
    const X = i => ((i + 0.5) / n) * 100;
    let chart = '';
    if (tempLine || humLine) {
      const TOP = 3, BOT = 97; // innerhalb der Plotfläche – Platz für Werte wird per Padding reserviert
      const lows = items.map(d => (U.isNum(d.low) ? d.low : d.temp)).filter(U.isNum);
      const highs = items.map(d => d.temp).filter(U.isNum);
      let lo = Math.min(...lows, ...highs), hi = Math.max(...highs, ...lows);
      if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
      const Y = v => BOT - ((v - lo) / (hi - lo)) * (BOT - TOP);
      const YH = v => BOT - (U.clamp(v, 0, 100) / 100) * (BOT - TOP);
      const paths = [];
      const dots = [];
      const gid = `fwc-fd-${String(ctx.uid)}-${String(el.id).replace(/[^a-z0-9_-]/gi, '')}`;
      const defs = `<defs>${tempGradient(gid, lo, hi, TOP, BOT, unit)}</defs>`;
      const nVis = swipeOn(el, n) ? pick(el.visible, n) : n;
      const every = nVis > 14 ? Math.ceil(nVis / 12) : 1;
      if (tempLine) {
        const hp = items.map((d, i) => (U.isNum(d.temp) ? [X(i), Y(d.temp)] : null)).filter(Boolean);
        const lp = items.map((d, i) => (U.isNum(d.low) ? [X(i), Y(d.low)] : null)).filter(Boolean);
        paths.push(`<path d="${U.smoothPath(hp)}" class="fdc-l hi" stroke="url(#${gid})"/>`);
        if (lp.length > 1) paths.push(`<path d="${U.smoothPath(lp)}" class="fdc-l lo ${el.animate_low && ctx.anim ? 'fwc-a-train' : ''}"/>`);
        const dc = v => U.tempColor(U.toC(v, unit));
        items.forEach((d, i) => {
          const lbl = i % every === 0;
          if (U.isNum(d.temp)) dots.push(html`<i class="fdc-dot hi" style="left:${X(i)}%;top:${Y(d.temp)}%;background:${dc(d.temp)}"></i>${lbl ? html`<span class="fdc-v hi" style="left:${X(i)}%;top:${Y(d.temp)}%">${tFmt(ctx, d.temp, hasLow ? 0 : (Math.abs(d.temp) < 10 ? 1 : 0))}</span>` : ''}`);
          if (U.isNum(d.low)) dots.push(html`<i class="fdc-dot lo" style="left:${X(i)}%;top:${Y(d.low)}%"></i>${lbl ? html`<span class="fdc-v lo" style="left:${X(i)}%;top:${Y(d.low)}%">${tFmt(ctx, d.low, 0)}</span>` : ''}`);
        });
      }
      if (humLine) {
        const pts = items.map((d, i) => (U.isNum(d.hum) ? [X(i), YH(d.hum)] : null)).filter(Boolean);
        if (pts.length > 1) paths.push(`<path d="${U.smoothPath(pts)}" class="fdc-l hum"/>`);
        items.forEach((d, i) => {
          if (!U.isNum(d.hum)) return;
          dots.push(html`<i class="fdc-dot hum" style="left:${X(i)}%;top:${YH(d.hum)}%"></i>`);
          if (!tempLine && i % every === 0) dots.push(html`<span class="fdc-v hum" style="left:${X(i)}%;top:${YH(d.hum)}%">${Math.round(d.hum)} %</span>`);
        });
      }
      const padTop = tempLine || humLine; // Werte stehen über den Punkten
      const padBot = tempLine && hasLow; // Tiefstwerte unter den Punkten
      chart = html`<div class="fdc-chart ${padTop ? 'pt' : ''} ${padBot ? 'pb' : ''}"><div class="fdc-plot">${raw(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="fdc-svg" aria-hidden="true">${defs}${paths.join('')}</svg>`)}${dots}</div></div>`;
    }
    const precMax = Math.max(1, ...items.map(d => U.precToMm(d.precip || 0, m.units.precipitation)));
    const row = (cls, fn) => html`<div class="fdc-row ${cls}">${items.map((d, i) => html`<span>${fn(d, i)}</span>`)}</div>`;
    const dense = (swipeOn(el, n) ? pick(el.visible, n) : n) > 10;
    const xdense = (swipeOn(el, n) ? pick(el.visible, n) : n) > 13;
    return swipeWrap(el, n, html`<div class="fdc ${chart ? 'has-chart' : ''} ${dense ? 'dense' : ''} ${xdense ? 'xdense' : ''}" style="--n:${n}">
      ${row('fdc-day', d => d.label)}
      ${row('fdc-ic', d => raw(iconSvg(d.cond, d.day !== false, anim)))}
      ${!tempLine ? row('fdc-hi', d => tFmt(ctx, d.temp, 0)) : ''}
      ${!tempLine && hasLow ? row('fdc-lo', d => (U.isNum(d.low) ? tFmt(ctx, d.low, 0) : '')) : ''}
      ${chart}
      ${rainBars ? html`<div class="fdc-bars">${items.map((d) => {
        const v = U.precToMm(d.precip || 0, m.units.precipitation);
        return html`<span>${v > 0 ? html`<small>${ctx.f.num(d.precip, 1)}</small><i style="height:${Math.max(8, (v / precMax) * 100).toFixed(0)}%;opacity:${d.pop !== null ? (0.45 + 0.55 * d.pop / 100).toFixed(2) : 0.9}"></i>` : ''}</span>`;
      })}</div>` : ''}
      ${el.show_precip !== false && el.show_pop !== false ? row('fdc-pop', d => (d.pop >= 10 ? (dense ? `${Math.round(d.pop)}` : `${Math.round(d.pop)} %`) : '')) : ''}
      ${windRow ? row('fdc-wind', d => windCell(ctx, m, d.wind, d.bearing)) : ''}
      ${humLine && tempLine ? html`<div class="fdc-legend"><span class="hi">${ctx.t('w.temp')}</span><span class="hum">${ctx.t('w.hum')}</span></div>` : ''}
    </div>`);
  };

  TYPES.forecast_daily = {
    group: 'forecast', icon: 'mdi:calendar-week', w: 6, h: 4, minW: 2, minH: 2, titleDefault: false, accent: 'var(--primary-color)',
    fields: [
      F.num('days', 'f.days', 5, 2, 16),
      F.select('variant', 'f.variant', ['auto', 'list', 'columns'], 'auto'),
      F.bool('show_precip', 'f.show_precip', true),
      { ...F.bool('show_bars', 'f.show_temp_bars', true), visible: notCols },
      { ...F.bool('show_temp_line', 'f.show_temp_line', false), visible: notList },
      { ...F.bool('show_humidity_line', 'f.show_humidity_line', false), visible: notList },
      { ...F.bool('animate_low', 'f.animate_low', false), visible: el => notList(el) && el.show_temp_line === true },
      { ...F.bool('show_rain_bars', 'f.show_rain_bars', true), visible: notList },
      { ...F.bool('show_pop', 'f.show_pop', true), visible: el => notList(el) && el.show_precip !== false },
      { ...F.bool('show_wind', 'f.show_wind_row', false), visible: notList },
      F.bool('animated', 'f.animated_icons', false),
    ],
    needs: el => ({ daily: true, fhum: el.show_humidity_line === true, fields: { temperature: 1 } }),
    entity: (el, m) => m.weatherId,
    render(el, m, ctx) {
      const nDays = U.clamp(pick(el.days, 5), 1, 16);
      const days = m.daily.slice(0, el.swipe !== false && el.variant !== 'list' ? 16 : nDays);
      if (!days.length) return m.onlinePending ? html`<div class="fwc-empty"><ha-icon icon="mdi:timer-sand"></ha-icon><span>${ctx.t('w.loading')}</span></div>` : noData(ctx);
      const unit = m.units.temperature;
      const lows = days.map(d => (U.isNum(d.low) ? d.low : d.temp)).filter(U.isNum);
      const highs = days.map(d => d.temp).filter(U.isNum);
      if (!highs.length) return noData(ctx);
      const gMin = Math.min(...lows), gMax = Math.max(...highs);
      const span = Math.max(1, gMax - gMin);
      const anim = ctx.anim && el.animated === true;
      const dayName = d => (U.sameDay(d.t, m.now) ? ctx.t('w.today') : ctx.f.weekday(d.t));
      const cur = m.cur.temperature;
      const v = el.variant || 'auto';
      const list = v === 'columns' ? '' : html`<div class="fd-list">${days.slice(0, nDays).map((d) => {
        const lo = U.isNum(d.low) ? d.low : d.temp;
        const a = ((lo - gMin) / span) * 100, b = ((d.temp - gMin) / span) * 100;
        const today = U.sameDay(d.t, m.now) && cur;
        return html`<div class="fd-row">
          <span class="fd-day">${dayName(d)}</span>
          <span class="fd-ic">${raw(iconSvg(d.cond, true, anim))}</span>
          <span class="fd-pop">${el.show_precip !== false && d.pop >= 10 ? `${Math.round(d.pop)} %` : ''}</span>
          <span class="fd-lo">${tFmt(ctx, lo, 0)}</span>
          ${el.show_bars !== false ? html`<span class="fd-bar"><span style="left:${a.toFixed(1)}%;right:${(100 - b).toFixed(1)}%;background:linear-gradient(90deg, ${U.tempColor(U.toC(lo, unit))}, ${U.tempColor(U.toC(d.temp, unit))})"></span>
            ${today ? html`<i style="left:${U.clamp(((cur.v - gMin) / span) * 100, 0, 100).toFixed(1)}%"></i>` : ''}</span>` : ''}
          <span class="fd-hi">${tFmt(ctx, d.temp, 0)}</span>
        </div>`;
      })}</div>`;
      const cols = v === 'list' ? '' : columnsView({ ...el, visible: pick(el.visible, nDays) }, m, ctx, days.map(d => ({
        label: dayName(d), cond: d.cond, day: true, temp: d.temp, low: d.low, hum: d.hum, precip: d.precip, pop: d.pop, wind: d.wind, bearing: d.bearing,
      })), anim);
      return html`<div class="fd v-${v}">${list}${cols}</div>`;
    },
  };

  /* --- Stundenvorhersage --------------------------------------------------------------------- */
  TYPES.forecast_hourly = {
    group: 'forecast', icon: 'mdi:clock-outline', w: 6, h: 2, minW: 2, minH: 2, titleDefault: false, accent: 'var(--primary-color)',
    fields: [
      F.num('hours', 'f.hours', 12, 3, 48), F.num('step', 'f.step', 1, 1, 6), F.bool('show_precip', 'f.show_precip', true),
      F.bool('show_chart', 'f.show_hourly_chart', false),
      { ...F.bool('show_humidity_line', 'f.show_humidity_line', false), visible: el => el.show_chart === true },
      { ...F.bool('show_rain_bars', 'f.show_rain_bars', true), visible: el => el.show_chart === true },
      { ...F.bool('show_pop', 'f.show_pop', true), visible: el => el.show_chart === true && el.show_precip !== false },
      { ...F.bool('show_wind', 'f.show_wind_row', false), visible: el => el.show_chart === true },
      F.bool('animated', 'f.animated_icons', false),
    ],
    needs: el => ({ hourly: true, fhum: el.show_chart === true && el.show_humidity_line === true }),
    entity: (el, m) => m.weatherId,
    render(el, m, ctx) {
      const step = U.clamp(pick(el.step, 1), 1, 12);
      const nHrs = U.clamp(pick(el.hours, 12), 1, 48);
      const hrs = m.hourly.filter((_, i) => i % step === 0).slice(0, el.swipe !== false ? 48 : nHrs);
      const vis = pick(el.visible, nHrs);
      if (!hrs.length) return m.onlinePending ? html`<div class="fwc-empty"><ha-icon icon="mdi:timer-sand"></ha-icon><span>${ctx.t('w.loading')}</span></div>` : noData(ctx);
      const anim = ctx.anim && el.animated === true;
      const lat = m.loc ? m.loc.lat : 50, lon = m.loc ? m.loc.lon : 10;
      const isDay = h => (m.loc ? A.sunPosition(h.t, lat, lon).alt > -0.8 : true);
      const label = (h, i) => (i === 0 && Math.abs(h.t - m.now) < 3600e3 ? ctx.t('w.now') : ctx.f.hour(h.t));
      if (el.show_chart === true) {
        return columnsView({ ...el, show_temp_line: true, visible: vis }, m, ctx, hrs.map((h, i) => ({
          label: label(h, i).replace(/:00(?=\s|$)/, ''), cond: h.cond, day: isDay(h), temp: h.temp, low: null, hum: h.hum, precip: h.precip, pop: h.pop, wind: h.wind, bearing: h.bearing,
        })), anim);
      }
      return html`<div class="fh fwc-swipe ${el.swipe !== false && hrs.length > vis ? 'sw' : ''}" style="--vis:${vis}">${hrs.map((h, i) => html`<div class="fh-col">
          <span class="fh-t">${label(h, i)}</span>
          <span class="fd-ic">${raw(iconSvg(h.cond, isDay(h), anim))}</span>
          <span class="fh-temp">${tFmt(ctx, h.temp, 0)}</span>
          ${el.show_precip !== false ? html`<span class="fh-pop">${h.pop >= 10 ? `${Math.round(h.pop)} %` : (h.precip > 0 ? `${ctx.f.num(h.precip, 1)}` : '')}</span>` : ''}
        </div>`)}</div>`;
    },
  };

  /* --- Temp.- & Luftfeuchteverlauf ---------------------------------------------------------- */
  TYPES.chart = {
    group: 'forecast', icon: 'mdi:chart-bell-curve-cumulative', w: 6, h: 3, minW: 3, minH: 2, accent: 'var(--orange-color, #ff9800)',
    fields: [
      F.select('series', 'f.series', ['temperature', 'temperature_humidity'], 'temperature'),
      F.select('range', 'f.range', ['12', '24', '48', 'daily'], '24'),
      F.bool('show_precip', 'f.show_precip_bars', true),
      F.bool('show_values', 'f.show_values', true),
      F.bool('show_now', 'f.show_now', true),
    ],
    needs: el => ({ ...(el.range === 'daily' ? { daily: true } : { hourly: true }), fhum: el.series === 'temperature_humidity' }),
    entity: (el, m) => m.weatherId,
    headExtra: (el, m, ctx) => (el.series === 'temperature_humidity' ? html`<span class="ch-legend"><i class="t"></i>${ctx.t('w.temp')}<i class="h"></i>${ctx.t('w.hum')}</span>` : ''),
    render(el, m, ctx) {
      const daily = el.range === 'daily';
      const withHum = el.series === 'temperature_humidity';
      const rangeH = U.clamp(parseInt(el.range || '24', 10) || 24, 6, 48);
      const sw = el.swipe !== false;
      const pts = daily ? m.daily.slice(0, sw ? 16 : 8) : m.hourly.slice(0, (sw ? 48 : rangeH) + 1);
      el = { ...el, visible: pick(el.visible, daily ? 7 : rangeH + 1) };
      const data = pts.filter(p => U.isNum(p.temp));
      if (data.length < 2) return m.onlinePending ? html`<div class="fwc-empty"><ha-icon icon="mdi:timer-sand"></ha-icon><span>${ctx.t('w.loading')}</span></div>` : noData(ctx);
      const unit = m.units.temperature;
      const vals = data.map(p => p.temp).concat(daily ? data.map(p => p.low).filter(U.isNum) : []);
      let lo = Math.min(...vals), hi = Math.max(...vals);
      if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
      const TOP = 22, BOT = 78; // Kurvenbereich in % (oben Platz für Werte, unten für Regen)
      const X = i => (data.length === 1 ? 50 : 3 + (i / (data.length - 1)) * 94);
      const Y = v => BOT - ((v - lo) / (hi - lo)) * (BOT - TOP);
      const YH = v => BOT - (U.clamp(v, 0, 100) / 100) * (BOT - TOP);
      const line = data.map((p, i) => [X(i), Y(p.temp)]);
      const lineLow = daily ? data.map((p, i) => [X(i), Y(U.isNum(p.low) ? p.low : p.temp)]) : null;
      const d = U.smoothPath(line);
      const area = daily ? `${d} L ${U.smoothPath([...lineLow].reverse()).slice(1)} Z` : `${d} L ${n1(line[line.length - 1][0])} 100 L ${n1(line[0][0])} 100 Z`;
      const gid = `fwc-ch-${String(ctx.uid)}-${String(el.id).replace(/[^a-z0-9_-]/gi, '')}`;
      const precMax = Math.max(1, ...data.map(p => U.precToMm(p.precip || 0, m.units.precipitation)));
      const bw = Math.min(6, 80 / data.length);
      const bars = el.show_precip !== false ? data.map((p, i) => {
        const v = U.precToMm(p.precip || 0, m.units.precipitation);
        if (v <= 0) return '';
        const h = Math.max(1.5, (v / precMax) * 18);
        return `<rect x="${n1(X(i) - bw / 2)}" y="${n1(100 - h)}" width="${n1(bw)}" height="${n1(h)}" rx="0.8" fill="var(--fwc-rain, #42a5f5)" opacity="${n1(p.pop !== null ? 0.35 + 0.6 * p.pop / 100 : 0.8)}"/>`;
      }).join('') : '';
      const humPts = withHum ? data.map((p, i) => (U.isNum(p.hum) ? [X(i), YH(p.hum)] : null)).filter(Boolean) : [];
      const svg = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ch-svg" aria-hidden="true">
        <defs>${tempGradient(gid, lo, hi, TOP, BOT, unit)}</defs>
        ${[TOP, (TOP + BOT) / 2, BOT].map(y => `<line x1="0" x2="100" y1="${y}" y2="${y}" class="ch-grid"/>`).join('')}
        ${bars}
        <path d="${area}" fill="url(#${gid})" opacity="${daily ? 0.35 : 0.18}"/>
        ${humPts.length > 1 ? `<path d="${U.smoothPath(humPts)}" class="ch-hum"/>` : ''}
        <path d="${d}" fill="none" stroke="url(#${gid})" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        ${daily ? `<path d="${U.smoothPath(lineLow)}" fill="none" stroke="url(#${gid})" stroke-width="2" opacity=".75" vector-effect="non-scaling-stroke"/>` : ''}
      </svg>`;
      // Beschriftungen (HTML, damit Schrift nicht verzerrt wird)
      const wcells = (el.w || 6) * (swipeOn(el, data.length) ? data.length / pick(el.visible, data.length) : 1);
      const every = Math.ceil(data.length / Math.max(3, Math.min(data.length, Math.round(wcells * 1.4))));
      const everyX = Math.ceil(data.length / Math.max(2, Math.min(data.length, Math.round(wcells * (daily ? 1.4 : 1.1)))));
      const iMax = data.reduce((b, p, i) => (p.temp > data[b].temp ? i : b), 0);
      const iMin = data.reduce((b, p, i) => (p.temp < data[b].temp ? i : b), 0);
      const labels = el.show_values !== false ? data.map((p, i) => {
        if (i % every !== 0 && i !== iMax && i !== iMin) return '';
        if (i !== iMax && i !== iMin && (Math.abs(i - iMax) < every || Math.abs(i - iMin) < every)) return '';
        const cls = i === iMax ? 'max' : (i === iMin ? 'min' : '');
        return html`<span class="ch-v ${cls}" style="left:${X(i).toFixed(1)}%;top:${Y(p.temp).toFixed(1)}%">${tFmt(ctx, p.temp, 0)}</span>`;
      }) : '';
      const humLabels = withHum && el.show_values !== false ? data.map((p, i) => (U.isNum(p.hum) && i % (every * 2) === Math.floor(every / 2)
        ? html`<span class="ch-v hum" style="left:${X(i).toFixed(1)}%;top:${YH(p.hum).toFixed(1)}%">${Math.round(p.hum)} %</span>` : '')) : '';
      const xl = data.map((p, i) => (i % everyX === 0
        ? html`<span class="${(i / everyX) % 2 ? 'alt' : ''}" style="left:${X(i).toFixed(1)}%">${daily ? (U.sameDay(p.t, m.now) ? ctx.t('w.today') : ctx.f.weekday(p.t)) : ctx.f.hour(p.t)}</span>` : ''));
      const nowX = !daily && el.show_now !== false && data.length > 1 ? X(U.clamp((m.now - data[0].t) / (data[1].t - data[0].t), 0, data.length - 1)) : null;
      return swipeWrap(el, data.length, html`<div class="ch">
        <div class="ch-plot">${raw(svg, 'ch-gfx')}${labels}${humLabels}
          ${nowX !== null ? html`<i class="ch-now" style="left:${nowX.toFixed(1)}%"></i>` : ''}
          ${daily ? data.map((p, i) => (U.isNum(p.low) && (i % every === 0) ? html`<span class="ch-v low" style="left:${X(i).toFixed(1)}%;top:${Y(p.low).toFixed(1)}%">${tFmt(ctx, p.low, 0)}</span>` : '')) : ''}
        </div>
        <div class="ch-x">${xl}</div>
      </div>`);
    },
  };

  /* --- Wetterwarnungen ----------------------------------------------------------------------- */
  const WARN_COLORS = ['#66bb6a', '#fdd835', '#fb8c00', '#e53935', '#8e24aa'];
  const warnIcon = (w) => {
    const s = `${w.event || ''} ${w.headline || ''}`.toUpperCase();
    if (/GEWITTER|THUNDER|BLITZ/.test(s)) return 'mdi:weather-lightning';
    if (/STURM|ORKAN|WIND|BÖ|BOE|GUST|GALE|STORM/.test(s)) return 'mdi:weather-windy';
    if (/SCHNEE|SNOW|SCHNEEVERWEH/.test(s)) return 'mdi:weather-snowy-heavy';
    if (/GLÄTTE|GLATTEIS|ICE|ICY|GLAZE/.test(s)) return 'mdi:snowflake-alert';
    if (/FROST/.test(s)) return 'mdi:snowflake-thermometer';
    if (/REGEN|RAIN|DAUERREGEN|FLOOD|HOCHWASSER/.test(s)) return 'mdi:weather-pouring';
    if (/HITZE|HEAT/.test(s)) return 'mdi:thermometer-high';
    if (/NEBEL|FOG/.test(s)) return 'mdi:weather-fog';
    if (/UV/.test(s)) return 'mdi:sun-wireless';
    if (/TAU|THAW/.test(s)) return 'mdi:water-thermometer';
    return 'mdi:alert-outline';
  };
  TYPES.warnings = {
    group: 'current', icon: 'mdi:alert-outline', w: 6, h: 2, minW: 2, minH: 1, accent: 'var(--warning-color, #ffa600)',
    fields: [
      { key: 'entities', type: 'entities', label: 'f.warn_entities', domain: ['sensor', 'binary_sensor'],
        inherit: (el, cfg, hass) => ((cfg && cfg.warning_entities && cfg.warning_entities.length) ? cfg.warning_entities : (hass ? FWC_MODEL.autoWarningEntities(hass) : [])) },
      F.bool('online', 'f.warn_online', true),
      F.num('max', 'f.warn_max', 3, 1, 10),
      F.bool('expanded', 'f.warn_expanded', false),
      F.bool('hide_when_empty', 'f.hide_when_empty', false),
      F.bool('show_region', 'f.show_region', true),
    ],
    needs: (el) => ({ warnings: { entities: el.entities || [], online: el.online !== false } }),
    entity: el => (el.entities && el.entities[0]) || null,
    isEmpty: (el, m) => el.hide_when_empty === true && Array.isArray(m.warnings) && m.warnings.length === 0,
    // aufgeklappte Warnung: die Box wächst nach unten über die Elemente darunter, bis der Text ganz zu lesen ist
    grow: (el, m, ctx) => !ctx.design && Array.isArray(m.warnings) && m.warnings.slice(0, U.clamp(pick(el.max, 3), 1, 20))
      .some((w, i) => { const key = `${el.id}|${i}|${w.headline}`; return (w.description || w.instruction) && (el.expanded === true ? !ctx.expanded.has(key) : ctx.expanded.has(key)); }),
    headExtra: (el, m) => html`${el.show_region !== false && m.warnRegion && m.warnings && m.warnings.length ? html`<span class="wn-region">${m.warnRegion}</span>` : ''}${m.warnings && m.warnings.length ? html`<span class="badge" style="background:${WARN_COLORS[Math.min(4, Math.max(...m.warnings.map(w => w.level)))]}">${m.warnings.length}</span>` : ''}`,
    render(el, m, ctx) {
      if (m.warnings === null) {
        return html`<div class="fwc-empty"><ha-icon icon="mdi:shield-off-outline"></ha-icon><span>${ctx.t('w.no_data')}</span></div>`;
      }
      const list = m.warnings.slice(0, U.clamp(pick(el.max, 3), 1, 20));
      if (!list.length) {
        return html`<div class="wn-ok"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div><b>${ctx.t('w.no_warnings')}</b>
          ${el.show_region !== false && m.warnRegion ? html`<small>${m.warnRegion}</small>` : ''}</div></div>`;
      }
      const span = (w) => {
        const s = U.toDate(w.start), e = U.toDate(w.end);
        const fmt = (d) => (U.sameDay(d, m.now) ? ctx.f.time(d) : `${ctx.f.weekday(d)} ${ctx.f.time(d)}`);
        if (s && e) return `${fmt(s)} – ${fmt(e)}`;
        if (e) return `${ctx.t('w.until')} ${fmt(e)}`;
        if (s) return `${ctx.t('w.from')} ${fmt(s)}`;
        return '';
      };
      return html`<div class="wn">${list.map((w, i) => {
        const key = `${el.id}|${i}|${w.headline}`;
        const open = el.expanded === true ? !ctx.expanded.has(key) : ctx.expanded.has(key);
        const color = w.color || WARN_COLORS[U.clamp(w.level, 1, 4)];
        return html`<div class="wn-it ${open ? 'open' : ''}" style="--wc:${color}" @click=${(e) => { e.stopPropagation(); ctx.toggleExpand(key); }}>
          <ha-icon class="wn-ic" .icon=${warnIcon(w)}></ha-icon>
          <div class="wn-txt">
            <div class="wn-h">${w.headline || w.event}${w.advance ? html` <small class="wn-adv">${ctx.t('w.advance')}</small>` : ''}</div>
            <div class="wn-t">${span(w)}${w.level ? html` · ${ctx.t('warn_level')[U.clamp(w.level, 0, 4)]}` : ''}</div>
            ${open && w.description ? html`<div class="wn-d">${w.description}</div>` : ''}
            ${open && w.instruction ? html`<div class="wn-d wn-i"><b>${ctx.t('w.instructions')}:</b> ${w.instruction}</div>` : ''}
          </div>
          ${w.description ? html`<ha-icon class="wn-chev" icon="mdi:chevron-down"></ha-icon>` : ''}
        </div>`;
      })}</div>`;
    },
  };

  /* --- Messwert ------------------------------------------------------------------------------ */
  const METRIC_ICONS = {
    temperature: 'mdi:thermometer', apparent_temperature: 'mdi:thermometer-lines', dew_point: 'mdi:thermometer-water',
    humidity: 'mdi:water-percent', pressure: 'mdi:gauge', wind_speed: 'mdi:weather-windy', wind_gust: 'mdi:weather-windy-variant',
    wind_bearing: 'mdi:compass-outline', visibility: 'mdi:eye-outline', uv_index: 'mdi:sun-wireless-outline', cloud_coverage: 'mdi:cloud-percent-outline',
    precipitation: 'mdi:weather-rainy', precipitation_probability: 'mdi:umbrella-outline', ozone: 'mdi:molecule',
  };
  TYPES.value = {
    group: 'measure', icon: 'mdi:numeric', w: 2, h: 1, minW: 1, minH: 1, titled: false, accent: 'var(--primary-color)',
    fields: [
      F.select('metric', 'f.metric', FWC_FIELDS, 'humidity'),
      F.entity('entity', 'f.value_entity', { domain: ['sensor', 'input_number'], inherit: fromSensors(el => el.metric || 'humidity') }),
      F.text('icon', 'f.icon', '', 'mdi:…'),
      F.num('decimals', 'f.decimals', null, 0, 3),
      F.bool('temp_colors', 'f.temp_colors_value', false),
    ],
    needs: (el) => ({ fields: { [el.metric || 'humidity']: 1 } }),
    entity: (el, m) => el.entity || (m.cur[el.metric || 'humidity'] || {}).e,
    render(el, m, ctx) {
      const metric = el.metric || 'humidity';
      const v = valOf(ctx, el, m, metric);
      const name = el.title || ctx.t(`metric.${metric}`);
      let txt = '–', u = '';
      if (v) {
        if (metric === 'wind_bearing') { txt = `${ctx.t('compass')[Math.round(v.v / 22.5) % 16]}`; u = `${Math.round(v.v)}°`; } else {
          const dd = el.decimals !== undefined && el.decimals !== null && el.decimals !== '' ? el.decimals : (Math.abs(v.v) < 10 && !['humidity', 'cloud_coverage', 'precipitation_probability', 'pressure'].includes(metric) ? 1 : 0);
          txt = ctx.f.num(v.v, dd); u = v.u;
        }
      }
      const isT = ['temperature', 'apparent_temperature', 'dew_point'].includes(metric);
      const color = el.temp_colors && v && isT ? U.tempColor(U.toC(v.v, v.u)) : '';
      return html`<div class="tile-row">
        <span class="tile-ic"><ha-icon .icon=${el.icon || METRIC_ICONS[metric] || 'mdi:information-outline'}></ha-icon></span>
        <span class="tile-txt"><span class="tile-name">${name}</span><span class="tile-val" style="${color ? `color:${color}` : ''}">${txt}${u ? html`<span class="u">${u}</span>` : ''}</span></span>
      </div>`;
    },
  };

  /* --- Entität ------------------------------------------------------------------------------- */
  const TOGGLE = ['light', 'switch', 'input_boolean', 'fan', 'automation', 'cover', 'lock', 'siren', 'humidifier', 'media_player', 'climate', 'valve'];
  const ACTIVE = ['on', 'open', 'opening', 'unlocked', 'playing', 'heat', 'cool', 'heat_cool', 'auto', 'home'];
  TYPES.sensor = {
    group: 'other', icon: 'mdi:gesture-tap-button', w: 2, h: 1, minW: 1, minH: 1, titled: false, accent: 'var(--state-icon-color, #44739e)',
    fields: [F.entity('entity', 'f.entity', {}), F.text('name', 'f.name', ''), F.text('icon', 'f.icon', '', 'mdi:…'), F.select('tap', 'f.tap', ['auto', 'more-info', 'toggle', 'none'], 'auto')],
    needs: () => ({}),
    entity: (el) => el.entity || null,
    tap: (el) => {
      const d = (el.entity || '').split('.')[0];
      if (el.tap === 'none') return 'none';
      if (el.tap === 'toggle' || (el.tap !== 'more-info' && TOGGLE.includes(d) && !['climate', 'media_player'].includes(d))) return 'toggle';
      return 'more-info';
    },
    render(el, m, ctx) {
      if (!el.entity) return html`<div class="fwc-empty"><ha-icon icon="mdi:selection-search"></ha-icon><span>${ctx.t('w.select_entity')}</span></div>`;
      const s = ctx.hass.states[el.entity];
      if (!s) return html`<div class="fwc-empty warn"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${ctx.t('w.not_found')}: ${el.entity}</span></div>`;
      const name = el.name || s.attributes.friendly_name || el.entity;
      const state = ctx.hass.formatEntityState ? ctx.hass.formatEntityState(s) : `${s.state}${s.attributes.unit_of_measurement ? ` ${s.attributes.unit_of_measurement}` : ''}`;
      const active = ACTIVE.includes(s.state);
      return html`<div class="tile-row ${active ? 'active' : ''}">
        <span class="tile-ic">${el.icon ? html`<ha-icon .icon=${el.icon}></ha-icon>` : html`<ha-state-icon .hass=${ctx.hass} .stateObj=${s}></ha-state-icon>`}</span>
        <span class="tile-txt"><span class="tile-name">${name}</span><span class="tile-val small">${state}</span></span>
      </div>`;
    },
  };

  /* --- Bild / Radar -------------------------------------------------------------------------- */
  const IMG_PRESETS = {
    radarfilm_de: { url: 'https://www.wetterdienst.de/maps/radar/Radarfilm_Deutschland.gif', mode: 'image', fit: 'contain', refresh: 300 },
    dwd_warnings: { url: 'https://www.dwd.de/DWD/warnungen/warnstatus/SchilderPD.jpg', mode: 'image', fit: 'contain', refresh: 600 },
  };
  const dynPreset = el => el.preset === 'windy' || el.preset === 'wetteronline';
  const presetUrl = (el, m) => {
    if (!m.loc) return '';
    const lat = m.loc.lat.toFixed(3), lon = m.loc.lon.toFixed(3);
    if (el.preset === 'windy') {
      const imp = m.units.imperial;
      const q = new URLSearchParams({
        type: 'map', location: 'coordinates', metricRain: imp ? 'in' : 'mm', metricTemp: imp ? '°F' : '°C', metricWind: imp ? 'mph' : 'km/h',
        zoom: String(Math.round(pick(el.zoom, 6))), overlay: el.overlay || 'temp', product: 'ecmwf', level: 'surface',
        lat, lon, detailLat: lat, detailLon: lon, marker: 'true', message: 'true',
      });
      return `https://embed.windy.com/embed.html?${q.toString()}`;
    }
    if (el.preset === 'wetteronline') return `https://radar.wo-cloud.com/mobile/embedded?wrx=${lat},${lon}&wrm=${Math.round(pick(el.zoom, 8))}&wry=${lat},${lon}`;
    return '';
  };
  TYPES.image = {
    group: 'other', icon: 'mdi:image-outline', w: 6, h: 4, minW: 1, minH: 1, titled: false, flush: true,
    fields: [
      { ...F.select('preset', 'f.image_preset', ['custom', 'windy', 'wetteronline', 'radarfilm_de', 'dwd_warnings'], 'custom'),
        apply: v => (IMG_PRESETS[v] ? { ...IMG_PRESETS[v] } : v === 'windy' ? { zoom: 6 } : v === 'wetteronline' ? { zoom: 8 } : {}) },
      { key: '_dwd_hint', type: 'hint', label: 'f.dwd_hint', visible: el => el.preset === 'dwd_warnings' },
      { key: '_loc_hint', type: 'hint', label: 'f.loc_hint', visible: dynPreset },
      { ...F.select('overlay', 'f.windy_overlay', ['temp', 'rain', 'wind', 'clouds', 'pressure'], 'temp'), visible: el => el.preset === 'windy' },
      { ...F.num('zoom', 'f.zoom', 6, 3, 12), visible: dynPreset },
      { ...F.text('url', 'f.url', '', 'https://…'), visible: el => !dynPreset(el) },
      { ...F.select('mode', 'f.image_mode', ['auto', 'image', 'iframe'], 'auto'), visible: el => !dynPreset(el) },
      { ...F.select('fit', 'f.fit', ['cover', 'contain'], 'cover'), visible: el => !dynPreset(el) },
      { ...F.num('refresh', 'f.refresh', 0, 0, 3600, 30, 's'), visible: el => !dynPreset(el) },
    ],
    needs: () => ({}),
    entity: () => null,
    tap: () => 'none',
    render(el0, m, ctx) {
      const dyn = dynPreset(el0);
      // Statische Vorlagen: fehlende Werte (z. B. per YAML nur "preset" gesetzt) aus der Vorlage ergänzen
      const P = IMG_PRESETS[el0.preset];
      const el = P ? { ...el0, url: el0.url || P.url, mode: el0.mode || P.mode, fit: el0.fit || P.fit, refresh: el0.refresh ?? P.refresh } : el0;
      const src = dyn ? presetUrl(el, m) : el.url;
      if (!src) return html`<div class="fwc-empty"><ha-icon icon="mdi:image-off-outline"></ha-icon><span>${ctx.t(dyn ? 'w.no_data' : 'w.no_url')}</span></div>`;
      let url = src;
      if (!dyn && el.refresh > 0) url += `${url.includes('?') ? '&' : '?'}_fwc=${Math.floor(Date.now() / (el.refresh * 1000))}`;
      const isImg = !dyn && (el.mode === 'image' || (el.mode !== 'iframe' && /\.(jpe?g|gif|png|webp|svg|avif)(?:$|[?#;])/i.test(src)));
      return isImg
        ? html`<img class="img" src="${url}" alt="" loading="lazy" style="object-fit:${el.fit || 'cover'}">`
        : html`<iframe class="img" src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="fullscreen" style="${ctx.design ? 'pointer-events:none' : ''}"></iframe>`;
    },
  };

    /* --- HA-Karte ------------------------------------------------------------------------------ */
  TYPES.card = {
    group: 'other', icon: 'mdi:card-outline', w: 6, h: 4, minW: 1, minH: 1, titled: false, flush: true, style: 'none',
    fields: [{ key: 'card', type: 'yaml', label: 'f.card_config' }],
    needs: () => ({}),
    entity: () => null,
    tap: () => 'none',
    render(el, m, ctx) {
      if (!el.card || !el.card.type) return html`<div class="fwc-empty"><ha-icon icon="mdi:card-plus-outline"></ha-icon><span>${ctx.t('w.no_card')}</span></div>`;
      const c = ctx.childCard ? ctx.childCard(el) : null;
      return html`<div class="child">${c || ''}</div>`;
    },
  };

  /* --- Solarstrahlung ----------------------------------------------------------------------- */
  TYPES.solar = {
    group: 'measure', icon: 'mdi:solar-power-variant-outline', w: 3, h: 2, minW: 2, minH: 1, accent: 'var(--amber-color, #ffc107)',
    fields: [
      F.entity('entity', 'f.solar_entity', { domain: ['sensor', 'input_number'], device_class: 'irradiance', inherit: fromSensors('solar_radiation') }),
      F.bool('show_curve', 'f.show_curve', true),
      F.bool('show_sum', 'f.show_sum', true),
      F.num('max', 'f.solar_max', 1000, 200, 1400, 50, 'W/m²'),
    ],
    needs: el => ({ fields: { solar_radiation: 1 }, solar: el.show_curve !== false || el.show_sum !== false, daily: el.show_sum !== false }),
    entity: (el, m) => el.entity || (m.cur.solar_radiation || {}).e,
    render(el, m, ctx) {
      const v = valOf(ctx, el, m, 'solar_radiation');
      const max = pick(el.max, 1000);
      const curve = m.solarDay || [];
      if (!v && !curve.length) return noData(ctx, 'mdi:solar-power-variant-outline');
      const w = v ? Math.max(0, v.v) : 0;
      const fr = U.clamp(w / max, 0, 1);
      const ci = w < 5 ? 0 : w < 150 ? 1 : w < 400 ? 2 : w < 700 ? 3 : 4;
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * A.RAD, r0 = 15, r1 = 15 + 3 + 11 * fr;
        rays += `<line x1="${n1(30 + Math.cos(a) * r0)}" y1="${n1(30 + Math.sin(a) * r0)}" x2="${n1(30 + Math.cos(a) * r1)}" y2="${n1(30 + Math.sin(a) * r1)}"/>`;
      }
      const sun = `<svg viewBox="0 0 60 60" class="sol-sun" aria-hidden="true">
        <circle cx="30" cy="30" r="${n1(16 + 12 * fr)}" fill="url(#fwc-g-sunglow)" opacity="${n1(0.3 + 0.7 * fr)}"/>
        <g class="${ctx.anim && fr > 0.05 ? 'fwc-a-spin' : ''}" stroke="#ffb300" stroke-width="2.6" stroke-linecap="round" opacity="${n1(0.25 + 0.75 * fr)}">${rays}</g>
        <circle cx="30" cy="30" r="11" fill="${fr > 0.02 ? 'url(#fwc-g-sun)' : 'currentColor'}" ${fr > 0.02 ? '' : 'fill-opacity=".25"'}/></svg>`;
      let chart = '';
      if (el.show_curve !== false && curve.length > 2) {
        const cmax = Math.max(max * 0.4, ...curve.map(f => f.rad));
        const t0 = new Date(m.now); t0.setHours(0, 0, 0, 0);
        const X = t => ((t - t0) / 864e5) * 100;
        const pts = curve.map(f => [X(f.t), 100 - (f.rad / cmax) * 92]);
        const d = U.smoothPath(pts, 0.4);
        const nx = X(m.now);
        chart = html`<div class="sol-chart">${raw(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="sol-svg" aria-hidden="true">
          <defs><linearGradient id="fwc-sol-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb300" stop-opacity=".55"/><stop offset="1" stop-color="#ffb300" stop-opacity=".04"/></linearGradient></defs>
          <path d="${d} L ${n1(pts[pts.length - 1][0])} 100 L ${n1(pts[0][0])} 100 Z" fill="url(#fwc-sol-g)"/>
          <path d="${d}" fill="none" stroke="#ffb300" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <line x1="0" x2="100" y1="100" y2="100" stroke="currentColor" stroke-opacity=".2" vector-effect="non-scaling-stroke"/></svg>`)}
          <i class="sol-now" style="left:${U.clamp(nx, 0, 100).toFixed(1)}%"></i></div>`;
      }
      const sum = el.show_sum !== false && U.isNum(m.today.radSum) ? m.today.radSum : null;
      return html`<div class="sol">
        <div class="sol-top">
          ${raw(sun, 'sol-gfx')}
          <div class="sol-txt">
            <div class="sol-val">${v ? ctx.f.num(w, 0) : '–'}<span class="u">W/m²</span></div>
            <div class="sol-cat">${ctx.t('solar')[ci]}</div>
            ${sum !== null ? html`<div class="sol-cat">${ctx.t('w.day_sum')} <b>${ctx.f.num(sum, 1)} kWh/m²</b></div>` : ''}
          </div>
        </div>
        ${chart}
      </div>`;
    },
  };

  /* --- Pollenflug ---------------------------------------------------------------------------- */
  // Näherungsweise Einstufung in Pollen/m³ (Bäume, Gräser, Kräuter); DWD-Index 0–3 wird direkt übernommen
  const POLLEN_LIMITS = { tree: [1, 11, 51, 201], grass: [1, 6, 31, 101], weed: [1, 6, 16, 51] };
  const POLLEN_KIND = { alder: 'tree', birch: 'tree', hazel: 'tree', ash: 'tree', olive: 'tree', grass: 'grass', rye: 'grass', mugwort: 'weed', ragweed: 'weed' };
  const POLLEN_ICON = { tree: 'mdi:tree-outline', grass: 'mdi:grass', weed: 'mdi:flower-pollen-outline' };
  const POLLEN_COLORS = ['var(--divider-color)', '#9ccc65', '#fdd835', '#fb8c00', '#e53935'];
  const pollenLevel = (p, src) => {
    const v = p.value;
    if (!U.isNum(v)) return null;
    if (src === 'ha' && !/m³|m3/i.test(p.unit || '') && v <= 3.5) return v <= 0 ? 0 : v <= 1 ? 1 : v <= 2 ? 2 : 3;
    const lim = POLLEN_LIMITS[POLLEN_KIND[p.type] || 'tree'];
    let l = 0;
    lim.forEach((x, i) => { if (v >= x) l = i + 1; });
    return l;
  };
  TYPES.pollen = {
    group: 'measure', icon: 'mdi:flower-pollen-outline', w: 3, h: 3, minW: 2, minH: 1, accent: 'var(--light-green-color, #8bc34a)',
    fields: [
      { key: 'entities', type: 'entities', label: 'f.pollen_entities', domain: ['sensor'] },
      F.bool('online', 'f.pollen_online', true),
      F.bool('hide_zero', 'f.hide_zero', true),
      F.bool('show_tomorrow', 'f.show_tomorrow', true),
    ],
    needs: el => ({ pollen: { entities: el.entities || [], online: el.online !== false } }),
    entity: el => (el.entities && el.entities[0]) || null,
    render(el, m, ctx) {
      const po = m.pollen;
      if (!po) return html`<div class="fwc-empty"><ha-icon icon="mdi:flower-pollen-outline"></ha-icon><span>${ctx.t('w.no_data')}</span></div>`;
      const rows = po.types.map(p => ({ ...p, level: pollenLevel(p, po.src), levelT: U.isNum(p.tomorrow) ? pollenLevel({ ...p, value: p.tomorrow }, po.src) : null }))
        .filter(p => !(el.hide_zero !== false && !p.missing && !p.level && !p.levelT));
      if (!rows.length) {
        return html`<div class="wn-ok"><ha-icon icon="mdi:flower-outline" style="color:var(--success-color,#43a047)"></ha-icon><div><b>${ctx.t('w.no_pollen')}</b>
          ${po.src === 'online' && !po.covered ? html`<small>${ctx.t('w.pollen_eu')}</small>` : ''}</div></div>`;
      }
      rows.sort((a, b) => (b.level || 0) - (a.level || 0));
      const levels = ctx.t('pollen_level');
      return html`<div class="pol">${rows.map((p) => {
        const name = po.src === 'ha' ? (p.type ? ctx.t(`pollen_type.${p.type}`) : p.name) : ctx.t(`pollen_type.${p.type}`);
        const l = p.level || 0;
        return html`<div class="pol-row" title=${p.missing ? `${ctx.t('w.not_found')}: ${p.e}` : `${name}: ${U.isNum(p.value) ? ctx.f.num(p.value, 1) : '–'} ${p.unit || ''}`}>
          <ha-icon .icon=${POLLEN_ICON[POLLEN_KIND[p.type] || 'tree']} style="color:${POLLEN_COLORS[l]}"></ha-icon>
          <span class="pol-name">${name}</span>
          <span class="pol-bar">${[1, 2, 3, 4].map(i => html`<i style="${i <= l ? `background:${POLLEN_COLORS[l]}` : ''}"></i>`)}</span>
          <span class="pol-lvl">${p.missing ? '?' : levels[l]}</span>
          ${el.show_tomorrow !== false && p.levelT !== null ? html`<span class="pol-tm" title=${ctx.t('w.tomorrow')}><ha-icon icon="mdi:arrow-right-thin"></ha-icon><i style="background:${POLLEN_COLORS[p.levelT]}"></i></span>` : ''}
        </div>`;
      })}</div>`;
    },
  };

  /* --- Wetterbericht ------------------------------------------------------------------------- */
  const REPORT_ATTRS = ['data', 'report', 'text', 'weather_report', 'forecast_text', 'message'];
  const mdInline = s2 => U.esc(s2).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(.+?)__/g, '<b>$1</b>');
  // DWD-Text in Abschnitte zerlegen: Titel, Ausgabezeit, Schlagzeile, Lage-Abschnitte, Tage
  const parseReport = (txt) => {
    const days = FWC_I18N.de.weekday_names.concat(FWC_I18N.en.weekday_names);
    const out = { title: '', issued: '', headline: '', sections: [], days: [], signature: '' };
    const blocks = String(txt || '').replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    let inDays = false;
    blocks.forEach((b) => {
      const plain = b.replace(/\*\*/g, '').trim();
      if (/^#{1,6}\s/.test(b)) { out.title = plain.replace(/^#+\s*/, ''); return; }
      if (/ausgegeben|issued/i.test(plain) && plain.length < 160) { out.issued = plain; return; }
      if (/^deutscher wetterdienst\s*$/i.test(plain)) return;
      if (/^deutscher wetterdienst,/i.test(plain)) { out.signature = plain; return; }
      if (/^detaillierter wetterablauf|^detailed/i.test(plain)) { inDays = true; const rest = plain.replace(/^[^:]*:\s*/, ''); if (rest) b = rest; else return; }
      // Absätze, die mit "Am <Tag>" / "In der Nacht zum <Tag>" beginnen, gehören zu Tagen
      const lines = b.split('\n').map(x => x.trim()).filter(Boolean);
      let isDay = false;
      lines.forEach((ln) => {
        const mAm = /^(am|on)\s+(\S+)/i.exec(ln.replace(/\*\*/g, ''));
        const mNight = /^(in der nacht zum|in der nacht auf|during the night)/i.test(ln);
        if (mAm && days.some(d => mAm[2].toLowerCase().startsWith(d.toLowerCase()))) {
          out.days.push({ day: mAm[2].replace(/[,.:]$/, ''), parts: [ln] });
          isDay = true;
        } else if ((mNight || isDay || inDays) && out.days.length) {
          out.days[out.days.length - 1].parts.push(ln);
          isDay = true;
        } else if (inDays && !out.days.length) {
          out.days.push({ day: '', parts: [ln] });
          isDay = true;
        }
      });
      if (isDay) return;
      if (!out.headline && plain.length < 180 && !/:\s*$/.test(plain) && !inDays) { out.headline = plain; return; }
      const mt = /^([^\n:]{2,40}):\s*\n?([\s\S]*)$/.exec(b);
      if (mt) out.sections.push({ title: mt[1].replace(/\*\*/g, ''), text: mt[2].trim() });
      else out.sections.push({ title: '', text: b });
    });
    return out;
  };
  // Automatischer Wetterbericht aus der Vorhersage. Kurz: 1–2 Sätze, ausführlich: 5–7 zusammenhängende Sätze je Tag.
  const REP_TXT = {
    de: {
      adj: { sunny: 'sonnig', 'clear-night': 'klar', partlycloudy: 'wechselnd bewölkt', cloudy: 'stark bewölkt', fog: 'neblig-trüb', rainy: 'regnerisch',
        pouring: 'nass mit kräftigem Regen', snowy: 'winterlich mit Schneefall', 'snowy-rainy': 'nasskalt mit Schneeregen', hail: 'unbeständig mit Hagelschauern',
        lightning: 'gewittrig', 'lightning-rainy': 'gewittrig mit kräftigen Schauern', windy: 'windig', 'windy-variant': 'windig und wolkig', exceptional: 'unwetterartig' },
      dirs: ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'],
      wind: ['kaum spürbar', 'schwach', 'schwach', 'schwach bis mäßig', 'mäßig', 'frisch', 'stark', 'stark', 'stürmisch', 'stürmisch', 'stürmisch', 'orkanartig', 'orkanartig'],
      part: h => (h < 11 ? 'am Vormittag' : h < 14 ? 'zur Mittagszeit' : h < 18 ? 'am Nachmittag' : 'am Abend'),
      ref: (i, wd) => (i === 0 ? 'Heute' : i === 1 ? 'Morgen' : `Am ${wd}`),
      now: (t, a) => `Aktuell sind es ${t}, es ist ${a}.`,
      day: (r, a) => `${r} wird es überwiegend ${a}.`,
      rest: a => `Im weiteren Tagesverlauf bleibt es überwiegend ${a}.`,
      tRise: (lo, hi, p) => `Die Temperatur steigt von ${lo} Grad am Morgen auf bis zu ${hi} Grad ${p}.`,
      tRange: (lo, hi) => `Die Temperaturen liegen zwischen ${lo} und ${hi} Grad.`,
      tFlat: v => `Die Temperatur bleibt nahezu konstant bei ${v} Grad.`,
      rainHigh: (p, w, mm) => `Mit hoher Wahrscheinlichkeit von ${p} Prozent fällt Niederschlag${w ? `, vor allem ${w}` : ''}${mm ? `, insgesamt etwa ${mm} mm` : ''}.`,
      rainMid: (p, w) => `Zeitweise sind Schauer möglich${w ? `, am ehesten ${w}` : ''}, das Risiko liegt bei ${p} Prozent.`,
      dry: 'Es bleibt weitgehend trocken.',
      between: (a, b) => (a === b ? `gegen ${a} Uhr` : `zwischen ${a} und ${b} Uhr`),
      wind_s: (adj, dir, v) => `Der Wind weht ${adj} aus ${dir} mit etwa ${v}.`,
      gusty: 'Dabei sind kräftige Böen möglich.',
      uv: (cat, v) => `Die UV-Belastung ist ${cat} (Index ${v}), Sonnenschutz ist sinnvoll.`,
      hum: v => `Die Luftfeuchtigkeit liegt im Mittel bei etwa ${v} Prozent.`,
      press: v => `Der Luftdruck liegt bei ${v} hPa.`,
      night: (wd, lo, frost) => `In der Nacht zum ${wd} kühlt es auf ${lo} Grad ab${frost ? ', örtlich ist mit Frost und Glätte zu rechnen' : ''}.`,
      warmer: (wd, v) => `Am ${wd} wird es mit bis zu ${v} Grad spürbar wärmer.`,
      colder: (wd, v) => `Am ${wd} wird es mit höchstens ${v} Grad deutlich kühler.`,
      same: (wd, v) => `Am ${wd} bleibt es mit bis zu ${v} Grad ähnlich temperiert.`,
    },
    en: {
      adj: { sunny: 'sunny', 'clear-night': 'clear', partlycloudy: 'partly cloudy', cloudy: 'overcast', fog: 'foggy', rainy: 'rainy', pouring: 'wet with heavy rain',
        snowy: 'wintry with snowfall', 'snowy-rainy': 'cold with sleet', hail: 'unsettled with hail showers', lightning: 'thundery', 'lightning-rainy': 'thundery with heavy showers',
        windy: 'windy', 'windy-variant': 'windy and cloudy', exceptional: 'stormy' },
      dirs: ['the north', 'the northeast', 'the east', 'the southeast', 'the south', 'the southwest', 'the west', 'the northwest'],
      wind: ['barely noticeable', 'light', 'light', 'light to moderate', 'moderate', 'fresh', 'strong', 'strong', 'stormy', 'stormy', 'stormy', 'violent', 'violent'],
      part: h => (h < 11 ? 'in the morning' : h < 14 ? 'around midday' : h < 18 ? 'in the afternoon' : 'in the evening'),
      ref: (i, wd) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : wd),
      now: (t, a) => `It is currently ${t} and ${a}.`,
      day: (r, a) => `${r} will be mostly ${a}.`,
      rest: a => `For the rest of the day it stays mostly ${a}.`,
      tRise: (lo, hi, p) => `Temperatures rise from ${lo} degrees in the morning to ${hi} degrees ${p}.`,
      tRange: (lo, hi) => `Temperatures range between ${lo} and ${hi} degrees.`,
      tFlat: v => `The temperature stays almost constant at ${v} degrees.`,
      rainHigh: (p, w, mm) => `Precipitation is likely (${p} percent)${w ? `, mainly ${w}` : ''}${mm ? `, about ${mm} mm in total` : ''}.`,
      rainMid: (p, w) => `Showers are possible at times${w ? `, most likely ${w}` : ''}, with a ${p} percent chance.`,
      dry: 'It stays mostly dry.',
      between: (a, b) => (a === b ? `around ${a}` : `between ${a} and ${b}`),
      wind_s: (adj, dir, v) => `The wind is ${adj} from ${dir} at about ${v}.`,
      gusty: 'Strong gusts are possible.',
      uv: (cat, v) => `UV exposure is ${cat} (index ${v}), sun protection is advisable.`,
      hum: v => `Humidity averages around ${v} percent.`,
      press: v => `Air pressure is ${v} hPa.`,
      night: (wd, lo, frost) => `During the night to ${wd} it cools down to ${lo} degrees${frost ? ', with local frost and icy patches' : ''}.`,
      warmer: (wd, v) => `${wd} will be noticeably warmer with up to ${v} degrees.`,
      colder: (wd, v) => `${wd} will be noticeably cooler with at most ${v} degrees.`,
      same: (wd, v) => `${wd} stays similar with up to ${v} degrees.`,
    },
  };
  const autoReport = (m, ctx, long) => {
    const T = REP_TXT[ctx.lang] || REP_TXT.en;
    const comp = ctx.t('compass');
    const N = v => ctx.f.num(v, 0);
    const adj = c => T.adj[c] || condText(ctx, c).toLowerCase();
    const shortText = (d, i) => {
      const parts = [];
      parts.push(`${condText(ctx, d.cond)}, ${ctx.t('w.r_temp', { lo: N(d.low), hi: N(d.temp) }).replace(' °', '°')}`);
      if (U.isNum(d.pop) && d.pop >= 10) parts.push(`${ctx.t('w.r_rain', { p: Math.round(d.pop) })}${d.precip > 0 ? ` (${ctx.t('w.r_rain_mm', { mm: ctx.f.num(d.precip, 1) })})` : ''}`);
      if (U.isNum(d.wind)) parts.push(ctx.t('w.r_wind', { d: U.isNum(d.bearing) ? comp[Math.round(d.bearing / 22.5) % 16] : '–', v: `${N(d.wind)} ${m.units.wind}` }));
      let txt = `${parts.join('. ').replace(/^./, c => c.toUpperCase())}.`;
      if (i === 0 && m.cur.temperature) txt = `${ctx.t('w.r_now', { t: `${ctx.f.num(m.cur.temperature.v, 1)} ${m.cur.temperature.u}`, c: condText(ctx, m.condition) })} ${txt}`;
      return txt;
    };
    const longText = (d, i) => {
      const wd = ctx.f.weekdayLong(d.t);
      const next = m.daily[i + 1];
      const hrs = (m.hourlyAll || []).filter(f => U.sameDay(f.t, d.t));
      const out = [];
      const nowS = i === 0 && m.cur.temperature;
      if (nowS) out.push(T.now(`${ctx.f.num(m.cur.temperature.v, 1)} ${m.cur.temperature.u}`, adj(m.condition)));
      out.push(nowS ? T.rest(adj(d.cond)) : T.day(T.ref(i, wd), adj(d.cond)));
      // Temperaturverlauf
      const lo = U.isNum(d.low) ? d.low : null;
      const hi = U.isNum(d.temp) ? d.temp : null;
      const morning = hrs.filter(f => f.t.getHours() >= 5 && f.t.getHours() <= 9 && U.isNum(f.temp));
      const peak = hrs.filter(f => U.isNum(f.temp)).reduce((a, b) => (!a || b.temp > a.temp ? b : a), null);
      if (morning.length && peak && peak.temp - Math.min(...morning.map(f => f.temp)) >= 1) out.push(T.tRise(N(Math.min(...morning.map(f => f.temp))), N(peak.temp), T.part(peak.t.getHours())));
      else if (lo !== null && hi !== null && hi - lo >= 1) out.push(T.tRange(N(lo), N(hi)));
      else if (hi !== null) out.push(T.tFlat(N(hi)));
      // Niederschlag mit Zeitfenster
      const wet = hrs.filter(f => (f.precip || 0) >= 0.1 || (f.pop || 0) >= 50);
      const hh = t => ctx.f.hour(t).replace(/:00$/, '').replace(/^0(\d)/, '$1');
      const when = wet.length ? T.between(hh(wet[0].t), hh(wet[wet.length - 1].t)) : '';
      const pop = U.isNum(d.pop) ? Math.round(d.pop) : null;
      if (pop !== null && pop >= 55) out.push(T.rainHigh(pop, when, d.precip > 0 ? ctx.f.num(d.precip, 1) : ''));
      else if (pop !== null && pop >= 25) out.push(T.rainMid(pop, when));
      else out.push(T.dry);
      // Wind
      const ws = U.isNum(d.wind) ? d.wind : (hrs.length && hrs.some(f => U.isNum(f.wind)) ? Math.max(...hrs.filter(f => U.isNum(f.wind)).map(f => f.wind)) : null);
      const wb = U.isNum(d.bearing) ? d.bearing : (hrs.find(f => U.isNum(f.bearing)) || {}).bearing;
      if (ws !== null) {
        const bft = U.msToBft(U.windToMs(ws, m.units.wind));
        out.push(T.wind_s(T.wind[bft], U.isNum(wb) ? T.dirs[Math.round(wb / 45) % 8] : (ctx.lang === 'de' ? 'wechselnden Richtungen' : 'variable directions'), `${N(ws)} ${m.units.wind}`));
        if (bft >= 6) out.push(T.gusty);
      }
      // Zusatz: UV, Luftfeuchte oder Luftdruck
      const extra = [];
      if (U.isNum(d.uv) && d.uv >= 3) extra.push(T.uv(ctx.t('uv')[d.uv < 6 ? 1 : d.uv < 8 ? 2 : d.uv < 11 ? 3 : 4].toLowerCase(), N(d.uv)));
      const hum = U.isNum(d.hum) ? d.hum : (hrs.some(f => U.isNum(f.hum)) ? hrs.filter(f => U.isNum(f.hum)).reduce((a, f, _, arr) => a + f.hum / arr.length, 0) : null);
      if (hum !== null) extra.push(T.hum(N(hum)));
      if (i === 0 && m.cur.pressure) extra.push(T.press(ctx.f.num(U.pressToHpa(m.cur.pressure.v, m.cur.pressure.u), 0, 0, false)));
      // Nacht und Ausblick
      const tail = [];
      if (next) {
        const nwd = ctx.f.weekdayLong(next.t);
        if (U.isNum(next.low)) tail.push(T.night(nwd, N(next.low), U.toC(next.low, m.units.temperature) <= 0.5));
        if (U.isNum(next.temp) && hi !== null) {
          const diff = next.temp - hi;
          tail.push(diff >= 2 ? T.warmer(nwd, N(next.temp)) : diff <= -2 ? T.colder(nwd, N(next.temp)) : T.same(nwd, N(next.temp)));
        }
      }
      // 5–7 Sätze: Kern + Nacht/Ausblick, Zusätze nur so viele wie passen
      let res = [...out];
      const room = 7 - res.length - tail.length;
      res = res.concat(extra.slice(0, Math.max(0, room)), tail);
      const fill = extra.slice(Math.max(0, room));
      while (res.length < 5 && fill.length) res.splice(res.length - tail.length, 0, fill.shift());
      return res.slice(0, 7).join(' ');
    };
    return {
      title: '', issued: ctx.t('w.report_auto'), headline: m.daily[0] ? condText(ctx, m.daily[0].cond) : '', sections: [], signature: '',
      days: m.daily.slice(0, 5).map((d, i) => ({ day: ctx.f.weekdayLong(d.t), parts: [long ? longText(d, i) : shortText(d, i)], t: d.t })),
    };
  };
  // Kurzfassung eines DWD-Tagestexts: die ersten zwei Sätze
  const firstSentences = (txt, n) => (String(txt).match(/[^.!?]+[.!?]+(\s|$)/g) || [txt]).slice(0, n).join('').trim();
  TYPES.report = {
    group: 'measure', icon: 'mdi:text-box-outline', w: 6, h: 4, minW: 2, minH: 2, accent: 'var(--indigo-color, #3f51b5)',
    fields: [
      F.entity('entity', 'f.report_entity', { domain: ['sensor'] }),
      F.text('attribute', 'f.report_attribute', '', 'data'),
      F.select('range', 'f.report_range', ['today', 'tomorrow', 'day3', 'all'], 'today'),
      F.select('length', 'f.report_length', ['short', 'long'], 'long'),
      F.bool('show_tabs', 'f.show_tabs', true),
      F.bool('show_headline', 'f.show_headline', true),
      F.bool('show_meta', 'f.show_meta', true),
    ],
    needs: el => (el.entity ? {} : { daily: true, condition: true, fields: { temperature: 1 } }),
    entity: el => el.entity || null,
    tap: () => 'none',
    render(el, m, ctx) {
      let rep;
      if (el.entity) {
        const st = ctx.hass.states[el.entity];
        if (!st) return html`<div class="fwc-empty warn"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${ctx.t('w.not_found')}: ${el.entity}</span></div>`;
        const a = st.attributes || {};
        let txt = el.attribute ? a[el.attribute] : null;
        if (!txt) txt = REPORT_ATTRS.map(k => a[k]).filter(x => typeof x === 'string').sort((x, y) => y.length - x.length)[0] || st.state;
        rep = parseReport(txt);
        if (!rep.title && a.station_name) rep.title = a.station_name;
      } else {
        if (!m.daily.length) return m.onlinePending ? html`<div class="fwc-empty"><ha-icon icon="mdi:timer-sand"></ha-icon><span>${ctx.t('w.loading')}</span></div>` : noData(ctx);
        rep = autoReport(m, ctx, el.length !== 'short');
      }
      // Tabs: Lage (alles), Heute, Morgen, Übermorgen
      const todayName = ctx.lang === 'de' ? FWC_I18N.de.weekday_names[m.now.getDay()] : FWC_I18N.en.weekday_names[m.now.getDay()];
      let iToday = rep.days.findIndex(d => d.day && todayName.toLowerCase().startsWith(d.day.toLowerCase().slice(0, 3)));
      if (iToday < 0) iToday = 0;
      const tabs = [['all', ctx.t('w.all_days')]];
      [['today', ctx.t('w.today')], ['tomorrow', ctx.t('w.tomorrow')], ['day3', ctx.t('w.day_after')]].forEach(([k, l], i) => { if (rep.days[iToday + i]) tabs.push([k, l]); });
      const key = `report|${el.id}`;
      let sel = (ctx.ui && ctx.ui.get(key)) || el.range || 'today';
      if (!tabs.some(t => t[0] === sel)) sel = tabs.length > 1 ? tabs[1][0] : 'all';
      const idx = { today: 0, tomorrow: 1, day3: 2 }[sel];
      const para = x => html`<p .innerHTML=${mdInline(x)}></p>`;
      let body;
      if (sel === 'all') {
        body = html`${rep.sections.map(sx => html`${sx.title ? html`<h4>${sx.title}</h4>` : ''}${sx.text.split('\n').filter(Boolean).map(para)}`)}
          ${rep.days.map(d => html`${d.day ? html`<h4>${d.day}</h4>` : ''}${d.parts.map(para)}`)}`;
      } else {
        const d = rep.days[iToday + idx];
        const parts = d && el.entity && el.length === 'short' ? [firstSentences(d.parts.join(' '), 2)] : (d ? d.parts : []);
        body = d ? html`${parts.map(para)}` : html`<p>${ctx.t('w.no_data')}</p>`;
      }
      return html`<div class="rep">
        ${el.show_tabs !== false && tabs.length > 1 ? html`<div class="rep-tabs">${tabs.map(([k, l]) => html`<button class="${k === sel ? 'on' : ''}" @click=${(e) => { e.stopPropagation(); if (ctx.ui) ctx.ui.set(key, k); }}>${l}</button>`)}</div>` : ''}
        ${el.show_headline !== false && rep.headline ? html`<div class="rep-head">${rep.headline}</div>` : ''}
        <div class="rep-body">${body}</div>
        ${el.show_meta !== false && (rep.issued || rep.title) ? html`<div class="rep-meta">${[
          rep.title.replace(/^(wettervorhersage|weather forecast)\s+(für|for)\s+/i, ''),
          ((/am\s+(.+?uhr)/i.exec(rep.issued) || [])[1]) || rep.issued,
        ].filter(Boolean).join(' · ')}</div>` : ''}
      </div>`;
    },
  };

  /* --- Regenradar ---------------------------------------------------------------------------- */
  const radarCache = new Map();
  const inGermany = (lat, lon) => lat > 47.2 && lat < 55.1 && lon > 5.8 && lon < 15.1;
  TYPES.radar = {
    group: 'forecast', icon: 'mdi:radar', w: 6, h: 5, minW: 2, minH: 2, titled: false, flush: true, accent: 'var(--blue-color, #2196f3)',
    fields: [
      F.select('provider', 'f.radar_provider', ['auto', 'rainviewer', 'dwd'], 'auto'),
      F.num('zoom', 'f.zoom', 7, 4, 10),
      F.num('frames', 'f.frames', 7, 1, 13),
      F.num('speed', 'f.speed', 600, 200, 2000, 100, 'ms'),
      F.select('map_style', 'f.map_style', ['auto', 'light', 'dark'], 'auto'),
      F.select('map_source', 'f.map_source', ['esri', 'osm', 'carto'], 'esri'),
      { ...F.text('map_key', 'f.map_key', '', 'CARTO API-Key'), visible: el => el.map_source === 'carto' },
      F.bool('show_labels', 'f.show_map_labels', true),
      F.bool('show_marker', 'f.show_marker', true),
      F.bool('show_time', 'f.show_time_radar', true),
    ],
    needs: () => ({}),
    entity: () => null,
    tap: () => 'none',
    render(el, m, ctx) {
      if (!m.loc) return noData(ctx, 'mdi:map-marker-off-outline');
      const { lat, lon } = m.loc;
      const prov = (el.provider || 'auto') === 'auto' ? (inGermany(lat, lon) ? 'dwd' : 'rainviewer') : el.provider;
      const zoom = U.clamp(Math.round(pick(el.zoom, 7)), 3, 11);
      const z = prov === 'rainviewer' ? Math.min(zoom, 7) : zoom;
      const nf = U.clamp(Math.round(pick(el.frames, 7)), 1, 13);
      const speed = U.clamp(pick(el.speed, 600), 150, 3000) / 1000;
      const dark = el.map_style === 'dark' || (el.map_style !== 'light' && ctx.hass.themes && ctx.hass.themes.darkMode);
      const n = 2 ** z;
      const wx = ((lon + 180) / 360) * n * 256;
      const latR = lat * A.RAD;
      const wy = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n * 256;
      const tx0 = Math.floor(wx / 256) - 1, ty0 = Math.floor(wy / 256) - 1;
      const fx = (wx - tx0 * 256) / 768, fy = (wy - ty0 * 256) / 768;
      const k = 1.6 * 2 ** (zoom - z);
      // Zeitpunkte & Kacheln
      let frames = [];
      let status = '';
      if (prov === 'rainviewer') {
        const rv = FWC_ONLINE.rainviewer(ctx.notify);
        if (!rv) status = ctx.t('w.radar_loading');
        else if (!rv.frames.length) status = ctx.t('w.radar_none');
        else frames = rv.frames.slice(-nf).map(f => ({ time: f.time * 1000, tile: (x, y) => `${rv.host}${f.path}/256/${z}/${x}/${y}/2/1_1.png` }));
      } else {
        const step = 10 * 60000;
        const latest = Math.floor((Date.now() - 10 * 60000) / (5 * 60000)) * 5 * 60000;
        const C = 2 * Math.PI * 6378137;
        const mx = px => (px / (256 * n)) * C - C / 2;
        const my = py => C / 2 - (py / (256 * n)) * C;
        const bbox = [mx(tx0 * 256), my((ty0 + 3) * 256), mx((tx0 + 3) * 256), my(ty0 * 256)].map(v => v.toFixed(1)).join(',');
        for (let i = nf - 1; i >= 0; i--) {
          const t = latest - i * step;
          frames.push({ time: t, image: `https://maps.dwd.de/geoserver/dwd/wms?service=WMS&version=1.1.1&request=GetMap&layers=dwd:Niederschlagsradar&styles=&srs=EPSG:3857&bbox=${bbox}&width=768&height=768&format=image/png&transparent=true&time=${new Date(t).toISOString().replace(/\.\d{3}Z$/, '.000Z')}` });
        }
      }
      const uid = `fwcr${String(ctx.uid)}${String(el.id).replace(/[^a-z0-9]/gi, '')}`;
      const cartoKey = String(el.map_key || '').trim();
      const mapSrc = el.map_source === 'osm' ? 'osm' : (el.map_source === 'carto' ? 'carto' : 'esri');
      const labels = el.show_labels !== false && mapSrc === 'esri';
      const key = [prov, z, zoom, nf, speed, dark, cartoKey, mapSrc, labels, el.show_marker !== false, el.show_time !== false, frames.map(f => f.time).join(','), status, ctx.anim, Math.round(lat * 1000), Math.round(lon * 1000)].join('|');
      let cached = radarCache.get(uid);
      if (!cached || cached.key !== key) {
        // Hintergrundkarte: Esri Canvas (hell/dunkel, ohne Key, Ortsnamen als eigene Ebene über dem Radar),
        // alternativ OpenStreetMap (im Dark-Mode abgedunkelt) oder CARTO mit eigenem API-Key
        const sub = ['a', 'b', 'c', 'd'];
        const esri = (kind, x, y) => `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_${kind}/MapServer/tile/${z}/${y}/${x}`;
        const baseUrl = (x, y) => {
          if (mapSrc === 'carto') return `https://${sub[(x + y) % 4]}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/${z}/${x}/${y}.png${cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : ''}`;
          if (mapSrc === 'osm') return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
          return esri('Base', x, y);
        };
        const grid = (urlFn, extra = '') => {
          let out = '';
          for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 3; i++) {
              const x = ((tx0 + i) % n + n) % n, y = ty0 + j;
              if (y < 0 || y >= n) continue;
              out += `<img src="${urlFn(x, y)}" style="left:${(i * 100 / 3).toFixed(4)}%;top:${(j * 100 / 3).toFixed(4)}%" alt="" loading="lazy"${extra}>`;
            }
          }
          return out;
        };
        const base = grid(baseUrl);
        const refLayer = labels ? `<div class="rad-ref">${grid((x, y) => esri('Reference', x, y), ' onerror="this.style.visibility=\'hidden\'"')}</div>` : '';
        const total = frames.length * speed + 1.2;
        const anim = ctx.anim && frames.length > 1;
        const p = (speed / total) * 100;
        const lastP = ((speed + 1.2) / total) * 100;
        const kf = anim ? `<style>@keyframes ${uid}{0%,${p.toFixed(3)}%{opacity:1}${(p + 0.01).toFixed(3)}%,100%{opacity:0}}@keyframes ${uid}l{0%,${lastP.toFixed(3)}%{opacity:1}${(lastP + 0.01).toFixed(3)}%,100%{opacity:0}}</style>` : '';
        const frameStyle = (i) => {
          if (!anim) return i === frames.length - 1 ? 'opacity:1' : 'opacity:0';
          const last = i === frames.length - 1;
          return `opacity:0;animation:${uid}${last ? 'l' : ''} ${total.toFixed(2)}s linear ${(i * speed).toFixed(2)}s infinite`;
        };
        const layers = frames.map((f, i) => {
          let inner = '';
          if (f.image) inner = `<img src="${U.esc(f.image)}" style="left:0;top:0;width:100%;height:100%" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'">`;
          else {
            for (let j = 0; j < 3; j++) {
              for (let ii = 0; ii < 3; ii++) {
                const x = ((tx0 + ii) % n + n) % n, y = ty0 + j;
                if (y < 0 || y >= n) continue;
                inner += `<img src="${U.esc(f.tile(x, y))}" style="left:${(ii * 100 / 3).toFixed(4)}%;top:${(j * 100 / 3).toFixed(4)}%" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">`;
              }
            }
          }
          return `<div class="rad-frame" style="${frameStyle(i)}">${inner}</div>`;
        }).join('');
        const times = el.show_time !== false ? frames.map((f, i) => `<span style="${frameStyle(i)}">${U.esc(ctx.f.time(new Date(f.time)))}</span>`).join('') : '';
        const markup = `${kf}<div class="rad-map" style="--S:calc(max(100cqw, 100cqh) * ${k.toFixed(3)});left:calc(50% - var(--S) * ${fx.toFixed(4)});top:calc(50% - var(--S) * ${fy.toFixed(4)})">
            <div class="rad-base ${mapSrc === 'osm' && dark ? 'dark' : ''} ${mapSrc === 'osm' ? 'osm' : ''}">${base}</div>${layers}${refLayer}</div>
          ${el.show_marker !== false ? '<div class="rad-pin"><i></i></div>' : ''}
          ${times ? `<div class="rad-time"><span class="rad-dot"></span><span class="rad-times">${times}</span></div>` : ''}
          ${status ? `<div class="rad-status">${U.esc(status)}</div>` : ''}
          <div class="rad-attr">${mapSrc === 'esri' ? '© Esri, HERE, Garmin, © OpenStreetMap' : (mapSrc === 'carto' ? '© OpenStreetMap © CARTO' : '© OpenStreetMap')} · ${prov === 'dwd' ? 'DWD' : 'RainViewer'}</div>`;
        cached = { key, markup };
        remember(radarCache, uid, cached, 16);
      }
      return html`<div class="rad">${raw(cached.markup)}</div>`;
    },
  };

  /* ---------------------------------------------------------------------------------------------
   * 3D-Erde: Satellitenwolken, Tag/Nacht, Radar und Standort auf einer Erdkugel (WebGL, fwc-earth.js)
   * -------------------------------------------------------------------------------------------- */
  // Sterne einmal erzeugen (feste Zufallsfolge)
  const EARTH_STARS = (() => {
    let sd = 7;
    const r = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    let g = '';
    for (let i = 0; i < 90; i++) g += `<circle cx="${n1(r() * 400)}" cy="${n1(r() * 400)}" r="${n1(0.35 + r() * r() * 1.3)}" fill="#fff" opacity="${n1(0.25 + r() * 0.65)}"/>`;
    return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${g}</svg>`;
  })();
  const EARTH_PERIOD = { slow: 180, medium: 90, fast: 40 };

  TYPES.earth = {
    group: 'current', icon: 'mdi:earth', w: 6, h: 6, minW: 2, minH: 2, titled: false, flush: true, style: 'none', accent: 'var(--blue-color, #2196f3)',
    fields: [
      F.select('view', 'f.earth_view', ['rotate', 'home'], 'rotate'),
      { ...F.select('speed', 'f.earth_speed', ['slow', 'medium', 'fast'], 'medium'), visible: el => (el.view || 'rotate') === 'rotate' },
      F.num('zoom', 'f.earth_zoom', 100, 60, 450, 10, '%'),
      F.bool('show_radar', 'f.earth_radar', true),
      F.bool('show_wind', 'f.earth_wind', false),
      F.bool('show_night', 'f.earth_night', true),
      F.bool('show_marker', 'f.show_marker', true),
      F.bool('show_stars', 'f.earth_stars', true),
      F.bool('interactive', 'f.earth_drag', true),
      F.bool('show_temp', 'f.w3d_temp', true),
      { ...F.bool('show_condition', 'f.show_condition', true), visible: el => el.show_temp !== false },
      F.bool('show_values', 'f.earth_values', false),
      F.select('quality', 'f.earth_quality', ['low', 'normal', 'high'], 'normal'),
      F.bool('animated', 'f.animated', true),
    ],
    needs: el => ({
      condition: el.show_temp !== false,
      fields: { temperature: 1, ...(el.show_values === true ? { wind_speed: 1, wind_bearing: 1, humidity: 1, pressure: 1 } : {}) },
    }),
    entity: (el, m) => m.weatherId || null,
    render(el, m, ctx) {
      if (!m.loc) return noData(ctx, 'mdi:map-marker-off-outline');
      const anim = ctx.anim && el.animated !== false;
      const rotate = (el.view || 'rotate') === 'rotate';
      const radar = el.show_radar !== false ? FWC_EARTH.radarUrl(FWC_ONLINE.rainviewer(ctx.notify)) : null;
      const opts = {
        lat: m.loc.lat, lon: m.loc.lon, rotate, anim, period: EARTH_PERIOD[el.speed] || 90,
        zoom: U.clamp(pick(el.zoom, 100), 60, 450) / 100, interactive: el.interactive !== false && !ctx.design, night: el.show_night !== false, marker: el.show_marker !== false,
        radar, wind: el.show_wind === true, quality: el.quality || 'normal', day_image: el.day_image || '', night_image: el.night_image || '',
        t_loading: ctx.t('w.earth_loading'), t_error: ctx.t('w.earth_error'),
        // ändert sich jede Minute -> Tag/Nacht-Grenze wandert auch bei stehender Erde weiter
        tick: Math.floor(m.now / 60000),
      };
      const t = el.show_temp !== false ? valOf(ctx, el, m, 'temperature') : null;
      const tc = t ? tempC(t) : null;
      let vals = '';
      if (el.show_values === true) {
        const rows = [];
        const row = (col, icon, val, unit) => rows.push(html`<div class="w3d-vr" style="--c:${col}">${icon}<b>${val}</b><small>${unit}</small></div>`);
        const ws = m.cur.wind_speed, wb = m.cur.wind_bearing, hum = m.cur.humidity, prv = m.cur.pressure;
        if (prv) row('#b39dff', html`<ha-icon icon="mdi:gauge"></ha-icon>`, ctx.f.num(U.pressToHpa(prv.v, prv.u), 0), 'hPa');
        if (ws) {
          const colT = U.windColor(U.windToMs(ws.v, ws.u));
          const rotT = wb && U.isNum(wb.v) ? (wb.v + 180) % 360 : null;
          row(colT, rotT !== null ? html`<span class="w3d-arrow">${raw(`<svg viewBox="0 0 24 24"><g transform="rotate(${rotT} 12 12)"><path d="M12 3 L17 16 L12 13 L7 16 Z" fill="${colT}"/></g></svg>`)}</span>` : html`<ha-icon icon="mdi:weather-windy"></ha-icon>`, ctx.f.num(ws.v, 0), ws.u);
        }
        if (hum) row('#7fd4ff', html`<ha-icon icon="mdi:water-percent"></ha-icon>`, ctx.f.num(hum.v, 0), '%');
        if (rows.length) vals = html`<div class="fe-vals">${rows}</div>`;
      }
      return html`<div class="fe ${el.show_stars !== false ? 'stars' : ''} ${anim ? '' : 'noanim'} ${vals ? 'has-vals' : ''}">
        ${el.show_stars !== false ? raw(EARTH_STARS, 'fe-stars') : ''}
        <fwc-earth .opts=${opts}></fwc-earth>
        ${t ? html`<div class="fe-main">
          <div class="w3d-temp" style="--tc:${tc !== null && el.temp_colors !== false ? U.tempColor(tc) : '#fff'}">${ctx.f.num(t.v, 1)}<span>${t.u}</span></div>
          ${el.show_condition !== false && m.condition ? html`<div class="w3d-cond">${condText(ctx, m.condition)}</div>` : ''}
        </div>` : ''}
        ${vals}
        <div class="fe-attr">NASA · EUMETSAT${radar ? ' · RainViewer' : ''}${el.show_wind === true ? ' · Open-Meteo' : ''}</div>
      </div>`;
    },
  };

  /* ----------------------------------------------------------------------------------------------
   * Rahmen eines Elements (Kachel, Kopfzeile) und Zusammenstellung
   * -------------------------------------------------------------------------------------------- */
  const ORDER = ['header', 'current', 'weather3d', 'earth', 'warnings', 'temperature', 'minmax', 'humidity', 'pressure', 'wind', 'visibility', 'precipitation', 'uv', 'solar',
    'pollen', 'report', 'value', 'sun', 'sun_times', 'moon', 'forecast_daily', 'forecast_hourly', 'chart', 'radar', 'sensor', 'image', 'card'];
  const GROUPS = ['current', 'measure', 'astro', 'forecast', 'other'];

  const showTitle = (el, def) => (def.titled === false ? false : (el.show_title !== undefined ? el.show_title !== false : def.titleDefault !== false));

  const render = (el, m, ctx) => {
    const def = TYPES[el.type];
    if (!def) {
      return html`<div class="fwc-el style-tile" data-fwc-id=${el.id}><div class="fwc-empty warn"><ha-icon icon="mdi:help-circle-outline"></ha-icon><span>${el.type}</span></div></div>`;
    }
    // Fehler in einem Element dürfen nie die ganze Card leer machen
    const safe = (fn, fallback = '') => {
      try { return fn(); } catch (e) {
        console.error('[flexible-weather-card]', el.type, e);
        return fallback === null ? html`<div class="fwc-empty warn"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${e.message}</span></div>` : fallback;
      }
    };
    const body = safe(() => def.render(el, m, ctx), null);
    const style = el.style || def.style || ctx.config.tile_style || 'tile';
    const titled = showTitle(el, def);
    const label = el.title || (def.label ? def.label(el, ctx) : ctx.t(`el.${el.type}`));
    const accent = el.color || def.accent || 'var(--primary-color)';
    const click = !ctx.design && ctx.clickable ? ctx.clickable(el, def) : false;
    const grow = def.grow ? safe(() => def.grow(el, m, ctx), false) : false;
    return html`<div class="fwc-el t-${el.type} style-${style} ${def.flush ? 'flush' : ''} ${titled ? 'titled' : ''} ${click ? 'clickable' : ''} ${grow ? 'grow' : ''}"
        data-fwc-id=${el.id} style="--fwc-accent:${accent}${U.isNum(Number(el.radius)) && el.radius !== '' && el.radius !== undefined ? `;--fwc-radius:${Number(el.radius)}px` : ''}" @click=${(e) => ctx.onTap && ctx.onTap(e, el, def)}>
      ${def.background ? safe(() => def.background(el, m, ctx)) : ''}
      ${titled ? html`<div class="fwc-head"><ha-icon .icon=${def.icon}></ha-icon><span class="fwc-title">${label}</span>${def.headExtra ? safe(() => def.headExtra(el, m, ctx)) : ''}</div>` : ''}
      <div class="fwc-body">${body}</div>
    </div>`;
  };

  // Welche Daten brauchen die Elemente insgesamt? (Online-Abruf nur bei Bedarf)
  const needs = (elements) => {
    const out = { fields: {}, daily: false, hourly: false, condition: false, warnings: null, fhum: false, fpress: false, solar: false, pollen: null };
    (elements || []).forEach((el) => {
      const def = TYPES[el.type];
      if (!def || !def.needs) return;
      const n = def.needs(el) || {};
      Object.assign(out.fields, n.fields || {});
      out.daily = out.daily || !!n.daily;
      out.hourly = out.hourly || !!n.hourly;
      out.condition = out.condition || !!n.condition;
      out.fhum = out.fhum || !!n.fhum;
      out.fpress = out.fpress || !!n.fpress;
      out.solar = out.solar || !!n.solar;
      if (n.solar) out.hourly = true;
      if (n.pollen) {
        out.pollen = out.pollen || { entities: [], online: false };
        out.pollen.entities = [...new Set([...out.pollen.entities, ...(n.pollen.entities || [])])];
        out.pollen.online = out.pollen.online || n.pollen.online !== false;
      }
      if (n.warnings) {
        out.warnings = out.warnings || { entities: [], online: false };
        out.warnings.entities = [...new Set([...out.warnings.entities, ...(n.warnings.entities || [])])];
        out.warnings.online = out.warnings.online || n.warnings.online !== false;
      }
    });
    return out;
  };

  const create = (type, cols, extra = {}) => {
    const def = TYPES[type];
    const el = { id: `${type}_${U.uid().slice(0, 4)}`, type, x: 0, y: 0, w: Math.min(def.w, cols), h: def.h };
    (def.fields || []).forEach((f) => { if (f.def !== undefined && f.def !== null && f.type === 'select') el[f.key] = f.def; });
    if (type === 'value') el.metric = 'humidity';
    return { ...el, ...extra };
  };

  /* ----------------------------------------------------------------------------------------------
   * Styles aller Elemente (HA-Variablen, Container Queries)
   * -------------------------------------------------------------------------------------------- */
  const styles = css`
    .fwc-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
    fwc-svg { display: contents; }
    fwc-svg > svg { display: block; }
    .u { font-size: .42em; font-weight: 400; margin-left: .12em; opacity: .7; letter-spacing: 0; }

    /* --- Rahmen ------------------------------------------------------------------------------ */
    .fwc-el {
      position: relative; box-sizing: border-box; height: 100%; width: 100%; min-width: 0; overflow: hidden;
      display: flex; flex-direction: column; border-radius: var(--fwc-radius); padding: var(--fwc-el-pad, 10px 12px);
      container-type: size; color: var(--primary-text-color); transition: background-color .2s, box-shadow .2s;
    }
    .fwc-el.style-tile { background: var(--fwc-tile-bg); }
    .fwc-el.style-outline { border: 1px solid var(--divider-color); }
    .fwc-el.style-flat { background: transparent; }
    .fwc-el.style-none { background: transparent; padding: 0 2px; }
    .fwc-el.style-accent { background: color-mix(in srgb, var(--fwc-accent) 14%, transparent); }
    .fwc-el.flush { padding: 0; }
    .fwc-el.clickable { cursor: pointer; }
    .fwc-el.clickable:hover { background-color: var(--fwc-tile-hover); }
    .fwc-el.style-none.clickable:hover, .fwc-el.style-flat.clickable:hover { background-color: transparent; }
    .fwc-head { display: flex; align-items: center; gap: 6px; min-height: 18px; margin-bottom: 4px; color: var(--secondary-text-color);
      font-size: calc(12px * var(--fwc-scale, 1)); font-weight: 500; letter-spacing: .2px; white-space: nowrap; flex-shrink: 0; }
    .fwc-head ha-icon { --mdc-icon-size: 16px; color: var(--fwc-accent); flex-shrink: 0; }
    .fwc-title { overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .badge { min-width: 18px; height: 18px; border-radius: 9px; color: #111; font-size: calc(11px * var(--fwc-scale, 1)); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; box-sizing: border-box; }
    .fwc-body { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
    /* Element wächst mit seinem Inhalt (z. B. aufgeklappte Wetterwarnung); die Card vergrößert dafür seine Rasterzeile */
    .fwc-el.grow { height: auto; min-height: 100%; container-type: inline-size; }
    .fwc-el.grow > .fwc-body { flex: none; justify-content: flex-start; }
    .fwc-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 100%; text-align: center;
      color: var(--secondary-text-color); font-size: calc(12px * var(--fwc-scale, 1)); line-height: 1.3; opacity: .85; padding: 2px; overflow: hidden; }
    .fwc-empty ha-icon { --mdc-icon-size: 22px; opacity: .7; }
    .fwc-empty.warn { color: var(--error-color, #db4437); }
    @container (max-height: 60px) { .fwc-empty { flex-direction: row; } .fwc-empty ha-icon { --mdc-icon-size: 18px; } }
    @container (max-height: 52px) { .fwc-el.titled .fwc-head { display: none; } }

    /* --- Animationen ------------------------------------------------------------------------- */
    .fwc-a-spin { transform-box: fill-box; transform-origin: center; animation: fwc-spin 24s linear infinite; }
    .fwc-a-pulse { transform-box: fill-box; transform-origin: center; animation: fwc-pulse 4s ease-in-out infinite; }
    .fwc-a-drift { animation: fwc-drift 7s ease-in-out infinite alternate; }
    .fwc-a-slow { animation-duration: 11s; animation-direction: alternate-reverse; }
    .fwc-a-drop { animation: fwc-drop 1.6s linear infinite; }
    .fwc-a-snow { animation: fwc-snow 4.2s linear infinite; }
    .fwc-a-bolt { animation: fwc-bolt 4s linear infinite; }
    .fwc-a-fog { animation: fwc-fog 6s ease-in-out infinite alternate; }
    .fwc-a-wind { stroke-dasharray: 70 40; animation: fwc-wind 2.6s linear infinite; }
    .fwc-a-twinkle { animation: fwc-twinkle 3s ease-in-out infinite; }
    .fwc-a-fall { animation: fwc-fall 1.6s linear infinite; }
    .fwc-a-flake { animation: fwc-flake 6s linear infinite; }
    .fwc-a-flow { animation: fwc-flow 1.2s linear infinite; }
    .fwc-a-wave { animation: fwc-wave 2.4s linear infinite; }
    .fwc-a-haze { animation: fwc-haze 8s ease-in-out infinite alternate; }
    @keyframes fwc-spin { to { transform: rotate(360deg); } }
    @keyframes fwc-pulse { 0%, 100% { transform: scale(.9); opacity: .75; } 50% { transform: scale(1.1); opacity: 1; } }
    @keyframes fwc-drift { from { transform: translateX(-2.5px); } to { transform: translateX(2.5px); } }
    @keyframes fwc-drop { 0% { transform: translate(0, -4px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-3px, 12px); opacity: 0; } }
    @keyframes fwc-snow { 0% { transform: translate(0, -4px); opacity: 0; } 20% { opacity: 1; } 60% { transform: translate(2px, 6px); } 100% { transform: translate(-2px, 13px); opacity: 0; } }
    @keyframes fwc-bolt { 0%, 80%, 86%, 100% { opacity: .15; } 82%, 84%, 88% { opacity: 1; } }
    @keyframes fwc-fog { from { transform: translateX(-3px); } to { transform: translateX(3px); } }
    @keyframes fwc-wind { from { stroke-dashoffset: 110; } to { stroke-dashoffset: 0; } }
    @keyframes fwc-twinkle { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
    @keyframes fwc-fall { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translate(-6px, 64px); opacity: 0; } }
    @keyframes fwc-flake { 0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; } 50% { transform: translate(5px, 32px); } 100% { transform: translate(-3px, 66px); opacity: 0; } }
    @keyframes fwc-flow { to { stroke-dashoffset: -14; } }
    @keyframes fwc-wave { from { transform: translateX(0); } to { transform: translateX(16px); } }
    @keyframes fwc-haze { from { opacity: .85; } to { opacity: 1; } }
    .no-anim *, .no-anim *::before, .no-anim *::after { animation: none !important; }
    @media (prefers-reduced-motion: reduce) { .fwc-grid * { animation: none !important; } }

    /* --- Titel ------------------------------------------------------------------------------- */
    .hdr { display: flex; align-items: center; gap: 12px; height: 100%; }
    .hdr.a-center { justify-content: center; text-align: center; }
    .hdr.a-right { flex-direction: row-reverse; text-align: right; }
    .hdr-txt { min-width: 0; flex: 1; }
    .hdr.a-center .hdr-txt { flex: 0 1 auto; }
    .hdr-title { font-size: calc(var(--ha-card-header-font-size, 20px) * var(--fwc-scale, 1)); font-size: calc(clamp(16px, 34cqh, 24px) * var(--fwc-scale, 1)); font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hdr-sub { font-size: calc(clamp(11px, 22cqh, 14px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
    .hdr-cond { display: flex; align-items: center; gap: 4px; font-size: calc(clamp(14px, 32cqh, 20px) * var(--fwc-scale, 1)); font-weight: 500; flex-shrink: 0; }
    .hdr-cond .fwc-wi { width: clamp(28px, 80cqh, 44px); height: auto; }

    /* --- Aktuell ----------------------------------------------------------------------------- */
    .cur { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "icon main side"; align-items: center; column-gap: clamp(8px, 4cqw, 20px); height: 100%; }
    .cur.has-det { grid-template-areas: "icon main side" "icon det det"; grid-template-rows: 1fr auto; }
    .cur-icon { grid-area: icon; height: min(100cqh, 34cqw); aspect-ratio: 1; display: flex; align-self: center; }
    .cur-icon .fwc-wi { width: 100%; height: 100%; overflow: visible; }
    .cur-main { grid-area: main; min-width: 0; max-width: 100%; padding-right: 4px; }
    .cur-temp { font-size: calc(clamp(30px, min(36cqh, 16cqw), 84px) * var(--fwc-scale, 1)); font-weight: 400; line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cur-temp .u { font-size: .4em; vertical-align: top; position: relative; top: .25em; margin-left: .08em; }
    .cur-cond { margin-top: 4px; font-size: calc(clamp(13px, 10cqh, 18px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cur-side { grid-area: side; display: flex; flex-direction: column; gap: clamp(2px, 3cqh, 8px); align-items: flex-end; font-size: calc(clamp(12px, 8cqh, 15px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; }
    .cur-fl b { color: var(--primary-text-color); font-weight: 500; }
    .cur-hl { display: flex; gap: 10px; }
    .cur-hl span, .cur-det span { display: inline-flex; align-items: center; }
    .cur-hl .hi { color: var(--primary-text-color); font-weight: 500; }
    .cur-hl ha-icon { --mdc-icon-size: 16px; }
    .cur-hl .hi ha-icon { color: var(--red-color, #f44336); }
    .cur-hl .lo ha-icon { color: var(--blue-color, #2196f3); }
    .cur-det { grid-area: det; display: flex; gap: 6px 14px; flex-wrap: wrap; justify-content: flex-start; font-size: calc(clamp(12px, 7.5cqh, 14px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); padding-top: 2px; }
    .cur-det ha-icon { --mdc-icon-size: 16px; margin-right: 3px; color: var(--fwc-accent); opacity: .9; }
    @container (max-height: 84px) { .cur.has-det { grid-template-areas: "icon main side"; grid-template-rows: 1fr; } .cur-det { display: none; } }
    @container (max-height: 100px) { .cur-cond { display: none; } }
    /* Schmale Elemente (z. B. Tablet): nichts ausblenden – Gefühlt / Max / Min und die Details rutschen unter die Temperatur.
       Mit Symbol braucht die breite Anordnung mehr Platz (bis 300 px), die Szene nur bis 250 px (Regeln weiter unten). */
    @container (max-width: 300px) {
      .cur:not(.scene), .cur.has-det:not(.scene) { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "icon main" "side side" "det det"; grid-template-rows: auto auto auto; row-gap: clamp(2px, 2.5cqh, 6px); align-content: center; }
      .cur:not(.scene) .cur-icon { height: min(48cqh, 30cqw); align-self: center; }
      .cur:not(.scene) .cur-temp { font-size: calc(clamp(24px, min(28cqh, 17cqw), 56px) * var(--fwc-scale, 1)); }
      .cur:not(.scene) .cur-cond { font-size: calc(clamp(12px, 8cqh, 15px) * var(--fwc-scale, 1)); margin-top: 2px; }
      .cur:not(.scene) .cur-side { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 2px 12px; font-size: calc(clamp(11px, 7cqh, 13px) * var(--fwc-scale, 1)); }
      .cur:not(.scene) .cur-det { gap: 2px 10px; font-size: calc(clamp(11px, 7cqh, 13px) * var(--fwc-scale, 1)); padding-top: 0; }
      .cur:not(.scene) .cur-hl { gap: 6px; }
      .cur:not(.scene) .cur-hl ha-icon, .cur:not(.scene) .cur-det ha-icon { --mdc-icon-size: 14px; }
    }
    /* sehr schmal und niedrig: nur noch die Details weglassen */
    @container (max-width: 300px) and (max-height: 84px) { .cur:not(.scene) .cur-det { display: none; } .cur.has-det:not(.scene) { grid-template-areas: "icon main" "side side"; } }
    @container (max-width: 170px) and (min-height: 130px) {
      .cur:not(.scene), .cur.has-det:not(.scene) { grid-template-columns: 1fr; grid-template-areas: "icon" "main" "side" "det"; grid-template-rows: minmax(0, 1fr) auto auto auto; justify-items: center; text-align: center; align-content: center; }
      .cur:not(.scene) .cur-icon { height: min(40cqh, 60cqw); } .cur:not(.scene) .cur-temp { font-size: calc(clamp(24px, 26cqw, 48px) * var(--fwc-scale, 1)); }
      .cur:not(.scene) .cur-side, .cur:not(.scene) .cur-det { justify-content: center; }
      .cur.scene { text-align: center; justify-items: center; }
    }


    /* --- 3D Wetter ---------------------------------------------------------------------------- */
    .w3d { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; perspective: calc(100cqw + 420px); perspective-origin: 50% 40%;
      background: var(--fwc-tile-bg, rgba(128,128,128,.08)); --S: min(30cqw, 44cqh); --T: calc(var(--S) * .16); --ix: 23cqw; --iy: 73cqh; }
    .w3d.noscene { background: var(--fwc-tile-bg, rgba(128,128,128,.08)); }
    .w3d-stage { position: absolute; inset: 0; transform-style: preserve-3d; }
    .w3d-sway { position: absolute; inset: 0; transform-style: preserve-3d; }
    .w3d-sky { position: absolute; inset: 0; opacity: .74;
      -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 24%, transparent 71%); mask-image: linear-gradient(to bottom, #000 0%, #000 24%, transparent 71%); }
    .w3d-sky fwc-svg, .w3d-sun fwc-svg { display: block; width: 100%; height: 100%; }
    .w3d-sky svg { display: block; width: 100%; height: 100%; }
    .w3d-sun { position: absolute; --sw: min(92cqh, 70cqw); width: var(--sw); height: var(--sw); pointer-events: none; opacity: .85;
      left: calc(var(--ix) + var(--S) * .6 - var(--sw) / 2); top: calc(var(--iy) - var(--S) * .92 - var(--sw) / 2); }
    .w3d.noland .w3d-sun { left: calc(70cqw - var(--sw) / 2); top: calc(34cqh - var(--sw) / 2); }
    /* Werte direkt in der Grafik: frei im Raum, ohne Linien und Boxen */
    .w3d-tags { position: absolute; inset: 0; pointer-events: none; }
    .w3d-tag { position: absolute; pointer-events: none; line-height: 1; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.45); }
    /* Temperatur: oben links */
    .w3d-tag.temp { left: calc(5cqw + 5px); top: calc(6cqh + 5px); display: flex; align-items: baseline; gap: .08em; color: var(--c); font-size: calc(clamp(18px, min(11cqh, 9cqw), 34px) * var(--fwc-scale, 1)); font-weight: 600; }
    .w3d-tag.temp small { font-size: .42em; opacity: .85; font-weight: 500; }
    /* Liste: rechts unten neben der Inselkante, unter Sonne / Mond */
    .w3d-tag.list { left: 50%; bottom: 5cqh; transform: translateX(-50%); display: flex; align-items: center; gap: 1.1em; font-size: calc(clamp(8px, min(6cqh, 4.6cqw), 15px) * var(--fwc-scale, 1)); }
    /* 3D-Erde */
    .fe { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; container-type: size; }
    .fe.stars { background: radial-gradient(ellipse at 50% 45%, #0c1b36 0%, #060c1a 62%, #02050c 100%); }
    .fe-stars { position: absolute; inset: 0; display: block; }
    .fe-stars svg { display: block; width: 100%; height: 100%; }
    fwc-earth { position: absolute; inset: 0; display: block; }
    fwc-earth.fe-drag { cursor: grab; touch-action: pan-y; }
    fwc-earth.fe-grab { cursor: grabbing; }
    fwc-earth canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    fwc-earth canvas.fe-wind { pointer-events: none; }
    fwc-earth::before { content: ''; position: absolute; left: 50%; top: 50%; width: 86cqmin; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%;
      background: radial-gradient(circle at 36% 34%, #2a5a92, #0d2547 62%, #06142b); box-shadow: 0 0 24px 4px rgba(90,150,255,.3); transition: opacity .8s; pointer-events: none; }
    fwc-earth.fe-ready::before { opacity: 0; }
    fwc-earth.fe-fb::before { opacity: 1; background: radial-gradient(circle at 34% 32%, rgba(255,255,255,.2), rgba(0,0,0,0) 42%, rgba(0,0,0,.6) 100%), var(--fe-img) var(--fe-x, 0) 50% / auto 100% repeat-x; }
    fwc-earth.fe-fb.fe-spin::before { animation: fe-scroll 120s linear infinite; }
    @keyframes fe-scroll { from { background-position: 0 0, var(--fe-x, 0) 50%; } to { background-position: 0 0, calc(var(--fe-x, 0px) + 172cqmin) 50%; } }
    .fe-mark { position: absolute; left: 0; top: 0; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #ff5545; pointer-events: none;
      box-shadow: 0 0 0 1.5px #fff, 0 0 8px 2px rgba(255,85,69,.75); will-change: transform; }
    .fe-mark::after { content: ''; position: absolute; inset: -1.5px; border-radius: 50%; border: 1.5px solid #ff8a7a; animation: fe-pulse 2.6s ease-out infinite; }
    .fe.noanim .fe-mark::after { display: none; }
    @keyframes fe-pulse { from { transform: scale(1); opacity: .9; } to { transform: scale(3.4); opacity: 0; } }
    .fe-msg { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); max-width: 70%; color: rgba(255,255,255,.8); font-size: 12px; text-align: center; pointer-events: none; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
    .fe-main { position: absolute; left: clamp(8px, 3cqw, 16px); top: clamp(6px, 2.6cqh, 14px); z-index: 2; pointer-events: none; color: #fff; }
    .fe-main .w3d-temp { font-size: calc(clamp(24px, min(13cqh, 11cqw), 54px) * var(--fwc-scale, 1)); }
    .fe-vals { position: absolute; left: clamp(8px, 3cqw, 16px); bottom: clamp(6px, 2.6cqh, 14px); z-index: 2; display: flex; flex-wrap: wrap; gap: .4em 1em; max-width: 72%;
      color: #fff; font-size: calc(clamp(10px, min(5cqh, 3.8cqw), 14px) * var(--fwc-scale, 1)); text-shadow: 0 1px 3px rgba(0,0,0,.7); pointer-events: none; }
    .fe-attr { position: absolute; right: 8px; bottom: 5px; z-index: 2; font-size: 9px; letter-spacing: .2px; color: rgba(255,255,255,.5); pointer-events: none; }
    .fe.has-vals .fe-attr { bottom: auto; top: 6px; }
    .fe:not(.stars) .fe-main, .fe:not(.stars) .fe-vals { color: var(--primary-text-color); }
    .fe:not(.stars) .fe-attr { color: var(--secondary-text-color); }
    .w3d-vr { display: flex; align-items: center; gap: .32em; white-space: nowrap; }
    .w3d-vr b { font-weight: 600; font-size: 1.12em; font-variant-numeric: tabular-nums; }
    .w3d-vr small { font-size: .78em; opacity: .82; margin-left: -.1em; }
    .w3d-vr ha-icon { --mdc-icon-size: 1.25em; color: var(--c); display: inline-flex; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
    .w3d-vr .w3d-arrow { width: 1.25em; height: 1.25em; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
    /* Insel leicht nach links oben, damit unten rechts Platz für die Liste ist (Größe bleibt) */
    .w3d.solo.vals { --ix: 50cqw; --iy: 55cqh; }
    /* mit Wertekarten: Liste links unten neben der Insel statt rechts */
    .w3d.vals:not(.solo) .w3d-tag.list { left: var(--ix); bottom: auto; top: calc(var(--iy) + var(--S) * .44); gap: .8em; font-size: calc(clamp(8px, min(4.6cqh, 3.6cqw), 13px) * var(--fwc-scale, 1)); }
    @container (max-width: 240px) { .w3d-vr ha-icon, .w3d-vr .w3d-arrow { --mdc-icon-size: 1.1em; } .w3d-tag.list { gap: .7em; } .w3d-vr { gap: .22em; } }
    /* sanftes Schweben */
    /* Dämmerung: warmes Leuchten am Horizont und leicht oranges Abendlicht über der Szene */
    .w3d-dusk-glow { position: absolute; left: -10%; right: -10%; top: 20%; height: 60%; pointer-events: none;
      background: radial-gradient(ellipse 60% 55% at 72% 70%, rgba(255,150,80,.55), rgba(255,120,90,.18) 55%, transparent 75%);
      -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent 95%); mask-image: linear-gradient(to bottom, #000 40%, transparent 95%); }
    .w3d-dusk { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(200deg, rgba(255,140,70,.22), rgba(255,110,90,.08) 55%, rgba(80,60,140,.12)); }
    .w3d-sun svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .w3d-rays { position: absolute; inset: 0; animation: fwc-spin 120s linear infinite; will-change: transform; }
    .w3d-cl { position: absolute; pointer-events: none; }
    .w3d-cl img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
    .w3d-drift { animation: w3d-drift 40s ease-in-out infinite alternate; }
    @keyframes w3d-drift { from { transform: translateX(-3.5cqw); } to { transform: translateX(3.5cqw); } }
    /* Insel */
    .w3d-isle-pos { position: absolute; left: calc(var(--ix) - var(--S) / 2); top: calc(var(--iy) - var(--S) / 2); width: var(--S); height: var(--S); transform-style: preserve-3d; }
    .w3d-shadow { position: absolute; left: 4%; right: 4%; top: 72%; height: 40%; background: radial-gradient(ellipse at center, rgba(0,0,0,.32), transparent 68%); transform: translateZ(-30px); }
    .w3d-isle { position: absolute; inset: 0; transform-style: preserve-3d; transform: rotateX(var(--tx, 63deg)) rotateZ(-38deg); }
    .w3d-top { position: absolute; inset: 0; transform: translateZ(var(--T)); border-radius: 5%;
      background: radial-gradient(circle at 28% 22%, rgba(255,255,255,.22), transparent 55%), linear-gradient(135deg, var(--g1), var(--g2)); box-shadow: inset 0 0 0 2px rgba(255,255,255,.12); }
    .w3d-isle.dry .w3d-top { background:
      repeating-linear-gradient(35deg, transparent 0 22px, rgba(90,60,20,.16) 22px 23.5px), repeating-linear-gradient(-50deg, transparent 0 30px, rgba(90,60,20,.14) 30px 31.5px),
      radial-gradient(circle at 28% 22%, rgba(255,255,255,.2), transparent 55%), linear-gradient(135deg, var(--g1), var(--g2)); }
    .w3d-isle.frosty .w3d-top { background: radial-gradient(circle at 20% 30%, rgba(255,255,255,.55) 0 2px, transparent 3px) 0 0 / 22px 19px, radial-gradient(circle at 60% 70%, rgba(255,255,255,.45) 0 1.5px, transparent 2.5px) 0 0 / 17px 23px,
      radial-gradient(circle at 28% 22%, rgba(255,255,255,.3), transparent 55%), linear-gradient(135deg, var(--g1), var(--g2)); }
    .w3d-isle.wet .w3d-top { box-shadow: inset 0 0 0 2px rgba(255,255,255,.12), inset 0 0 40px rgba(20,60,100,.25); }
    .w3d-pond { position: absolute; left: 26%; top: 56%; width: 54%; height: 34%; display: block; }
    .w3d-pond svg { display: block; width: 100%; height: 100%; overflow: visible; }
    /* Dürre: Wasser zieht sich zurück, Ufer liegt trocken */
    .w3d-isle.dry .w3d-pond .pd-w { transform: translate(49%, 52%) scale(.66) translate(-49%, -52%); transform-box: view-box; }
    /* Schnee / Frost: zugefroren – helles Eis statt tiefem Wasser */
    .w3d-isle.snowy .w3d-pond .pd-deep, .w3d-isle.frosty .w3d-pond .pd-deep { opacity: .12; }
    .w3d-isle.snowy .w3d-pond .pd-reed { opacity: .55; }
    .w3d-sides, .w3d-sides .sd { position: absolute; inset: 0; transform-style: preserve-3d; }
    .w3d-sides .f { position: absolute; left: 0; top: 100%; width: 100%; height: var(--T); transform-origin: 50% 0; transform: translateZ(var(--T)) rotateX(-90deg); backface-visibility: hidden;
      background: radial-gradient(circle at 18% 62%, rgba(0,0,0,.22) 0 3px, transparent 4px), radial-gradient(circle at 54% 78%, rgba(255,255,255,.14) 0 3px, transparent 4px), radial-gradient(circle at 82% 56%, rgba(0,0,0,.2) 0 2.5px, transparent 3.5px),
        linear-gradient(180deg, var(--lip) 0 15%, var(--s1) 15%, var(--s2)); }
    .w3d-sides .sd:nth-child(2) .f { box-shadow: inset 0 0 0 99px rgba(0,0,0,.22); }
    .w3d-isle.snowy .w3d-sides .f, .w3d-isle.frosty .w3d-sides .f { background: radial-gradient(circle at 18% 62%, rgba(255,255,255,.4) 0 2px, transparent 3px), radial-gradient(circle at 60% 74%, rgba(190,225,245,.5) 0 2.5px, transparent 3.5px),
      linear-gradient(180deg, var(--lip) 0 22%, var(--s1) 22%, var(--s2)); }
    .w3d-tree { position: absolute; left: calc(var(--x) * var(--S)); top: calc(var(--y) * var(--S)); width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(var(--T)); }
    .w3d-tree i { position: absolute; left: calc(var(--S) * var(--w) / -2); top: calc(var(--S) * var(--h) * -1); width: calc(var(--S) * var(--w)); height: calc(var(--S) * var(--h));
      transform-origin: 50% 100%; transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)); }
    .w3d-tree i.on { animation: w3d-tsway var(--dur, 3s) ease-in-out infinite; }
    @keyframes w3d-tsway { 0%, 100% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) rotate(calc(var(--amp) * .2)); } 50% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) rotate(var(--amp)); } }
    .w3d-tree i svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .w3d-tree .snowcap { display: none; }
    .w3d-isle.snowy .w3d-tree .snowcap { display: inline; }
    .w3d-tb { position: absolute; left: calc(var(--x) * var(--S)); top: calc(var(--y) * var(--S)); width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(var(--T)) rotateZ(var(--yaw)); }
    .w3d-tb .pole { position: absolute; left: calc(var(--S) * -.022); top: calc(var(--S) * -.6); width: calc(var(--S) * .044); height: calc(var(--S) * .6); transform-origin: 50% 100%; transform: rotateX(-90deg);
      background: linear-gradient(90deg, #b4c0cb, #fff 45%, #c4ced8); clip-path: polygon(34% 0, 66% 0, 100% 100%, 0 100%); }
    .w3d-tb .pole.q { transform: rotateX(-90deg) rotateY(90deg); }
    /* Gondel: länglicher Kasten hinter dem Rotor – so sieht man auch von der Seite, woher der Wind kommt */
    .w3d-tb .nac { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(calc(var(--S) * .6));
      --nw: calc(var(--S) * .036); --nh: calc(var(--S) * .039); --y0: calc(var(--S) * -.062); --nl: calc(var(--S) * .098); }
    .w3d-tb .nac i { position: absolute; display: block; }
    .w3d-tb .nac .t, .w3d-tb .nac .b { left: calc(var(--nw) / -2); top: var(--y0); width: var(--nw); height: var(--nl); }
    .w3d-tb .nac .t { transform: translateZ(calc(var(--nh) / 2)); background: linear-gradient(90deg, #e4eaef, #fff 50%, #dfe6ec); border-radius: 0 0 4px 4px / 0 0 3px 3px; }
    .w3d-tb .nac .b { transform: translateZ(calc(var(--nh) / -2)); background: #aab6c1; }
    .w3d-tb .nac .l, .w3d-tb .nac .r { left: calc(var(--nh) / -2); top: var(--y0); width: var(--nh); height: var(--nl); background: linear-gradient(0deg, #f4f7f9, #d6dee5); border-radius: 0 0 3px 3px; }
    .w3d-tb .nac .l { transform: translateX(calc(var(--nw) / -2)) rotateY(90deg); }
    .w3d-tb .nac .r { transform: translateX(calc(var(--nw) / 2)) rotateY(90deg); background: linear-gradient(0deg, #e3e9ee, #c3ccd5); }
    .w3d-tb .nac .e, .w3d-tb .nac .f { left: calc(var(--nw) / -2); width: var(--nw); height: var(--nh); background: #c9d2da; border-radius: 3px; }
    .w3d-tb .nac .e { top: calc(var(--y0) - var(--nh) / 2); transform: rotateX(90deg); }
    .w3d-tb .nac .f { top: calc(var(--y0) + var(--nl) - var(--nh) / 2); transform: rotateX(90deg); background: #dde4ea; }
    /* Nabe (Spitze vor dem Rotor), von vorn und von der Seite rund */
    .w3d-tb .nose { position: absolute; left: calc(var(--S) * -.02); top: calc(var(--S) * -.02); width: calc(var(--S) * .04); height: calc(var(--S) * .04); border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, #fff, #d3dbe2); transform: translate3d(0, calc(var(--S) * .058), calc(var(--S) * .6)) rotateX(-90deg); }
    .w3d-tb .nose.q { border-radius: 50% 50% 50% 50% / 50%; width: calc(var(--S) * .034); left: calc(var(--S) * -.017); background: linear-gradient(90deg, #f2f5f8, #cdd6de);
      transform: translate3d(0, calc(var(--S) * .055), calc(var(--S) * .6)) rotateX(-90deg) rotateY(90deg); }
    .w3d-tb .rotor { position: absolute; left: calc(var(--S) * -.22); top: calc(var(--S) * -.22); width: calc(var(--S) * .44); height: calc(var(--S) * .44);
      transform: translate3d(0, calc(var(--S) * .05), calc(var(--S) * .6)) rotateX(-90deg); }
    .w3d-tb .rotor, .w3d-tb .rotor span { transform-style: preserve-3d; }
    .w3d-tb .rotor span { display: block; width: 100%; height: 100%; }
    /* Blatt-Profil quer zur Rotorfläche: von der Seite sieht man die Blätter als schmale Flächen, sie drehen sich mit */
    .w3d-tb .rotor .edge { position: absolute; left: 46.5%; top: 2%; width: 7%; height: 44%; transform-origin: 50% 100%;
      transform: rotate(var(--r)) rotateY(90deg); background: linear-gradient(90deg, #c9d3dc, #f4f7fa 45%, #dfe6ec);
      clip-path: polygon(38% 0, 62% 0, 100% 92%, 60% 100%, 40% 100%, 0 92%); }
    .w3d-tb .rotor svg { display: block; width: 100%; height: 100%; }
    .w3d-spin { animation: fwc-spin linear infinite; }
    /* Flugbefeuerung am Windrad (nachts) */
    .w3d-tb .beacon { position: absolute; left: calc(var(--S) * -.016); top: calc(var(--S) * -.016); width: calc(var(--S) * .032); height: calc(var(--S) * .032); border-radius: 50%;
      background: radial-gradient(circle, #ff6b6b 0 35%, rgba(255,40,40,.55) 50%, transparent 72%);
      transform: translate3d(0, 0, calc(var(--S) * .655)) rotateZ(calc(var(--yaw) * -1)) rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)); }
    .w3d-tb .beacon.on { animation: w3d-beacon 1.6s steps(1) infinite; }
    @keyframes w3d-beacon { 0% { opacity: 1; } 40% { opacity: .08; } }
    /* Billboards (zur Kamera gedreht): Hütte, Schneemann, Enten, Schmetterlinge, Blitz */
    .w3d-bb { position: absolute; left: calc(var(--x) * var(--S)); top: calc(var(--y) * var(--S)); width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(var(--T)); }
    .w3d-bb > i { position: absolute; left: calc(var(--S) * var(--w) / -2); top: calc(var(--S) * var(--h) * -1); width: calc(var(--S) * var(--w)); height: calc(var(--S) * var(--h));
      transform-origin: 50% 100%; transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)); }
    .w3d-bb svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .w3d-bb.hut > i { left: calc(var(--S) * var(--w) * -.4); }
    .w3d-bb.hut .hsnow { display: none; }
    .w3d-bb.hut.snow .hsnow { display: inline; }
    .w3d-bb.hut.lit .hw { filter: drop-shadow(0 0 2px #ffb840); }
    .w3d-bb.hut .hs { position: absolute; width: 8%; height: 4.4%; margin: -2.2% 0 0 -4%; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #f0f3f6, #cfd5dc 70%); opacity: 0; }
    .w3d-bb.hut .hs.d { background: radial-gradient(circle at 40% 35%, #b7bec6, #8d96a0 70%); width: 7%; height: 3.9%; }
    .w3d-bb.hut.anim .hs { animation: w3d-smoke 6s ease-out infinite; }
    .w3d-bb.hut:not(.anim) .hs:nth-of-type(-n+3) { opacity: .8; }
    .w3d-bb.hut:not(.anim) .hs:nth-of-type(2) { transform: translate(calc(var(--sdx, 6) * 70%), -180%) scale(1.4); }
    .w3d-bb.hut:not(.anim) .hs:nth-of-type(3) { transform: translate(calc(var(--sdx, 6) * 140%), -360%) scale(1.9); opacity: .55; }
    @keyframes w3d-smoke { 0% { transform: translate(0, 0) scale(.45); opacity: 0; } 10% { opacity: .95; }
      55% { transform: translate(calc(var(--sdx, 6) * 20%), -520%) scale(1.9); opacity: .7; }
      100% { transform: translate(calc(var(--sdx, 6) * 42%), -1000%) scale(3.2); opacity: 0; } }
    .w3d-bb.duck.on > i { animation: w3d-duck 10s ease-in-out infinite alternate; animation-delay: var(--sw); }
    @keyframes w3d-duck { 0% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(-40%, 0); } 25% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(-10%, -6%); }
      50% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(25%, 0); } 75% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(55%, -6%); } 100% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(90%, 0); } }
    .w3d-bb.fly > i { top: calc(var(--S) * (var(--h) + var(--fz)) * -1); }
    .w3d-bb.fly.on > i { animation: w3d-fly var(--fd) ease-in-out infinite; animation-delay: var(--fdl); }
    @keyframes w3d-fly { 0%, 100% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(0, 0); } 25% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(160%, -90%); }
      50% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(60%, -180%); } 75% { transform: rotateZ(38deg) rotateX(calc(var(--tx, 63deg) * -1)) translate(-120%, -70%); } }
    .w3d-bb.fly.on svg { animation: w3d-flap .22s ease-in-out infinite alternate; }
    @keyframes w3d-flap { from { transform: scaleX(1); } to { transform: scaleX(.3); } }
    .w3d-bb.strike svg { opacity: 0; filter: drop-shadow(0 0 3px #fff6c0); }
    .w3d-bb.strike.on svg { animation: fwc-sc-bolt 7s linear infinite; }
    .w3d-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0;
      background: radial-gradient(ellipse calc(var(--S) * .7) calc(var(--S) * .45) at var(--ix) calc(var(--iy) - var(--S) * .08), rgba(255,248,210,.95), rgba(255,248,210,0)); }
    .w3d-glow.on { animation: w3d-glow 7s linear infinite; }
    @keyframes w3d-glow { 0%, 62%, 64.5%, 66%, 100% { opacity: 0; } 63% { opacity: .75; } 65% { opacity: .45; } }
    /* Windsack */
    .w3d-ws { position: absolute; left: calc(var(--x) * var(--S)); top: calc(var(--y) * var(--S)); width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(var(--T)); }
    .w3d-ws .pole { position: absolute; left: calc(var(--S) * -.007); top: calc(var(--S) * -.26); width: calc(var(--S) * .014); height: calc(var(--S) * .26); transform-origin: 50% 100%; transform: rotateX(-90deg); background: linear-gradient(90deg, #8b96a1, #e6ebf0, #9aa5b0); }
    .w3d-ws .pole.q { transform: rotateX(-90deg) rotateY(90deg); }
    .w3d-ws.big { --S2: 1.5; }
    .w3d-ws.big .pole { left: calc(var(--S) * -.01); top: calc(var(--S) * -.39); width: calc(var(--S) * .02); height: calc(var(--S) * .39); }
    .w3d-ws.big .sock { transform: translateZ(calc(var(--S) * .375)) rotateZ(var(--yaw)); }
    .w3d-ws.big .sock i { top: calc(var(--S) * -.033); width: calc(var(--S) * .22); height: calc(var(--S) * .066); }
    .w3d-ws .sock { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; transform: translateZ(calc(var(--S) * .25)) rotateZ(var(--yaw)); }
    .w3d-ws .sock i { position: absolute; left: 0; top: calc(var(--S) * -.022); width: calc(var(--S) * .15); height: calc(var(--S) * .044); transform-origin: 0 50%; transform: rotateX(-90deg) rotate(var(--droop)); }
    .w3d-ws .sock i.h { transform: rotateX(-90deg) rotate(var(--droop)) rotateX(90deg); }
    .w3d-ws .sock svg { display: block; width: 100%; height: 100%; }
    .w3d-ws .sock.on i { animation: w3d-sock var(--flap) ease-in-out infinite alternate; }
    .w3d-ws .sock.on i.h { animation-name: w3d-sock-h; }
    @keyframes w3d-sock { from { transform: rotateX(-90deg) rotate(calc(var(--droop) - 5deg)) scaleY(.92); } to { transform: rotateX(-90deg) rotate(calc(var(--droop) + 5deg)) scaleY(1.04); } }
    @keyframes w3d-sock-h { from { transform: rotateX(-90deg) rotate(calc(var(--droop) - 5deg)) rotateX(90deg) scaleY(.92); } to { transform: rotateX(-90deg) rotate(calc(var(--droop) + 5deg)) rotateX(90deg) scaleY(1.04); } }
    /* Pfützen */
    .w3d-pud { position: absolute; opacity: .95; }
    .w3d-pud svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .w3d-pud path { vector-effect: non-scaling-stroke; fill: none; stroke-linejoin: round; }
    .w3d-pud .o { stroke: color-mix(in srgb, var(--g2) 75%, #3a2a18); stroke-width: 8px; }
    .w3d-pud .m { stroke: color-mix(in srgb, var(--g2) 45%, #4a3420); stroke-width: 4px; }
    .w3d-pud .w { fill: url(#w3dpg); }
    .w3d-pud .l { stroke: rgba(255,255,255,.35); stroke-width: 1px; }
    .w3d-pud .s1 { stop-color: color-mix(in srgb, var(--water) 60%, #fff); }
    .w3d-pud .s2 { stop-color: color-mix(in srgb, var(--water) 82%, #123); }
    .w3d-pud .w3d-rip { width: 40%; height: 40%; margin: -20% 0 0 -20%; }
    /* Bodennebel */
    .w3d-gfog { position: absolute; inset: -4%; transform-style: preserve-3d; pointer-events: none; }
    .w3d-gfog i { -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent); mask-image: radial-gradient(closest-side, #000 55%, transparent); }
    .w3d-gfog i { position: absolute; inset: 0; transform: translateZ(calc(var(--T) + var(--S) * .03)); background:
      radial-gradient(ellipse 40% 30% at 30% 40%, rgba(236,241,246,.75), transparent 70%), radial-gradient(ellipse 45% 30% at 70% 65%, rgba(236,241,246,.7), transparent 70%),
      radial-gradient(ellipse 35% 25% at 55% 20%, rgba(236,241,246,.6), transparent 70%), radial-gradient(ellipse 30% 25% at 20% 80%, rgba(236,241,246,.6), transparent 70%); }
    .w3d-gfog i.b { transform: translateZ(calc(var(--T) + var(--S) * .08)); opacity: .55; }
    .w3d-gfog i.lake { transform: translateZ(calc(var(--T) + var(--S) * .05)); -webkit-mask-image: none; mask-image: none;
      background: radial-gradient(ellipse 36% 24% at 54% 74%, rgba(240,244,248,.95), transparent 75%), radial-gradient(ellipse 26% 16% at 40% 68%, rgba(240,244,248,.7), transparent 75%); }
    .w3d-gfog.on i { animation: w3d-gfog 14s ease-in-out infinite alternate; }
    .w3d-gfog.on i.b { animation-duration: 19s; animation-direction: alternate-reverse; }
    @keyframes w3d-gfog { from { translate: -6% -3%; } to { translate: 6% 4%; } }
    /* Zugefrorener See */
    .w3d-isle.ice .w3d-pond .pd-deep { opacity: .1; }
    .w3d-isle.ice .w3d-pond .pd-ice { display: inline; }
    .w3d-isle.ice .w3d-pond .pd-gloss { display: none; }
    .w3d-pond .pd-ice { display: none; }
    /* Jahreszeiten */
    .w3d-tree .blossom, .w3d-tree .bare { display: none; }
    .w3d-isle.season-spring .w3d-tree.round .blossom { display: inline; }
    .w3d-isle.season-winter .w3d-tree.round .crown { display: none; }
    .w3d-isle.season-winter .w3d-tree.round .bare { display: inline; }
    .w3d-tree .snowtwig { display: none; }
    .w3d-isle.snowy .w3d-tree .snowtwig { display: inline; }
    .w3d-isle.season-winter:not(.snowy) .w3d-tree.bush { --c1: #8d7c5a; --c2: #6d5d40; }
    /* Blätter im Sturm, Vögel, Regenbogen */
    .w3d-leaf { position: absolute; left: 0; width: 100%; height: 0; pointer-events: none; }
    /* Bewegung über die volle Breite: Prozent beziehen sich auf die Breite der Szene (s ist so breit wie die Szene) */
    .w3d-leaf s, .w3d-bird s { position: absolute; left: 0; top: 0; width: 100%; height: 0; text-decoration: none; }
    .w3d-leaf s { animation: w3d-leaf linear infinite; }
    .w3d-leaf i { position: absolute; left: 0; top: 0; width: 1.6cqw; height: .9cqw; min-width: 5px; min-height: 3px; border-radius: 80% 0 80% 0; animation: w3d-leafspin linear infinite; }
    @keyframes w3d-leaf { 0% { transform: translate(calc(50% - 60% * var(--dx)), 0); opacity: 0; } 10% { opacity: 1; } 50% { transform: translate(50%, -6cqh); } 90% { opacity: 1; } 100% { transform: translate(calc(50% + 60% * var(--dx)), 4cqh); opacity: 0; } }
    @keyframes w3d-leafspin { to { rotate: 360deg; } }
    .w3d-bird { position: absolute; left: 0; width: 100%; height: 0; pointer-events: none; }
    .w3d-bird s { animation: w3d-bird linear infinite; }
    .w3d-bird i { position: absolute; left: 0; width: 4.6cqw; min-width: 12px; }
    .w3d-bird svg { display: block; width: 100%; overflow: visible; }
    .w3d-bird svg { animation: w3d-wing ease-in-out infinite alternate; }
    /* Überflug in den ersten ~15 % des Zyklus, danach außerhalb des Bildes warten */
    @keyframes w3d-bird { 0% { transform: translate(calc(50% - 62% * var(--dx)), 0); } 7.5% { transform: translate(50%, -3cqh); } 15%, 100% { transform: translate(calc(50% + 62% * var(--dx)), 1cqh); } }
    @keyframes w3d-wing { from { transform: scaleY(1); } to { transform: scaleY(-.5); } }
    .w3d-bow { position: absolute; left: -4cqw; top: 6cqh; width: 64cqw; pointer-events: none; opacity: .42;
      -webkit-mask-image: linear-gradient(to bottom, #000 30%, transparent 92%); mask-image: linear-gradient(to bottom, #000 30%, transparent 92%); }
    .w3d-bow svg { display: block; width: 100%; height: auto; }
    .w3d-bow.on { animation: w3d-bow 9s ease-in-out infinite alternate; }
    @keyframes w3d-bow { from { opacity: .3; } to { opacity: .5; } }
    @container (max-width: 240px) { .w3d-bird, .w3d-bb.fly { display: none; } }
    .w3d-rip { position: absolute; width: 14%; height: 14%; margin: -7% 0 0 -7%; border: 1.5px solid rgba(255,255,255,.75); border-radius: 50%; opacity: 0; }
    .w3d-rip.on { animation: w3d-rip 1.4s ease-out infinite; }
    @keyframes w3d-rip { 0% { transform: scale(.2); opacity: .9; } 100% { transform: scale(1.3); opacity: 0; } }
    /* Niederschlag, Nebel, Blitz */
    .w3d-prec { position: absolute; inset: 0; transform-style: preserve-3d; pointer-events: none; }
    .w3d-ps { position: absolute; left: -12%; width: 124%; top: 0; height: 100%; overflow: hidden; pointer-events: none; }
    .w3d-ps i { position: absolute; left: 0; top: -100%; width: 100%; height: 200%; background-size: 100% 50%; background-repeat: repeat-y; }
    .w3d-ps.on i { animation: w3d-fall linear infinite; }
    .w3d-ps.snow.on i { animation-name: w3d-fall-snow; }
    .w3d.noscene .w3d-ps.snow i { filter: drop-shadow(0 0 1px rgba(80,110,150,.7)); }
    @keyframes w3d-fall { from { transform: translateY(0); } to { transform: translateY(50%); } }
    @keyframes w3d-fall-snow { 0% { transform: translate(0, 0); } 25% { transform: translate(1.2%, 12.5%); } 50% { transform: translate(-.8%, 25%); } 75% { transform: translate(1%, 37.5%); } 100% { transform: translate(0, 50%); } }
    .w3d-fg { position: absolute; width: 140%; height: 20%; pointer-events: none; }
    .w3d-fg i { display: block; width: 100%; height: 100%; background: radial-gradient(ellipse closest-side at center, rgba(235,240,245,.6), transparent); }
    .w3d-fg i.on { animation: fwc-sc-fog 22s ease-in-out infinite alternate; }
    .w3d-bolt { position: absolute; inset: 0; pointer-events: none; }
    .w3d-bolt svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 0 4px #fff); opacity: 0; }
    .w3d-bolt.on svg { animation: fwc-sc-bolt 7s linear infinite; }
    .w3d-over { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .w3d-over.chips .w3d-fg { opacity: .7; }
    .w3d-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
    .w3d-flash.on { animation: fwc-sc-flash 7s linear infinite; }
    /* Werte */
    .w3d-ui { position: absolute; inset: 0; display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.1fr); gap: 3cqw; padding: 6cqh 6cqw; transform-style: preserve-3d; transform: translateZ(50px); pointer-events: none; color: #fff; }
    .w3d.n7 .w3d-ui, .w3d.n8 .w3d-ui, .w3d.n9 .w3d-ui { grid-template-columns: minmax(0, .72fr) minmax(0, 1.3fr); }
    .w3d-glass { background: linear-gradient(135deg, rgba(255,255,255,.2), rgba(255,255,255,.05)), rgba(10,20,36,.46); border: 1px solid rgba(255,255,255,.28); border-radius: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35), inset 0 -10px 18px rgba(0,0,0,.12); }
    .w3d.noscene .w3d-glass, .w3d.noscene .w3d-chip { background: linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.03)), rgba(22,32,50,.84); }
    .w3d-main { align-self: start; justify-self: start; max-width: 100%; box-sizing: border-box; padding: clamp(8px, 2.4cqh, 16px) clamp(10px, 3.2cqw, 20px); }
    .w3d-temp { --td: color-mix(in srgb, var(--tc) 45%, #000); font-size: calc(clamp(30px, min(16cqh, 12cqw), 62px) * var(--fwc-scale, 1)); line-height: 1; font-weight: 600; letter-spacing: -1px; white-space: nowrap; color: var(--tc);
      text-shadow: 1px 1px 0 var(--td), 2px 2px 0 var(--td), 3px 4px 0 var(--td), 5px 8px 12px rgba(0,0,0,.45); }
    .w3d-temp span { font-size: .42em; font-weight: 500; margin-left: 2px; vertical-align: top; letter-spacing: 0; }
    .w3d-cond { margin-top: 4px; font-size: calc(clamp(12px, 3.4cqw, 17px) * var(--fwc-scale, 1)); font-weight: 500; text-shadow: 0 1px 4px rgba(0,0,0,.5); }
    .w3d-hl { display: flex; flex-wrap: wrap; gap: 2px 10px; margin-top: 3px; font-size: calc(clamp(10px, 2.7cqw, 13px) * var(--fwc-scale, 1)); opacity: .92; align-items: center; }
    .w3d-hl ha-icon { --mdc-icon-size: 14px; vertical-align: -3px; }
    .w3d-hl .hi { color: #ff9a8a; } .w3d-hl .lo { color: #8fd0ff; }
    .w3d-chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(5px, 1.8cqw, 10px); align-content: center; align-self: center; min-width: 0; transform-style: preserve-3d; }
    .w3d.n7 .w3d-chips, .w3d.n8 .w3d-chips, .w3d.n9 .w3d-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    /* Karten: leichte Einfärbung im Hintergrund, Text passt sich der Kartenbreite an */
    .w3d-chip { --zz: 14px; container-type: inline-size; min-width: 0; box-sizing: border-box; padding: clamp(5px, 1.6cqh, 9px) clamp(6px, 1.8cqw, 11px); border-radius: 12px; transform: translateZ(var(--zz));
      background: linear-gradient(135deg, color-mix(in srgb, var(--c) 30%, transparent), color-mix(in srgb, var(--c) 8%, transparent)), rgba(10,20,36,.5);
      border: 1px solid color-mix(in srgb, var(--c) 28%, rgba(255,255,255,.2)); box-shadow: inset 0 1px 0 rgba(255,255,255,.25); }
    .w3d-chip:nth-child(3n+2) { --zz: 30px; } .w3d-chip:nth-child(3n) { --zz: 22px; }
    .w3d-cl-h { display: flex; align-items: center; gap: 4px; font-size: clamp(7px, calc(100cqi / (var(--ll, 10) * .56)), 10.5px); opacity: .88; white-space: nowrap; overflow: hidden; }
    .w3d.n7 .w3d-cl-h ha-icon, .w3d.n8 .w3d-cl-h ha-icon, .w3d.n9 .w3d-cl-h ha-icon, .w3d.n7 .w3d-arrow, .w3d.n8 .w3d-arrow, .w3d.n9 .w3d-arrow { display: none; }
    .w3d.n7 .w3d-cl-h, .w3d.n8 .w3d-cl-h, .w3d.n9 .w3d-cl-h { font-size: clamp(7px, calc(100cqi / ((var(--ll, 10) - 2.6) * .56)), 10.5px); }
    .w3d-cl-h ha-icon { --mdc-icon-size: 1.35em; color: var(--c); flex-shrink: 0; }
    .w3d-cl-h span { overflow: hidden; text-overflow: ellipsis; }
    .w3d-arrow { display: inline-flex; width: 1.35em; height: 1.35em; flex-shrink: 0; }
    .w3d-arrow fwc-svg, .w3d-arrow svg { display: block; width: 100%; height: 100%; }
    .w3d-cv { display: flex; align-items: baseline; gap: 2px; white-space: nowrap; }
    .w3d-cv b { font-size: clamp(10px, calc(100cqi / (var(--len, 5) * .64)), 22px); font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,.4); font-variant-numeric: tabular-nums; line-height: 1.15; }
    .w3d-cv small { font-size: clamp(7px, calc(100cqi / (var(--len, 5) * .64) * .55), 11px); opacity: .8; }
    .w3d-cv.sm b { font-size: clamp(10px, calc(100cqi / (var(--len, 8.5) * .62)), 16px); }
    .w3d-cv.sm ha-icon { --mdc-icon-size: 14px; color: var(--c); align-self: center; }
    .w3d-cs { font-size: clamp(7px, calc(100cqi / (var(--sl, 8) * .55)), 10.5px); opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @container (max-height: 250px) { .w3d-chip:nth-child(n+5) { display: none; } .w3d-cs { display: none; } }
    @container (max-height: 170px) { .w3d-chip:nth-child(n+3) { display: none; } }
    @container (max-width: 330px) {
      .w3d-ui, .w3d.n7 .w3d-ui, .w3d.n8 .w3d-ui, .w3d.n9 .w3d-ui { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 2cqh; padding: 4cqh 4cqw; }
      .w3d-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); align-self: end; align-content: end; }
      .w3d.n7 .w3d-chips, .w3d.n8 .w3d-chips, .w3d.n9 .w3d-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .w3d.n7 .w3d-chips, .w3d.n8 .w3d-chips, .w3d.n9 .w3d-chips { gap: 5px; }
      .w3d.n7 .w3d-chip, .w3d.n8 .w3d-chip, .w3d.n9 .w3d-chip { padding: 4px 6px; }
      .w3d.n7 .w3d-cs, .w3d.n8 .w3d-cs, .w3d.n9 .w3d-cs { display: none; }
      .w3d.n7 .w3d-cv b, .w3d.n8 .w3d-cv b, .w3d.n9 .w3d-cv b { font-size: clamp(10px, calc(100cqi / (var(--len, 5) * .64)), 17px); }
      .w3d.n7 .w3d-ui, .w3d.n8 .w3d-ui, .w3d.n9 .w3d-ui { padding: 4cqh 5.5cqw 8cqh; }
      .w3d { --ix: 74cqw; --iy: 31cqh; --S: min(30cqw, 22cqh); }
      .w3d-main { padding: 6px 10px; max-width: 64%; }
      .w3d-temp { font-size: calc(clamp(28px, min(16cqh, 18cqw), 52px) * var(--fwc-scale, 1)); }
    }
    @container (max-width: 330px) and (max-height: 330px) { .w3d-chip:nth-child(n+5) { display: none; } }
    @container (max-width: 330px) and (max-height: 250px) { .w3d-chip:nth-child(n+3) { display: none; } .w3d-cs { display: none; } }
    /* Nur Insel (keine Wertekarten): Insel nutzt den ganzen Platz */
    .w3d.solo { --ix: 64cqw; --iy: 64cqh; --S: min(50cqw, 54cqh); }
    .w3d.solo.notemp { --ix: 50cqw; --iy: 62cqh; --S: min(60cqw, 60cqh); }
    .w3d.solo .w3d-ui { grid-template-columns: minmax(0, 1fr); }
    .w3d.solo .w3d-main { max-width: 56%; }
    @container (max-width: 330px) { .w3d.solo { --ix: 64cqw; --iy: 66cqh; --S: min(52cqw, 48cqh); } .w3d.solo.notemp { --ix: 50cqw; --iy: 62cqh; --S: min(66cqw, 58cqh); } }

    /* --- Wetterszene ------------------------------------------------------------------------- */
    .cur-scene { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; z-index: 0;
      -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 42%, transparent 96%); mask-image: linear-gradient(to bottom, #000 0%, #000 42%, transparent 96%); }
    .cur-scene svg, .sc-svg { width: 100%; height: 100%; display: block; }
    .fwc-el > .fwc-head, .fwc-el > .fwc-body { position: relative; z-index: 1; }
    .cur.scene, .cur.scene.has-det { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "main side"; align-items: end; align-content: end; padding-top: 0; }
    .cur.scene.has-det { grid-template-areas: "main side" "det det"; grid-template-rows: auto auto; row-gap: 2px; }
    .cur.scene .cur-temp { text-shadow: 0 1px 10px var(--fwc-tile-solid), 0 0 2px var(--fwc-tile-solid); }
    .cur.scene .cur-cond, .cur.scene .cur-side, .cur.scene .cur-det { text-shadow: 0 0 6px var(--fwc-tile-solid), 0 0 2px var(--fwc-tile-solid); }
    .big.scene .big-val { text-shadow: 0 1px 10px var(--fwc-tile-solid), 0 0 2px var(--fwc-tile-solid); }
    .big.scene .big-sub { text-shadow: 0 0 6px var(--fwc-tile-solid), 0 0 2px var(--fwc-tile-solid); }
    .big.scene .thermo { filter: drop-shadow(0 0 3px var(--fwc-tile-solid)); }
    .cur.scene .cur-temp { font-size: calc(clamp(30px, min(30cqh, 16cqw), 80px) * var(--fwc-scale, 1)); }
    @container (max-width: 250px) {
      .cur.scene, .cur.scene.has-det { grid-template-columns: minmax(0, 1fr); grid-template-areas: "main" "side" "det"; grid-template-rows: auto auto auto; align-content: end; row-gap: clamp(2px, 2cqh, 5px); }
      .cur.scene .cur-temp { font-size: calc(clamp(24px, min(26cqh, 17cqw), 56px) * var(--fwc-scale, 1)); }
      .cur.scene .cur-cond { font-size: calc(clamp(12px, 8cqh, 15px) * var(--fwc-scale, 1)); margin-top: 2px; }
      .cur.scene .cur-side { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 2px 12px; font-size: calc(clamp(11px, 7cqh, 13px) * var(--fwc-scale, 1)); }
      .cur.scene .cur-det { gap: 2px 10px; font-size: calc(clamp(11px, 7cqh, 13px) * var(--fwc-scale, 1)); padding-top: 0; }
      .cur.scene .cur-hl { gap: 6px; }
      .cur.scene .cur-hl ha-icon, .cur.scene .cur-det ha-icon { --mdc-icon-size: 14px; }
    }
    @container (max-width: 250px) and (max-height: 84px) { .cur.scene .cur-det { display: none; } .cur.scene, .cur.scene.has-det { grid-template-areas: "main" "side"; } }
    @container (max-width: 170px) and (min-height: 130px) { .cur.scene .cur-side, .cur.scene .cur-det { justify-content: center; } }
    .fwc-sc-rays { transform-box: fill-box; transform-origin: center; }
    .fwc-sc-drift { animation: fwc-sc-drift 40s ease-in-out infinite alternate; }
    .fwc-sc-rain { animation: fwc-sc-rain 1.6s linear infinite; }
    .fwc-sc-snow { animation: fwc-sc-snow 11s linear infinite; }
    .fwc-sc-hail { animation: fwc-sc-hail 1.4s linear infinite; }
    .fwc-sc-fog { animation: fwc-sc-fog 22s ease-in-out infinite alternate; }
    .fwc-sc-wind { animation: fwc-sc-wind 3s linear infinite; }
    .fwc-sc-flash { animation: fwc-sc-flash 7s linear infinite; }
    .fwc-sc-bolt { animation: fwc-sc-bolt 7s linear infinite; }
    @keyframes fwc-sc-drift { from { transform: translateX(-28px); } to { transform: translateX(28px); } }
    @keyframes fwc-sc-rain { 0% { transform: translate(0, 0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate(var(--sx, 0), 170px); opacity: .15; } }
    @keyframes fwc-sc-snow { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 1; } 30% { transform: translate(calc(var(--sx, 0px) * .3 + 7px), 50px); } 55% { transform: translate(calc(var(--sx, 0px) * .55 - 5px), 92px); }
      80% { transform: translate(calc(var(--sx, 0px) * .8 + 6px), 135px); } 100% { transform: translate(var(--sx, 0), 170px); opacity: 0; } }
    @keyframes fwc-sc-hail { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(var(--sx, 0), 170px); opacity: .3; } }
    @keyframes fwc-sc-fog { from { transform: translateX(-40px); } to { transform: translateX(40px); } }
    @keyframes fwc-sc-wind { from { stroke-dashoffset: 490; } to { stroke-dashoffset: 0; } }
    @keyframes fwc-sc-flash { 0%, 62%, 64.5%, 66%, 100% { opacity: 0; } 63% { opacity: .35; } 65% { opacity: .22; } }
    @keyframes fwc-sc-bolt { 0%, 62%, 64.5%, 66%, 100% { opacity: 0; } 63%, 65% { opacity: 1; } }

    /* --- Große Zahl (Temperatur) ------------------------------------------------------------- */
    .big { display: flex; align-items: center; gap: 8px; height: 100%; }
    .big-main { flex: 1; min-width: 0; }
    .big-val { font-size: calc(clamp(22px, min(46cqh, 24cqw), 72px) * var(--fwc-scale, 1)); line-height: 1; font-weight: 400; font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: -.5px; }
    .big-sub { font-size: calc(clamp(11px, 11cqh, 14px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .big-gfx svg { height: min(80cqh, 150px); width: auto; color: var(--primary-text-color); overflow: visible; }
    .th-l { font-size: 6px; fill: var(--secondary-text-color); }
    .th-fill { transform-box: fill-box; transform-origin: bottom; animation: fwc-th-rise 1.2s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes fwc-th-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    @container (max-width: 150px) { .big-gfx { display: none; } }
    @container (max-height: 80px) { .big-sub { display: none; } }

    /* --- Min / Max --------------------------------------------------------------------------- */
    .mm { display: flex; align-items: center; gap: 8px; height: 100%; font-size: calc(clamp(13px, 26cqh, 18px) * var(--fwc-scale, 1)); font-weight: 500; font-variant-numeric: tabular-nums; }
    .mm-lbl { color: var(--secondary-text-color); font-weight: 400; font-size: .85em; }
    .mm-v { display: inline-flex; flex-direction: column; white-space: nowrap; }
    .mm-top { display: inline-flex; align-items: center; }
    .mm-v ha-icon { --mdc-icon-size: 1.1em; }
    .mm-v.lo ha-icon { color: var(--blue-color, #2196f3); }
    .mm-v.hi ha-icon { color: var(--red-color, #f44336); }
    .mm-sub, .mm-cur { display: none; }
    .mm-bar { position: relative; flex: 1; height: 6px; border-radius: 3px; min-width: 30px; }
    .mm-bar i { position: absolute; top: 50%; width: 11px; height: 11px; border-radius: 50%; transform: translate(-50%, -50%); background: var(--primary-text-color); border: 2px solid var(--fwc-tile-solid); box-sizing: border-box; }
    /* Zwei und mehr Zeilen: große Werte, Beschriftung, aktuelle Temperatur über der Markierung */
    @container (min-height: 96px) {
      .mm { display: grid; grid-template-columns: 1fr auto 1fr; grid-template-areas: "lo lbl hi" "bar bar bar"; align-content: center; row-gap: clamp(28px, 22cqh, 40px); }
      .mm-lbl { grid-area: lbl; align-self: start; font-size: calc(12px * var(--fwc-scale, 1)); text-transform: uppercase; letter-spacing: .6px; }
      .mm-v.lo { grid-area: lo; align-items: flex-start; }
      .mm-v.hi { grid-area: hi; align-items: flex-end; }
      .mm-num { font-size: calc(clamp(22px, 24cqh, 44px) * var(--fwc-scale, 1)); line-height: 1; font-weight: 400; }
      .mm-v ha-icon { --mdc-icon-size: calc(clamp(18px, 18cqh, 30px) * var(--fwc-scale, 1)); }
      .mm-sub { display: block; font-size: calc(11.5px * var(--fwc-scale, 1)); font-weight: 400; color: var(--secondary-text-color); margin-top: 2px; }
      .mm-bar { grid-area: bar; height: 8px; border-radius: 4px; }
      .mm-bar i { width: 15px; height: 15px; border-width: 3px; }
      .mm-cur { display: block; position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-style: normal; white-space: nowrap;
        font-size: calc(12px * var(--fwc-scale, 1)); font-weight: 600; padding: 1px 6px; border-radius: 8px; background: var(--fwc-tile-solid); color: var(--primary-text-color);
        box-shadow: 0 1px 4px rgba(0, 0, 0, .2); }
    }
    @container (max-width: 190px) { .mm-lbl { display: none; } }

    /* --- Ring & Info (Luftfeuchte) ----------------------------------------------------------- */
    .gauge { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 2px; }
    .gauge-gfx svg, .ring { height: min(76cqh, 94cqw); width: auto; max-height: 100%; color: var(--primary-text-color); overflow: visible; }
    .ring-val { font-size: 22px; font-weight: 500; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
    .ring-u { font-size: 11px; fill: var(--secondary-text-color); }
    .gauge-info { text-align: center; min-width: 0; max-width: 100%; }
    .gauge-info > div { overflow: hidden; text-overflow: ellipsis; }
    .gi-main { font-size: calc(clamp(12px, 9cqh, 16px) * var(--fwc-scale, 1)); font-weight: 500; white-space: nowrap; }
    .gi-sub { font-size: calc(clamp(11px, 8cqh, 13px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; }
    @container (min-aspect-ratio: 7/5) {
      .gauge { flex-direction: row; gap: clamp(6px, 4cqw, 14px); }
      .gauge-gfx svg, .ring { height: min(100cqh, 50cqw); }
      .gauge-info { text-align: left; }
      .gi-main { font-size: calc(clamp(11px, min(15cqh, 7.2cqw), 18px) * var(--fwc-scale, 1)); } .gi-sub { font-size: calc(clamp(10px, min(12cqh, 6.4cqw), 14px) * var(--fwc-scale, 1)); }
    }
    @container (max-height: 120px) and (max-aspect-ratio: 7/5) { .gauge-info { display: none; } .gauge-gfx svg { height: 100%; } }

    .tick-l { font-size: 6.5px; fill: var(--secondary-text-color); }

    /* --- Wind -------------------------------------------------------------------------------- */
    .wind { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 4cqw, 16px); height: 100%; min-width: 0; }
    .wind-gfx svg, .cmp { height: min(100cqh, 100cqw); width: auto; max-width: 100%; color: var(--primary-text-color); overflow: visible; flex-shrink: 0; }
    .cmp-l { font-size: 7.5px; fill: var(--secondary-text-color); font-weight: 600; }
    .cmp-l.n { fill: var(--error-color, #e53935); }
    .cmp-v { font-size: 12.5px; font-weight: 600; fill: var(--primary-text-color); font-variant-numeric: tabular-nums; }
    .cmp-u { font-size: 5.5px; fill: var(--secondary-text-color); }
    .wind-info { display: flex; flex-direction: column; gap: clamp(4px, 4cqh, 10px); min-width: 0; flex: 1; max-width: max-content; font-size: calc(clamp(12px, 7cqh, 15px) * var(--fwc-scale, 1)); }
    .wi-row span { overflow: hidden; text-overflow: ellipsis; }
    .wi-row { display: flex; align-items: center; gap: 6px; white-space: nowrap; color: var(--secondary-text-color); }
    .wi-row b { color: var(--primary-text-color); font-weight: 500; }
    .wi-row ha-icon { --mdc-icon-size: 17px; color: var(--fwc-accent); }
    .wi-bft { display: flex; align-items: flex-start; gap: 7px; line-height: 1.3; }
    .wi-bft i { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: .3em; }
    .wi-bft b { font-weight: 600; }
    @container (min-aspect-ratio: 13/10) { .wind-gfx svg, .cmp { max-width: 52cqw; } }
    @container (max-aspect-ratio: 13/10) { .wind-info { display: none; } }

    /* --- Sichtweite -------------------------------------------------------------------------- */
    .t-visibility .fwc-body { margin: -10px -12px; }
    .t-visibility.style-none .fwc-body { margin: 0; }
    .vis { position: relative; height: 100%; }
    .vis-gfx svg, .vis-svg { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--primary-text-color); }
    .vis-txt { position: relative; padding: 10px 12px; display: flex; flex-direction: column; gap: 1px; }
    .vis-lbl { display: flex; align-items: center; gap: 6px; font-size: calc(12px * var(--fwc-scale, 1)); font-weight: 500; color: var(--secondary-text-color); }
    .vis-lbl ha-icon { --mdc-icon-size: 16px; color: var(--fwc-accent); }
    .vis-val { font-size: calc(clamp(18px, 24cqh, 34px) * var(--fwc-scale, 1)); font-weight: 500; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .vis-cat { font-size: calc(clamp(11px, 11cqh, 14px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); }
    @container (max-height: 64px) { .vis-lbl, .vis-cat { display: none; } .vis-txt { padding: 6px 12px; height: 100%; justify-content: center; box-sizing: border-box; } }

    /* --- Niederschlag ------------------------------------------------------------------------ */
    .pr { display: flex; gap: 10px; height: 100%; align-items: stretch; }
    .pr-gfx svg, .rg { height: 100%; width: auto; color: var(--primary-text-color); flex-shrink: 0; }
    .rg-l { font-size: 7px; fill: var(--secondary-text-color); }
    .pr-main { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
    .pr-row { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
    .pr-val { font-size: calc(clamp(18px, 20cqh, 32px) * var(--fwc-scale, 1)); font-weight: 500; line-height: 1.05; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pr-pop { display: inline-flex; align-items: center; gap: 3px; font-size: calc(clamp(12px, 9cqh, 15px) * var(--fwc-scale, 1)); color: var(--fwc-accent); font-weight: 500; white-space: nowrap; }
    .pr-pop ha-icon { --mdc-icon-size: 1.1em; }
    .pr-val.long { font-size: calc(clamp(16px, min(20cqh, 10.5cqw), 32px) * var(--fwc-scale, 1)); }
    .pr-row { min-width: 0; } .pr-pop { flex-shrink: 0; }
    .pr-sub { font-size: calc(11.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pr-bars { flex: 1; min-height: 14px; max-height: 60px; display: flex; align-items: flex-end; gap: 2px; border-bottom: 1px solid var(--divider-color); }
    .pr-bars i { flex: 1; background: var(--fwc-accent); border-radius: 2px 2px 0 0; min-width: 2px; }
    .pr-axis { display: flex; justify-content: space-between; font-size: calc(10.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); margin-top: 2px; white-space: nowrap; overflow: hidden; }
    .pr-row { flex-wrap: wrap; row-gap: 2px; }
    @container (max-height: 96px) { .pr-axis { display: none; } .pr-bars { min-height: 10px; } .pr-sub { margin-bottom: 2px; } }
    @container (max-height: 62px) { .pr-bars { display: none; } }
    @container (max-width: 200px) { .pr-axis span:last-child { display: none; } .pr-pop { font-size: calc(12px * var(--fwc-scale, 1)); } }
    @container (max-width: 150px) { .pr-gfx { display: none; } }

    /* --- UV ---------------------------------------------------------------------------------- */
    .uv { display: flex; flex-direction: column; justify-content: center; gap: 6px; height: 100%; }
    .uv-top { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .uv-val { font-size: calc(clamp(22px, 30cqh, 44px) * var(--fwc-scale, 1)); font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }
    .uv-txt { min-width: 0; }
    .uv-cat { font-weight: 600; font-size: calc(clamp(13px, 12cqh, 16px) * var(--fwc-scale, 1)); white-space: nowrap; }
    .uv-hint { font-size: calc(12px * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .uv-scale { position: relative; height: 6px; border-radius: 3px; flex-shrink: 0;
      background: linear-gradient(90deg, #4caf50 0%, #8bc34a 20%, #fdd835 27%, #fbc02d 45%, #fb8c00 52%, #f57c00 63%, #e53935 70%, #c62828 88%, #8e24aa 95%); }
    .uv-scale i { position: absolute; top: 50%; width: 12px; height: 12px; border-radius: 50%; transform: translate(-50%, -50%); background: var(--fwc-tile-solid); border: 3px solid var(--primary-text-color); box-sizing: border-box; }
    .uv-max { font-size: calc(11.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); }
    @container (max-height: 70px) { .uv-hint, .uv-max { display: none; } .uv { gap: 4px; } }

    /* --- Kuppel ------------------------------------------------------------------------------ */
    .dome { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .dome-gfx svg, .fwc-dome-svg { width: 100%; height: 100%; min-height: 0; overflow: visible; flex: 1; }
    /* Kuppel mit Insel: Box im Seitenverhältnis der Kuppel, Insel sitzt auf dem Boden der Kuppel */
    .dome-box { position: relative; aspect-ratio: 320 / 236; width: min(100%, calc(100cqh * 1.356)); max-height: 100%; flex: 0 1 auto; }
    .dome.info .dome-box { width: min(100%, calc((100cqh - 24px) * 1.356)); }
    .dome-box > .dome-gfx, .dome-box > .dome-gfx svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .dome-isle { position: absolute; inset: 0; container-type: size; pointer-events: none; }
    /* Rasen füllt die ganze Bodenfläche der Kuppel (runde Fläche, gleiche Neigung wie die Kuppel), kein Erdblock darunter.
       Die Objekte behalten ihre Größe (--S), nur die Rasenfläche wird auf die Kuppel vergrößert. */
    .dome-isle .w3d.w3d { background: none; overflow: visible; perspective: 2400px; perspective-origin: 50% 70%; --ix: 50cqw; --iy: 70.3cqh; --S: 40cqw; --ds: 2; --tx: 73deg; --T: 0px; }
    .dome-isle .w3d-top { border-radius: 50%; transform: scale(var(--ds, 1.74)); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.18), inset 0 0 calc(var(--S) * .12) rgba(0,0,0,.18); }
    .dome-isle .w3d-sides, .dome-isle .w3d-shadow { display: none !important; }
    .dome-isle .w3d-pond { left: 38%; top: 53%; width: 27%; height: 17%; }
    .dome-isle .w3d-cl, .dome-isle .w3d-prec, .dome-isle .w3d-over, .dome-isle .w3d-sky, .dome-isle .w3d-sun, .dome-isle .w3d-bow, .dome-isle .w3d-ui { display: none !important; }
    /* Wetterwerte in den oberen Ecken des Elements (neben der runden Kuppel) */
    .dome-temp, .dome-vals { position: absolute; top: 2px; z-index: 2; pointer-events: none; line-height: 1; }
    .dome-temp { left: 4px; display: flex; align-items: baseline; gap: .08em; font-weight: 600; font-size: calc(clamp(16px, min(13cqh, 9cqw), 34px) * var(--fwc-scale, 1)); }
    .dome-temp small { font-size: .42em; opacity: .85; font-weight: 500; }
    .dome-vals { right: 4px; display: grid; gap: .45em; justify-items: end; font-size: calc(clamp(9px, min(5.6cqh, 3.6cqw), 14px) * var(--fwc-scale, 1)); color: var(--primary-text-color); }
    .dome-vals .w3d-vr ha-icon, .dome-vals .w3d-vr .w3d-arrow { filter: none; }
    .dome-vals .w3d-vr small { color: var(--secondary-text-color); opacity: 1; }
    .dome-info { display: flex; gap: 14px; font-size: calc(12px * var(--fwc-scale, 1)); color: var(--secondary-text-color); }
    .dome-info b { color: var(--primary-text-color); font-weight: 500; }
    .fwc-dome-grid { fill: none; stroke: var(--secondary-text-color, #888); stroke-opacity: .22; stroke-width: .8; stroke-dasharray: 2 4; }
    .fwc-dome-ticks line { stroke: var(--secondary-text-color, #888); stroke-opacity: .45; stroke-width: 1; }
    .fwc-dome-ticks line.major { stroke-opacity: .8; stroke-width: 1.6; }
    .fwc-dome-axis { stroke: var(--secondary-text-color, #888); stroke-opacity: .35; stroke-width: .8; stroke-dasharray: 3 4; }
    .fwc-dome-outline { fill: none; stroke: var(--secondary-text-color, #888); stroke-opacity: .45; stroke-width: 1.2; }
    .fwc-dome-ground { stroke: var(--secondary-text-color, #888); stroke-opacity: .6; stroke-width: 1.4; }
    .fwc-dome-drop { stroke: #ffd23f; stroke-opacity: .7; stroke-width: 1.2; stroke-dasharray: 2 3; }
    .fwc-dome-drop.moon { stroke: #cfd8e6; }
    .fwc-dome-card { fill: var(--primary-text-color, #222); font-size: 13px; font-weight: 600; }
    .fwc-dome-card.back { font-size: 10px; opacity: .45; }
    .fwc-dome-time { fill: var(--secondary-text-color, #666); font-size: 11px; }

    /* --- Sonnenzeiten ------------------------------------------------------------------------ */
    .st-wrap { display: flex; flex-direction: column; height: 100%; justify-content: center; gap: 2px; }
    .st-gfx svg, .st { width: 100%; height: auto; max-height: calc(100cqh - 58px); min-height: 0; color: var(--primary-text-color); flex: 1; }
    .st-row { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: calc(clamp(12px, 9cqh, 15px) * var(--fwc-scale, 1)); white-space: nowrap; }
    .st-t { display: inline-flex; align-items: center; gap: 3px; }
    .st-rays { animation: fwc-spin 24s linear infinite; }
    .st-pulse { transform-box: fill-box; transform-origin: center; animation: st-pulse 3.2s ease-in-out infinite alternate; }
    @keyframes st-pulse { from { transform: scale(.85); opacity: .75; } to { transform: scale(1.15); opacity: 1; } }
    .st-t b { font-weight: 500; font-variant-numeric: tabular-nums; }
    .st-t ha-icon { --mdc-icon-size: 18px; color: var(--fwc-accent); }
    .st-mid { color: var(--secondary-text-color); font-size: calc(clamp(10.5px, 8cqh, 13px) * var(--fwc-scale, 1)); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
    .st-mid small { font-size: 1em; }
    @container (max-width: 230px) { .st-mid small { display: none; } }
    @container (max-width: 150px), (max-height: 70px) { .st-mid { display: none; } }

    /* --- Mond -------------------------------------------------------------------------------- */
    .moon { display: flex; align-items: center; gap: 12px; height: 100%; }
    .moon-gfx svg, .moon-svg { height: min(100cqh, 34cqw); width: auto; flex-shrink: 0; overflow: visible; }
    .moon-info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .moon-name { font-weight: 500; font-size: calc(clamp(13px, 13cqh, 17px) * var(--fwc-scale, 1)); line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .moon-sub, .moon-next { font-size: calc(clamp(10.5px, 5.6cqw, 12px) * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .moon-times { display: flex; flex-wrap: wrap; gap: 0 8px; font-size: calc(clamp(10.5px, 5.8cqw, 12.5px) * var(--fwc-scale, 1)); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .moon-times span { display: inline-flex; align-items: center; }
    .moon-times ha-icon { --mdc-icon-size: 15px; color: var(--secondary-text-color); }
    .moon-info { max-height: 100%; overflow: hidden; }
    @container (max-height: 125px) { .moon-name { -webkit-line-clamp: 1; font-size: calc(clamp(11px, min(13cqh, 6.4cqw), 16px) * var(--fwc-scale, 1)); } .moon-gfx svg, .moon-svg { height: min(100cqh, 28cqw); } }
    @container (max-height: 80px) { .moon-next { display: none; } }
    @container (max-height: 66px) { .moon-times { display: none; } }
    @container (max-width: 200px) { .moon { gap: 8px; } .moon-times ha-icon { --mdc-icon-size: 13px; } .moon-next { display: none; } }

    /* --- Tagesvorhersage --------------------------------------------------------------------- */
    .fd { height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .fd-list { display: flex; flex-direction: column; justify-content: space-around; height: 100%; min-height: 0; }
    .fd-row { display: grid; grid-template-columns: minmax(36px, .9fr) clamp(26px, 14cqh, 38px) 40px 34px minmax(40px, 2.6fr) 34px; align-items: center; gap: 8px;
      font-size: calc(clamp(12px, 5cqh, 15px) * var(--fwc-scale, 1)); font-variant-numeric: tabular-nums; min-height: 0; flex: 1; max-height: 44px; }
    .fd-row + .fd-row { border-top: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
    .fd-day { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fd-ic { display: flex; align-items: center; justify-content: center; }
    .fd-ic .fwc-wi { width: 100%; max-width: 38px; height: auto; overflow: visible; }
    .fd-pop { color: var(--blue-color, #2196f3); font-size: .85em; text-align: right; white-space: nowrap; }
    .fd-lo { color: var(--secondary-text-color); text-align: right; }
    .fd-hi { font-weight: 500; text-align: right; }
    .fd-bar { position: relative; height: 5px; border-radius: 3px; background: color-mix(in srgb, var(--primary-text-color) 10%, transparent); }
    .fd-bar span { position: absolute; top: 0; bottom: 0; border-radius: 3px; min-width: 4px; }
    .fd-bar i { position: absolute; top: 50%; width: 9px; height: 9px; border-radius: 50%; background: var(--primary-text-color); border: 2px solid var(--fwc-tile-solid); transform: translate(-50%, -50%); box-sizing: border-box; }
    .fd.v-auto .fdc { display: none; }
    @container (min-aspect-ratio: 5/2) { .fd.v-auto .fdc { display: flex; } .fd.v-auto .fd-list { display: none; } }
    .fdc { display: flex; flex-direction: column; height: 100%; min-height: 0; justify-content: space-evenly; font-variant-numeric: tabular-nums; }
    .fdc.has-chart { justify-content: flex-start; }
    .fdc-row { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); text-align: center; align-items: center; flex-shrink: 0; }
    .fdc-row > span { min-height: 1.35em; line-height: 1.35em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fdc-day { font-weight: 500; font-size: calc(clamp(12px, 8cqh, 15px) * var(--fwc-scale, 1)); }
    .fdc-ic > span { display: flex; justify-content: center; height: clamp(26px, 16cqh, 40px); }
    .fdc-ic .fwc-wi { height: 100%; width: auto; overflow: visible; }
    .fdc-hi { font-weight: 500; font-size: calc(clamp(12px, 8cqh, 15px) * var(--fwc-scale, 1)); }
    .fdc-lo { color: var(--secondary-text-color); font-size: calc(clamp(11.5px, 7.5cqh, 14px) * var(--fwc-scale, 1)); }
    .fdc-pop { color: var(--blue-color, #2196f3); font-size: calc(clamp(11px, 6.5cqh, 13px) * var(--fwc-scale, 1)); }
    .fdc-chart { position: relative; flex: 1; min-height: 46px; margin: 2px 0; font-size: calc(clamp(11.5px, 7cqh, 14px) * var(--fwc-scale, 1)); }
    .fdc-plot { position: absolute; left: 0; right: 0; top: 6px; bottom: 6px; }
    .fdc-chart.pt .fdc-plot { top: 1.85em; }
    .fdc-chart.pb .fdc-plot { bottom: 1.8em; }
    .fdc-chart.pt { min-height: calc(34px + 1.85em); }
    .fdc-chart.pt.pb { min-height: calc(28px + 3.65em); }
    .fdc-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .fdc-l { fill: none; stroke-width: 2.4; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; }
    .fdc-l.lo { stroke: var(--fwc-line-lo, var(--secondary-text-color)); stroke-dasharray: 2 5; opacity: .75; }
    .fwc-a-train { animation: fwc-train 2.8s linear infinite; }
    @keyframes fwc-train { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -14; } }
    .fdc-wind { margin-top: 5px; }
    .fdc-wind > span { min-height: 1.9em; line-height: 1.1; overflow: visible; display: flex; align-items: center; justify-content: center; }
    .wc { display: inline-flex; flex-direction: row; align-items: center; gap: 3px; font-variant-numeric: tabular-nums; }
    .wc-ic { width: clamp(15px, 9cqh, 20px); height: auto; overflow: visible; flex-shrink: 0; }
    .wc b { font-weight: 600; font-size: calc(clamp(10.5px, 6cqh, 12px) * var(--fwc-scale, 1)); }
    .fwc-swipe { height: 100%; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scrollbar-width: none; scroll-snap-type: x proximity; }
    .fwc-swipe.dragging { scroll-snap-type: none; cursor: grabbing; user-select: none; }
    .fwc-swipe::-webkit-scrollbar { display: none; width: 0; height: 0; }
    .fwc-swipe-in { height: 100%; min-width: 100%; }
    .fwc-swipe-in .fdc-day > span { scroll-snap-align: start; }
    .fdc.dense .fdc-day { font-size: calc(clamp(10.5px, 6.5cqh, 13px) * var(--fwc-scale, 1)); font-weight: 400; color: var(--secondary-text-color); }
    .fdc.dense .fdc-pop { font-size: calc(clamp(9.5px, 5.5cqh, 11.5px) * var(--fwc-scale, 1)); letter-spacing: -.02em; }
    .fdc.xdense .wc b { display: none; }
    .fdc.xdense .wc-ic { width: clamp(13px, 8cqh, 17px); }
    .fdc.xdense .fdc-day > span, .fdc.xdense .fdc-bars small, .fdc.xdense .fdc-pop > span { font-size: calc(10px * var(--fwc-scale, 1)); letter-spacing: -.03em; }
    .fdc.dense .fdc-chart { font-size: calc(10.5px * var(--fwc-scale, 1)); }
    .fdc-l.hum { stroke: var(--fwc-line-hum, #26c6da); stroke-width: 1.8; opacity: .8; }
    .fdc-dot { position: absolute; width: 7px; height: 7px; border-radius: 50%; transform: translate(-50%, -50%); border: 2px solid var(--fwc-tile-solid); box-sizing: content-box; }
    .fdc-dot.hi { background: var(--fwc-line-hi, #ffb300); }
    .fdc-dot.lo { background: var(--fwc-line-lo, var(--secondary-text-color)); }
    .fdc-dot.hum { background: var(--fwc-line-hum, #26c6da); width: 5px; height: 5px; }
    .fdc-v { position: absolute; font-size: 1em; line-height: 1.2; font-weight: 600; white-space: nowrap; pointer-events: none; text-shadow: 0 0 3px var(--fwc-tile-solid), 0 0 3px var(--fwc-tile-solid); }
    .fdc-v.hi { transform: translate(-50%, -150%); }
    .fdc-v.lo { transform: translate(-50%, 45%); color: var(--secondary-text-color); font-weight: 400; }
    .fdc-v.hum { transform: translate(-50%, -150%); color: var(--fwc-line-hum, #26c6da); font-weight: 500; font-size: .85em; }
    .fdc-bars { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); height: clamp(22px, 13cqh, 40px); flex-shrink: 0; border-bottom: 1px solid var(--divider-color); }
    .fdc-bars > span { position: relative; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; min-width: 0; }
    .fdc-bars i { width: min(26px, 55%); background: var(--blue-color, #2196f3); border-radius: 3px 3px 0 0; max-height: calc(100% - 13px); }
    .fdc-bars small { font-size: calc(10.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); line-height: 12px; white-space: nowrap; }
    .fdc-legend { display: flex; justify-content: flex-end; gap: 10px; font-size: calc(10.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); margin-top: 2px; }
    .fdc-legend span::before { content: ''; display: inline-block; width: 10px; height: 3px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
    .fdc-legend .hi::before { background: linear-gradient(90deg, #29b6f6, #66bb6a, #ffa726); }
    .fdc-legend .hum::before { background: var(--fwc-line-hum, #26c6da); }
    @container (max-height: 150px) { .fdc-bars, .fdc-legend { display: none; } }
    .ch-hum { fill: none; stroke: var(--fwc-line-hum, #26c6da); stroke-width: 1.8; vector-effect: non-scaling-stroke; opacity: .85; }
    .ch-v.hum { color: var(--fwc-line-hum, #26c6da); transform: translate(-50%, 40%); font-weight: 500; font-size: calc(10.5px * var(--fwc-scale, 1)); }
    .ch-legend { display: inline-flex; align-items: center; gap: 5px; font-weight: 400; font-size: calc(11px * var(--fwc-scale, 1)); }
    .ch-legend i:not(:first-child) { margin-left: 6px; }
    .ch-legend i { width: 12px; height: 3px; border-radius: 2px; }
    .ch-legend i.t { background: linear-gradient(90deg, #29b6f6, #ffa726); }
    .ch-legend i.h { background: var(--fwc-line-hum, #26c6da); }
    @container (max-width: 300px) { .fd-row { grid-template-columns: minmax(32px, 1fr) 26px 32px minmax(30px, 2fr) 32px; } .fd-row .fd-pop { display: none; } }
    @container (max-width: 200px) { .fd-row { grid-template-columns: minmax(30px, 1fr) 24px 30px 30px; } .fd-row .fd-bar { display: none; } }

    /* --- Stundenvorhersage ------------------------------------------------------------------- */
    .fh { display: flex; gap: 2px; height: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x proximity; box-sizing: border-box; }
    .fh-col { flex: 1 0 44px; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; scroll-snap-align: start; font-variant-numeric: tabular-nums; font-size: calc(clamp(12px, 10cqh, 15px) * var(--fwc-scale, 1)); }
    .fh.sw .fh-col { flex: 0 0 max(44px, calc((100% - (var(--vis) - 1) * 2px) / var(--vis))); }
    .fh-t { font-size: .85em; color: var(--secondary-text-color); white-space: nowrap; }
    .fh-col .fd-ic { width: min(32px, 36cqh); }
    .fh-col .fd-ic .fwc-wi { max-width: none; }
    .fh-temp { font-weight: 500; }
    .fh-pop { font-size: .8em; color: var(--blue-color, #2196f3); min-height: 1.1em; }
    @container (max-height: 90px) { .fh-pop { display: none; } }

    /* --- Temperaturverlauf ------------------------------------------------------------------- */
    .ch { display: flex; flex-direction: column; height: 100%; }
    .ch-plot { position: relative; flex: 1; min-height: 0; }
    .ch-gfx svg, .ch-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .ch-grid { stroke: var(--divider-color); stroke-width: .5; vector-effect: non-scaling-stroke; stroke-dasharray: 2 3; }
    .ch-v { position: absolute; transform: translate(-50%, -135%); font-size: calc(11.5px * var(--fwc-scale, 1)); font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none;
      text-shadow: 0 0 3px var(--fwc-tile-solid), 0 0 3px var(--fwc-tile-solid); }
    .ch-v.max { color: var(--red-color, #f44336); font-weight: 700; }
    .ch-v.min { color: var(--blue-color, #2196f3); font-weight: 700; }
    .ch-v.low { transform: translate(-50%, 35%); color: var(--secondary-text-color); font-weight: 400; }
    .ch-now { position: absolute; top: 10%; bottom: 0; width: 0; border-left: 1.5px dashed var(--primary-text-color); opacity: .35; }
    .ch-x { position: relative; height: 16px; flex-shrink: 0; font-size: calc(10.5px * var(--fwc-scale, 1)); color: var(--secondary-text-color); }
    .ch-x span { position: absolute; transform: translateX(-50%); white-space: nowrap; top: 2px; }
    .ch-x span:first-child { transform: translateX(-10%); }
    @container (max-width: 360px) { .ch-x span.alt { display: none; } }

    /* --- Warnungen --------------------------------------------------------------------------- */
    .wn { display: flex; flex-direction: column; gap: 6px; height: 100%; overflow-y: auto; scrollbar-width: thin; justify-content: flex-start; }
    .wn-it { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 7px 10px; border-radius: 10px; cursor: pointer;
      background: color-mix(in srgb, var(--wc) 16%, transparent); flex-shrink: 0; }
    .wn-ic { --mdc-icon-size: 22px; color: var(--wc); flex-shrink: 0; margin-top: 1px; filter: saturate(1.2) brightness(.92); }
    .wn-txt { min-width: 0; flex: 1; }
    .wn-h { font-weight: 500; font-size: calc(13.5px * var(--fwc-scale, 1)); line-height: 1.3; }
    .wn-adv { font-size: calc(10.5px * var(--fwc-scale, 1)); padding: 1px 5px; border-radius: 6px; background: var(--divider-color); font-weight: 500; }
    .wn-t { font-size: calc(12px * var(--fwc-scale, 1)); color: var(--secondary-text-color); margin-top: 1px; }
    .wn-d { font-size: calc(12.5px * var(--fwc-scale, 1)); line-height: 1.4; margin-top: 6px; white-space: pre-line; }
    .wn-i { color: var(--secondary-text-color); }
    .wn-chev { --mdc-icon-size: 18px; color: var(--secondary-text-color); transition: transform .2s; flex-shrink: 0; }
    .wn-it.open .wn-chev { transform: rotate(180deg); }
    .wn-region { font-size: calc(11px * var(--fwc-scale, 1)); font-weight: 400; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45%; }
    .wn-ok { display: flex; align-items: center; gap: 10px; height: 100%; }
    .wn-ok ha-icon { --mdc-icon-size: clamp(22px, 30cqh, 34px); color: var(--success-color, #43a047); }
    .wn-ok b { font-weight: 500; display: block; }
    .wn-ok small { color: var(--secondary-text-color); font-size: calc(12px * var(--fwc-scale, 1)); }
    .grow .wn { height: auto; overflow: visible; }
    @container (max-height: 60px) { .wn-it { padding: 4px 8px; } .wn-t { display: none; } }

    /* --- Solarstrahlung ---------------------------------------------------------------------- */
    .sol { display: flex; flex-direction: column; height: 100%; gap: 4px; }
    .sol-top { display: flex; align-items: center; gap: 10px; min-width: 0; flex-shrink: 0; }
    .sol-gfx svg, .sol-sun { height: clamp(34px, 30cqh, 64px); width: auto; color: var(--primary-text-color); flex-shrink: 0; overflow: visible; }
    .sol-txt { min-width: 0; }
    .sol-val { font-size: calc(clamp(18px, 20cqh, 32px) * var(--fwc-scale, 1)); font-weight: 500; line-height: 1.05; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sol-cat { font-size: calc(12px * var(--fwc-scale, 1)); color: var(--secondary-text-color); line-height: 1.3; }
    .sol-cat b { color: var(--primary-text-color); font-weight: 500; }
    .sol-chart { position: relative; flex: 1; min-height: 18px; }
    .sol-chart svg, .sol-svg { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--primary-text-color); }
    .sol-now { position: absolute; top: 0; bottom: 0; border-left: 1.5px dashed var(--primary-text-color); opacity: .35; }
    @container (max-height: 100px) { .sol-chart { display: none; } .sol { justify-content: center; } }

    /* --- Pollen ------------------------------------------------------------------------------ */
    .pol { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; gap: 2px; overflow-y: auto; scrollbar-width: thin; }
    .pol-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) minmax(48px, 1.1fr) auto auto; align-items: center; gap: 8px; font-size: calc(clamp(12px, 7cqh, 14px) * var(--fwc-scale, 1)); min-height: 22px; }
    .pol-row ha-icon { --mdc-icon-size: 18px; }
    .pol-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pol-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
    .pol-bar i { height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--primary-text-color) 12%, transparent); }
    .pol-lvl { font-size: .85em; color: var(--secondary-text-color); white-space: nowrap; min-width: 3.6em; }
    .pol-tm { display: inline-flex; align-items: center; color: var(--secondary-text-color); }
    .pol-tm ha-icon { --mdc-icon-size: 14px; }
    .pol-tm i { width: 9px; height: 9px; border-radius: 50%; }
    @container (max-width: 230px) { .pol-lvl { display: none; } }

    /* --- Wetterbericht ----------------------------------------------------------------------- */
    .rep { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 6px; }
    .rep-tabs { display: flex; gap: 4px; flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
    .rep-tabs button { border: 1px solid var(--divider-color); background: transparent; color: var(--secondary-text-color); font: inherit; font-size: calc(12px * var(--fwc-scale, 1));
      padding: 3px 10px; border-radius: 12px; cursor: pointer; white-space: nowrap; }
    .rep-tabs button.on { background: color-mix(in srgb, var(--fwc-accent) 18%, transparent); border-color: color-mix(in srgb, var(--fwc-accent) 50%, transparent); color: var(--primary-text-color); font-weight: 500; }
    .rep-head { font-weight: 500; font-size: calc(clamp(13px, 6cqh, 16px) * var(--fwc-scale, 1)); line-height: 1.3; flex-shrink: 0; }
    .rep-body { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; font-size: calc(13px * var(--fwc-scale, 1)); line-height: 1.5; color: var(--primary-text-color);
      -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 14px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 14px), transparent); padding-bottom: 10px; }
    .rep-body p { margin: 0 0 6px; }
    .rep-body h4 { margin: 8px 0 2px; font-size: calc(12px * var(--fwc-scale, 1)); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: var(--fwc-accent); }
    .rep-body h4:first-child { margin-top: 0; }
    .rep-meta { font-size: calc(11px * var(--fwc-scale, 1)); color: var(--secondary-text-color); flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* --- Regenradar -------------------------------------------------------------------------- */
    .rad { position: relative; height: 100%; overflow: hidden; border-radius: inherit; background: color-mix(in srgb, var(--primary-text-color) 8%, var(--fwc-tile-solid)); }
    .rad-map { position: absolute; width: var(--S); height: var(--S); }
    .rad-map img { position: absolute; width: 33.3434%; height: 33.3434%; display: block; user-select: none; -webkit-user-drag: none; }
    .rad-base, .rad-frame, .rad-ref { position: absolute; inset: 0; }
    .rad-ref { pointer-events: none; }
    .rad-base.osm img { filter: saturate(.55) contrast(.95); }
    .rad-base.osm.dark img { filter: invert(1) hue-rotate(180deg) brightness(.85) contrast(.9) saturate(.35); }
    .rad-frame { opacity: .8; }
    .rad-frame img { image-rendering: auto; }
    .rad-pin { position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; transform: translate(-50%, -50%); border-radius: 50%; background: var(--primary-color); border: 2px solid #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.25); }
    .rad-pin i { position: absolute; inset: -8px; border-radius: 50%; border: 2px solid var(--primary-color); animation: fwc-ping 2s ease-out infinite; }
    @keyframes fwc-ping { from { transform: scale(.4); opacity: .9; } to { transform: scale(1.6); opacity: 0; } }
    .rad-time { position: absolute; left: 8px; top: 8px; display: flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 10px;
      background: rgba(0, 0, 0, .55); color: #fff; font-size: calc(12px * var(--fwc-scale, 1)); font-weight: 600; font-variant-numeric: tabular-nums; }
    .rad-times { position: relative; display: inline-block; min-width: 3em; height: 1.3em; }
    .rad-times span { position: absolute; left: 0; top: 0; }
    .rad-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef5350; }
    .rad-status { position: absolute; left: 50%; top: 50%; transform: translate(-50%, 20px); background: rgba(0,0,0,.55); color: #fff; font-size: calc(12px * var(--fwc-scale, 1)); padding: 4px 10px; border-radius: 10px; white-space: nowrap; }
    .rad-attr { position: absolute; right: 0; bottom: 0; font-size: 9.5px; padding: 1px 6px; background: rgba(255, 255, 255, .7); color: #333; border-top-left-radius: 6px; }

    /* --- Kachel-Zeile (Messwert, Entität) --------------------------------------------------- */
    .tile-row { display: flex; align-items: center; gap: 10px; height: 100%; min-width: 0; }
    .tile-ic { width: clamp(30px, 70cqh, 40px); height: clamp(30px, 70cqh, 40px); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--fwc-accent) 18%, transparent); color: var(--fwc-accent); }
    .tile-ic ha-icon, .tile-ic ha-state-icon { --mdc-icon-size: clamp(18px, 40cqh, 24px); }
    .tile-row.active .tile-ic { background: color-mix(in srgb, var(--state-active-color, var(--amber-color, #ffc107)) 25%, transparent); color: var(--state-active-color, var(--amber-color, #ffc107)); }
    .tile-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .tile-name { font-size: calc(12px * var(--fwc-scale, 1)); color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tile-val { font-size: calc(clamp(14px, 30cqh, 22px) * var(--fwc-scale, 1)); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
    .tile-val.small { font-size: calc(clamp(13px, 24cqh, 16px) * var(--fwc-scale, 1)); }
    .tile-val .u { font-size: .7em; }
    @container (max-width: 110px) { .tile-ic { display: none; } }
    @container (min-height: 100px) and (max-width: 160px) { .tile-row { flex-direction: column; justify-content: center; text-align: center; } .tile-txt { align-items: center; } }

    /* --- Bild & Karte ------------------------------------------------------------------------ */
    .img { width: 100%; height: 100%; border: 0; display: block; border-radius: inherit; }
    .t-image .fwc-body, .t-card .fwc-body { border-radius: inherit; overflow: hidden; }
    .child { height: 100%; overflow: auto; --ha-card-box-shadow: none; --ha-card-border-width: 0; }
  `;

  return {
    TYPES, ORDER, GROUPS, DEFS, render, needs, create, styles, iconSvg, MDI_COND, condText, showTitle, elementSensors,
  };
})();
