/*
 * Flexible Weather Card - MAIN FILE
 * Dateiname: flexible-weather-card.js
 * Version: 2.2
 * Die Card legt alle Elemente auf ein freies Raster (Spalten x Zeilen). Das Layout entsteht im
 * Layout-Designer (Popup aus dem Karten-Editor) per Drag & Drop.
 * Daten: Wetter-Entität + eigene Sensoren aus HA, fehlende Werte optional von Open-Meteo,
 * Warnungen aus DWD/Meteoalarm-Entitäten oder online (Bright Sky), Sonne & Mond auch berechnet.
 */

const FWC_DEFAULTS = { columns: 6, row_height: 56, gap: 8, padding: 12 };

// Feste Vorlagen (auch für den Designer und den Kartenauswahl-Dialog)
const FWC_TEMPLATES = {
  compact: [
    { type: 'current', x: 0, y: 0, w: 6, h: 2, show_details: false },
    { type: 'forecast_daily', x: 0, y: 2, w: 6, h: 2, variant: 'columns', days: 5 },
  ],
  standard: [
    { type: 'header', x: 0, y: 0, w: 6, h: 1 },
    { type: 'current', x: 0, y: 1, w: 6, h: 3 },
    { type: 'warnings', x: 0, y: 4, w: 6, h: 1, hide_when_empty: true },
    { type: 'wind', x: 0, y: 5, w: 3, h: 3 },
    { type: 'humidity', x: 3, y: 5, w: 3, h: 3 },
    { type: 'chart', x: 0, y: 8, w: 6, h: 3 },
    { type: 'forecast_daily', x: 0, y: 11, w: 6, h: 4, days: 5, variant: 'list' },
  ],
  detailed: [
    { type: 'header', x: 0, y: 0, w: 6, h: 1, show_condition: false },
    { type: 'current', x: 0, y: 1, w: 6, h: 3 },
    { type: 'warnings', x: 0, y: 4, w: 6, h: 2 },
    { type: 'minmax', x: 0, y: 6, w: 6, h: 1 },
    { type: 'wind', x: 0, y: 7, w: 3, h: 3 },
    { type: 'pressure', x: 3, y: 7, w: 3, h: 3 },
    { type: 'humidity', x: 0, y: 10, w: 2, h: 2 },
    { type: 'uv', x: 2, y: 10, w: 4, h: 2 },
    { type: 'visibility', x: 0, y: 12, w: 3, h: 2 },
    { type: 'precipitation', x: 3, y: 12, w: 3, h: 2 },
    { type: 'sun', x: 0, y: 14, w: 6, h: 4, show_title: false },
    { type: 'sun_times', x: 0, y: 18, w: 3, h: 2 },
    { type: 'moon', x: 3, y: 18, w: 3, h: 2 },
    { type: 'chart', x: 0, y: 20, w: 6, h: 3 },
    { type: 'forecast_hourly', x: 0, y: 23, w: 6, h: 2 },
    { type: 'forecast_daily', x: 0, y: 25, w: 6, h: 4, days: 6, variant: 'list' },
  ],
  astro: [
    { type: 'header', x: 0, y: 0, w: 6, h: 1 },
    { type: 'sun', x: 0, y: 1, w: 6, h: 4 },
    { type: 'sun_times', x: 0, y: 5, w: 3, h: 2 },
    { type: 'moon', x: 3, y: 5, w: 3, h: 2 },
  ],
  // 3D Wetter mit Wetterszene, allen Karten und den Vorhersagen darunter
  weather3d: [
    { type: 'weather3d', x: 0, y: 0, w: 6, h: 6, show_scene: true, show_visibility: true, show_dew_point: true, show_clouds: true },
    { type: 'warnings', x: 0, y: 6, w: 6, h: 1, hide_when_empty: true },
    { type: 'forecast_hourly', x: 0, y: 7, w: 6, h: 2 },
    { type: 'chart', x: 0, y: 9, w: 6, h: 3 },
    { type: 'forecast_daily', x: 0, y: 12, w: 6, h: 4, days: 5, variant: 'list' },
  ],
  // Komplette Dashboard-Seite über die volle Breite (12 Spalten) – auf dem Handy automatisch zweispaltig
  dashboard: [
    { type: 'image', x: 0, y: 0, w: 5, h: 6, preset: 'windy', overlay: 'temp', mode: 'auto', fit: 'cover', zoom: 6 },
    { type: 'current', x: 5, y: 0, w: 3, h: 2, display: 'scene', show_details: false },
    { type: 'image', x: 8, y: 0, w: 4, h: 6, preset: 'dwd_warnings', fit: 'cover' },
    { type: 'humidity', x: 5, y: 2, w: 3, h: 3, show_title: false },
    { type: 'pressure', x: 5, y: 5, w: 3, h: 3, show_title: false },
    { type: 'sun_times', x: 0, y: 6, w: 2, h: 2, show_title: false },
    { type: 'moon', x: 2, y: 6, w: 3, h: 2, show_title: false },
    { type: 'warnings', x: 8, y: 6, w: 4, h: 2 },
    { type: 'weather3d', x: 0, y: 8, w: 3, h: 5, show_temp: false, show_wind: false, show_humidity: false, show_pressure: false, show_precip: false, show_uv: false, show_sun: false, show_values: true },
    { type: 'forecast_daily', x: 3, y: 8, w: 5, h: 5, variant: 'columns', days: 8, show_temp_line: true, animate_low: true, show_pop: false, show_humidity_line: false },
    { type: 'report', x: 8, y: 8, w: 4, h: 5, range: 'today', length: 'long', show_title: false },
    { type: 'chart', x: 0, y: 13, w: 12, h: 2, range: '48', show_title: false, show_now: true, show_values: true, show_precip: true },
    { type: 'image', x: 0, y: 15, w: 6, h: 6, preset: 'wetteronline', mode: 'auto', zoom: 8 },
    { type: 'precipitation', x: 6, y: 15, w: 3, h: 3, mode: 'today' },
    { type: 'uv', x: 9, y: 15, w: 3, h: 3 },
    { type: 'wind', x: 6, y: 18, w: 3, h: 3 },
    { type: 'solar', x: 9, y: 18, w: 3, h: 3 },
  ],
};
// Vorlagen mit eigener Spaltenzahl (alle anderen: 6)
const FWC_TEMPLATE_COLS = { dashboard: 12 };
// Karten-Einstellungen, die eine Vorlage mitbringt
const FWC_TEMPLATE_CFG = { dashboard: { row_height: 52, gap: 7, design_width: 1280 } };
const fwcTemplate = (name) => (FWC_TEMPLATES[name] || []).map((e, i) => ({ ...e, id: `${e.type}_${i + 1}` }));

// Handy-Layout: breite Karten (mehr als 6 Spalten) auf schmalen Bildschirmen sauber in höchstens zwei Spalten umbrechen.
// Reihenfolge wie im Raster (oben → unten, links → rechts); breite Elemente gehen über die volle Breite, schmale
// stehen paarweise nebeneinander. Die Höhe wird etwas angepasst, damit das Seitenverhältnis ungefähr bleibt.
const fwcMobileLayout = (elements, cols, cardW, designW) => {
  const dw = designW || Math.max(cardW, 1200);
  const queue = [...elements].sort((a, b) => a.y - b.y || a.x - b.x).map((e) => {
    const def = FWC_EL.TYPES[e.type] || {};
    const full = e.w / cols >= 0.33;
    const oldPx = (e.w / cols) * dw, newPx = (full ? 1 : 0.5) * cardW;
    const f = Math.min(1, Math.max(0.65, Math.sqrt(newPx / oldPx)));
    return { e, span: full ? 2 : 1, h: Math.max(def.minH || 1, Math.round(e.h * f)) };
  });
  const colH = [0, 0];
  const out = [];
  while (queue.length) {
    let i = 0;
    // Lücke neben einem schmalen Element zuerst mit dem nächsten schmalen Element füllen
    if (colH[0] !== colH[1] && queue[0].span === 2) {
      const j = queue.slice(0, 5).findIndex(q => q.span === 1);
      if (j > 0) i = j;
    }
    const q = queue.splice(i, 1)[0];
    if (q.span === 2) {
      const y = Math.max(colH[0], colH[1]);
      out.push({ ...q.e, x: 0, y, w: 2, h: q.h });
      colH[0] = colH[1] = y + q.h;
    } else {
      const c = colH[1] < colH[0] ? 1 : 0;
      out.push({ ...q.e, x: c, y: colH[c], w: 1, h: q.h });
      colH[c] += q.h;
    }
  }
  return out;
};

// Alte Konfiguration (v1: weather_source / entities / iframes / cards) in Elemente umwandeln
const fwcMigrate = (config) => {
  if (!config || Array.isArray(config.elements)) return config;
  const legacy = ['weather_source', 'temp_entity', 'hum_entity', 'press_entity', 'extra_sensor_1', 'extra_sensor_2', 'iframes', 'entities',
    'cards', 'title', 'font_size', 'iframe_height', 'hero_iframe_height', 'disable_padding', 'compact_gap', 'iframe_cols', 'entity_cols',
    'layout_mode', 'entities_position', 'enable_temp_color', 'cards_cols', 'cards_position', 'cards_compact', 'cards_gap'];
  if (!legacy.some(k => config[k] !== undefined)) return { ...config, elements: [] };
  const cols = FWC_DEFAULTS.columns;
  const els = [];
  let y = 0;
  let n = 0;
  const add = (e) => { n += 1; els.push({ id: `${e.type}_${n}`, ...e }); };
  const rowFill = (list, perRow, h, mk) => {
    const w = Math.max(1, Math.round(cols / Math.max(1, perRow)));
    list.forEach((item, i) => {
      const x = (i % perRow) * w;
      if (i > 0 && i % perRow === 0) y += h;
      add({ ...mk(item), x: Math.min(x, cols - w), y, w, h });
    });
    if (list.length) y += h;
  };
  if (config.title) { add({ type: 'header', x: 0, y, w: cols, h: 1, text: config.title, show_time: false }); y += 1; }
  if (config.weather_source === 'entity' && config.weather_entity) { add({ type: 'current', x: 0, y, w: cols, h: 3 }); y += 3; }
  if (config.weather_source === 'manual' && config.temp_entity) {
    add({ type: 'temperature', x: 0, y, w: 3, h: 2, entity: config.temp_entity, temp_colors: config.enable_temp_color !== false });
    if (config.hum_entity) add({ type: 'value', x: 3, y, w: 3, h: 1, metric: 'humidity', entity: config.hum_entity });
    if (config.press_entity) add({ type: 'sensor', x: 3, y: y + 1, w: 3, h: 1, entity: config.press_entity });
    y += 2;
    const extra = [config.extra_sensor_1, config.extra_sensor_2].filter(Boolean);
    rowFill(extra, 2, 1, e => ({ type: 'sensor', entity: e }));
  }
  const ents = (config.entities || []).filter(e => e && e.entity);
  const entityRows = () => rowFill(ents, Number(config.entity_cols) || 3, 1, e => ({ type: 'sensor', entity: e.entity, name: e.name || '', icon: e.icon || '' }));
  if (config.entities_position !== 'bottom') entityRows();
  const frames = (config.iframes || []).filter(f => f && f.url);
  const fh = Math.max(1, Math.round((parseInt(config.iframe_height, 10) || 200) / 64));
  rowFill(frames, Number(config.iframe_cols) || 1, fh, f => ({ type: 'image', url: f.url }));
  if (config.entities_position === 'bottom') entityRows();
  const cards = (config.cards || []).map(c => c.card_config || c).filter(c => c && c.type);
  rowFill(cards, Number(config.cards_cols) || 1, 4, c => ({ type: 'card', card: c }));
  const out = { ...config, columns: cols, elements: els };
  legacy.forEach(k => delete out[k]);
  if (config.weather_source !== 'entity') delete out.weather_entity;
  if (config.weather_entity && config.weather_source === 'entity') out.weather_entity = config.weather_entity;
  return out;
};

const fwcLoadCardHelpers = async () => {
  if (window.loadCardHelpers) return window.loadCardHelpers();
  return null;
};

class FlexibleWeatherCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      config: { attribute: false },
      // Designer
      designMode: { type: Boolean, attribute: 'design-mode', reflect: true },
      selectedId: { attribute: false },
      previewElements: { attribute: false },
      ghost: { attribute: false },
      dragId: { attribute: false },
      _tick: { state: true },
      _forecast: { state: true },
      _expanded: { state: true },
      _cw: { state: true },
    };
  }

  constructor() {
    super();
    this._uid = Math.random().toString(36).slice(2, 7);
    this._forecast = {};
    this._subs = {};
    this._subKey = null;
    this._expanded = new Set();
    this._childCards = new Map();
    this._tick = 0;
    this._ui = new Map();
    this._notify = () => this.requestUpdate();
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    const c = fwcMigrate(JSON.parse(JSON.stringify(config)));
    const cols = Math.max(1, Math.min(24, Number(c.columns) || FWC_DEFAULTS.columns));
    const used = new Set();
    c.elements = (c.elements || []).filter(e => e && e.type).map((e, i) => {
      let id = e.id || `${e.type}_${i + 1}`;
      while (used.has(id)) id = `${id}_`;
      used.add(id);
      const def = FWC_EL.TYPES[e.type];
      return FWC_LAYOUT.normalize({ w: def ? def.w : 2, h: def ? def.h : 1, ...e, id }, cols);
    });
    this.config = c;
  }

  connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => { this._tick += 1; }, 60000);
    this._observeSize();
    this._observeVisibility();
    this._subKey = null;
    if (this.hass && this.config) this._ensureSubscriptions();
  }

  firstUpdated() {
    // Mit der Maus ziehen = horizontal wischen (Touch scrollt nativ)
    this.renderRoot.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || this.designMode) return;
      const sc = e.composedPath().find(n => n.classList && n.classList.contains('fwc-swipe'));
      if (!sc || sc.scrollWidth <= sc.clientWidth + 1) return;
      const x0 = e.clientX, l0 = sc.scrollLeft;
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - x0;
        if (!moved && Math.abs(dx) > 4) { moved = true; sc.classList.add('dragging'); }
        if (moved) { sc.scrollLeft = l0 - dx; ev.preventDefault(); }
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        sc.classList.remove('dragging');
        if (moved) this._swipeAt = Date.now();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  // Aufgeklappte Elemente (z. B. Wetterwarnung): die unterste Rasterzeile des Elements wird so weit vergrößert,
  // bis der ganze Inhalt passt – die Elemente darunter rutschen nach unten, Elemente daneben behalten ihre Größe
  updated() {
    const grid = this.renderRoot.querySelector('.fwc-grid');
    if (!grid || this.designMode) return;
    const grown = this.renderRoot.querySelectorAll('.fwc-el.grow');
    if (!grown.length && !grid._grow) return;
    grid.removeAttribute('data-grow');
    (grid._grow || []).forEach((c) => { c.style.height = ''; c.style.alignSelf = ''; });
    grid._grow = null;
    if (!grown.length) return;
    const span = (cell) => {
      const m = /^(\d+)\s*\/\s*span\s+(\d+)/.exec(cell.style.gridRow || '');
      return m ? [Number(m[1]), Number(m[1]) + Number(m[2]) - 1] : null;
    };
    const cs = getComputedStyle(grid);
    const row = parseFloat(cs.gridAutoRows) || 0;
    if (!row) return;
    const extra = new Map();
    grown.forEach((el) => {
      const cell = el.parentElement;
      const sp = span(cell);
      if (!sp) return;
      const last = sp[1];
      const need = Math.ceil(el.offsetHeight - cell.getBoundingClientRect().height);
      if (need > 1) extra.set(last, Math.max(extra.get(last) || 0, need));
    });
    if (!extra.size) return;
    // Elemente, die in einer vergrößerten Zeile liegen, aber nicht selbst wachsen: Größe festhalten (oben ausgerichtet)
    const pinned = [];
    grid.querySelectorAll(':scope > .fwc-cell').forEach((cell) => {
      if (cell.querySelector(':scope > .fwc-el.grow')) return;
      const sp = span(cell);
      if (!sp || ![...extra.keys()].some(r => r >= sp[0] && r <= sp[1])) return;
      cell.style.height = `${cell.getBoundingClientRect().height}px`;
      cell.style.alignSelf = 'start';
      pinned.push(cell);
    });
    // feste Zeilenzahl der Card (rows) beibehalten
    const fixed = Number((/repeat\((\d+)/.exec(grid.style.gridTemplateRows || '') || [])[1]) || 0;
    const rows = Math.max(fixed, ...extra.keys());
    grid.style.setProperty('--fwc-grow-rows', Array.from({ length: rows }, (_, i) => (extra.has(i + 1) ? `${row + extra.get(i + 1)}px` : `${row}px`)).join(' '));
    grid.setAttribute('data-grow', '');
    grid._grow = pinned;
  }

  // Animationen anhalten, solange die Card nicht im sichtbaren Bereich ist (spart Rechenzeit für andere Cards)
  _observeVisibility() {
    if (this._io || typeof IntersectionObserver === 'undefined') return;
    this._io = new IntersectionObserver((entries) => {
      const vis = entries[entries.length - 1].isIntersecting;
      this.toggleAttribute('offscreen', !vis);
    }, { rootMargin: '120px' });
    this._io.observe(this);
  }

  // Breite der Card beobachten (für die proportionale Skalierung auf großen Bildschirmen)
  _observeSize() {
    if (this._ro || typeof ResizeObserver === 'undefined') return;
    this._ro = new ResizeObserver((entries) => {
      const w = Math.round((entries[0].contentRect.width || 0) / 4) * 4;
      if (w && w !== this._cw) this._cw = w;
    });
    this._ro.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    if (this._io) { this._io.disconnect(); this._io = null; }
    clearInterval(this._timer);
    this._unsubscribeAll();
  }

  get _elements() {
    return this.previewElements || (this.config && this.config.elements) || [];
  }

  // Nur neu rendern, wenn sich eine beobachtete Entität geändert hat
  shouldUpdate(changed) {
    if (changed.size !== 1 || !changed.has('hass')) return true;
    const old = changed.get('hass');
    if (!old || !this.config) return true;
    if (old.locale !== this.hass.locale || old.themes !== this.hass.themes || old.language !== this.hass.language) return true;
    this._childCards.forEach((c) => { if (c.el) c.el.hass = this.hass; });
    return this._watched().some(id => old.states[id] !== this.hass.states[id]);
  }

  _watched() {
    const c = this.config;
    const ids = new Set([c.weather_entity, c.sun_entity || 'sun.sun', c.moon_entity || 'sensor.moon_phase']);
    Object.values(c.sensors || {}).forEach(v => ids.add(v));
    (c.warning_entities || []).forEach(v => ids.add(v));
    this._elements.forEach((e) => {
      // alle Entitäts-Felder eines Elements (entity, direction_entity, gust_entity, min_entity, max_entity …)
      Object.keys(e).forEach((k) => { if ((k === 'entity' || k.endsWith('_entity')) && typeof e[k] === 'string') ids.add(e[k]); });
      if (e.type === 'moon' && !e.entity) ids.add(c.moon_entity || 'sensor.moon_phase');
      (e.entities || []).forEach(v => ids.add(v));
    });
    if (!(c.warning_entities || []).length && this._elements.some(e => e.type === 'warnings' && !(e.entities || []).length) && this.hass) {
      FWC_MODEL.autoWarningEntities(this.hass).forEach(v => ids.add(v));
    }
    ids.delete(undefined); ids.delete(null); ids.delete('');
    return [...ids];
  }

  willUpdate(changed) {
    if ((changed.has('hass') || changed.has('config') || changed.has('previewElements')) && this.hass && this.config) {
      this._ensureSubscriptions();
    }
    // Eingebettete Karten von entfernten Elementen freigeben
    if ((changed.has('config') || changed.has('previewElements')) && this._childCards.size) {
      const ids = new Set(this._elements.filter(e => e.type === 'card').map(e => e.id));
      [...this._childCards.keys()].forEach((id) => { if (!ids.has(id)) this._childCards.delete(id); });
    }
  }

  /* --- Forecast-Abo (weather/subscribe_forecast) ---------------------------------------------- */
  _ensureSubscriptions() {
    if (!this.isConnected) return;
    const eid = this.config.weather_entity;
    const st = eid && this.hass.states[eid];
    const need = FWC_EL.needs(this._elements);
    const types = [];
    if (st && this.hass.connection) {
      const sf = Number(st.attributes.supported_features) || 0;
      if (need.daily) { if (sf & 1) types.push('daily'); else if (sf & 4) types.push('twice_daily'); }
      if (need.hourly && (sf & 2)) types.push('hourly');
      if (need.daily && !(sf & 5) && (sf & 2)) types.push('hourly');
    }
    const key = `${eid}|${[...new Set(types)].join(',')}`;
    if (key === this._subKey) return;
    this._unsubscribeAll();
    this._subKey = key;
    this._subTypes = [...new Set(types)];
    [...new Set(types)].forEach((type) => {
      this._subs[type] = this.hass.connection.subscribeMessage(
        (ev) => { this._forecast = { ...this._forecast, [type]: ev.forecast || [] }; },
        { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: eid },
      ).catch((e) => { console.warn('[flexible-weather-card] forecast', type, e && e.message ? e.message : e); return null; });
    });
  }

  _unsubscribeAll() {
    Object.values(this._subs).forEach((p) => { Promise.resolve(p).then((un) => { if (typeof un === 'function') un(); }).catch(() => {}); });
    this._subs = {};
    this._forecast = {};
    this._subKey = null;
    this._subTypes = [];
  }

  // Abonnierte, aber noch nicht eingetroffene Vorhersagen (dann noch nicht online nachladen)
  _pending() {
    const t = this._subTypes || [];
    const got = (k) => this._forecast[k] !== undefined;
    return {
      daily: (t.includes('daily') && !got('daily')) || (t.includes('twice_daily') && !got('twice_daily')),
      hourly: t.includes('hourly') && !got('hourly'),
    };
  }

  /* --- Eingebettete HA-Karten ----------------------------------------------------------------- */
  _childCard(el) {
    const key = JSON.stringify(el.card);
    let entry = this._childCards.get(el.id);
    if (!entry || entry.key !== key) {
      entry = { key, el: null };
      this._childCards.set(el.id, entry);
      fwcLoadCardHelpers().then((helpers) => {
        if (!helpers) return;
        const card = helpers.createCardElement(el.card);
        card.hass = this.hass;
        card.addEventListener('ll-rebuild', () => { this._childCards.delete(el.id); this.requestUpdate(); });
        entry.el = card;
        this.requestUpdate();
      }).catch((e) => console.warn('[flexible-weather-card] card', e));
    } else if (entry.el) {
      entry.el.hass = this.hass;
    }
    return entry.el;
  }

  /* --- Aktionen -------------------------------------------------------------------------------- */
  _tapMode(el, def) {
    if (el.tap_action) return 'action';
    return def.tap ? def.tap(el) : 'more-info';
  }

  _clickable(el, def) {
    const mode = this._tapMode(el, def);
    if (mode === 'action') return el.tap_action.action !== 'none';
    if (mode === 'none') return false;
    return !!(def.entity && def.entity(el, this._model));
  }

  _onTap(ev, el, def) {
    if (this.designMode || !this.hass) return;
    if (this._swipeAt && Date.now() - this._swipeAt < 350) return; // Klick nach dem Wischen ignorieren
    const mode = this._tapMode(el, def);
    const eid = def.entity ? def.entity(el, this._model) : null;
    if (mode === 'action') {
      fireEvent(this, 'hass-action', { config: { entity: eid || undefined, tap_action: el.tap_action }, action: 'tap' });
      return;
    }
    if (mode === 'none' || !eid) return;
    if (mode === 'toggle') this.hass.callService('homeassistant', 'toggle', { entity_id: eid });
    else fireEvent(this, 'hass-more-info', { entityId: eid });
  }

  _toggleExpand(key) {
    const s = new Set(this._expanded);
    if (s.has(key)) s.delete(key); else s.add(key);
    this._expanded = s;
  }

  /* --- Rendern -------------------------------------------------------------------------------- */
  render() {
    if (!this.config || !this.hass) return html``;
    const cfg = this.config;
    const lang = fwcLang(this.hass, cfg);
    const t = fwcT(lang);
    const cfgCols = Math.max(1, Math.min(24, Number(cfg.columns) || FWC_DEFAULTS.columns));
    // Auf dem Handy breite Karten zweispaltig umbrechen (abschaltbar mit mobile_layout: false)
    const mobile = !this.designMode && cfg.mobile_layout !== false && cfgCols > 6 && this._cw > 0 && this._cw < (Number(cfg.mobile_breakpoint) || 600);
    const cols = mobile ? 2 : cfgCols;
    const rowH = Math.max(20, Number(cfg.row_height) || FWC_DEFAULTS.row_height);
    const gap = Math.max(0, Number(cfg.gap ?? FWC_DEFAULTS.gap));
    const pad = Math.max(0, Number(cfg.padding ?? FWC_DEFAULTS.padding));
    const elements = this._elements;
    const need = FWC_EL.needs(elements);
    // Sensoren: Karte > eigene Sensoren der Elemente > Wetterintegration > Open-Meteo
    const dataCfg = { ...cfg, sensors: { ...FWC_EL.elementSensors(elements), ...(cfg.sensors || {}) } };
    const model = FWC_MODEL.build(this.hass, dataCfg, { forecast: this._forecast, pending: this._pending(), notify: this._notify }, need);
    this._model = model;
    // Animationen: aus, wenn in der Card abgeschaltet oder das Gerät „Bewegung reduzieren“ eingestellt hat
    const reduce = cfg.respect_reduced_motion !== false && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = cfg.animations !== false && !reduce;
    const ctx = {
      hass: this.hass, config: cfg, lang, t, f: this._formatters(lang), uid: this._uid, anim, design: !!this.designMode,
      expanded: this._expanded, toggleExpand: (k) => this._toggleExpand(k), childCard: (el) => this._childCard(el),
      onTap: (e, el, def) => this._onTap(e, el, def), clickable: (el, def) => this._clickable(el, def), notify: this._notify,
      ui: { get: k => this._ui.get(k), set: (k, v) => { this._ui.set(k, v); this.requestUpdate(); } },
    };

    // Ausgeblendete (leere) Elemente: im Designer sichtbar, in der Card fallen leere Zeilen weg
    const hidden = new Set(elements.filter((e) => {
      const def = FWC_EL.TYPES[e.type];
      return def && def.isEmpty && def.isEmpty(e, model);
    }).map(e => e.id));
    const shown = this.designMode ? elements
      : mobile ? fwcMobileLayout(elements.filter(e => !hidden.has(e.id)), cfgCols, this._cw, Number(cfg.design_width) || 0)
        : FWC_LAYOUT.collapse(elements, hidden);
    const rows = FWC_LAYOUT.rows(shown);
    const designRows = this.designMode ? Math.max(rows + 3, 6) : rows;

    // Auf breiteren Bildschirmen als im Designer gestaltet proportional vergrößern statt nur in die Breite zu ziehen –
    // so sieht die Card aus wie im Editor (Zeilenhöhe, Abstände und Schrift wachsen mit)
    const dw = Number(cfg.design_width) || 0;
    const k = !this.designMode && dw && cfg.keep_proportions !== false && this._cw > dw * 1.04 ? Math.min(this._cw / dw, 3) : 1;
    const px = v => `${Math.round(v * k * 10) / 10}px`;
    const fs = (Number(cfg.font_scale) || 1) * k;
    const style = [
      `--fwc-cols:${cols}`, `--fwc-row:${px(rowH)}`, `--fwc-gap:${px(gap)}`, `--fwc-pad:${px(pad)}`,
      fs !== 1 ? `--fwc-scale:${Math.round(fs * 1000) / 1000}` : '',
      cfg.element_radius !== undefined && cfg.element_radius !== '' ? `--fwc-radius:${px(Number(cfg.element_radius))}` : '',
    ].filter(Boolean).join(';');

    const attrib = [];
    if (cfg.show_attribution !== false) {
      if (model.usedOnline && model.online) attrib.push(`${t('w.data_by')}: ${model.online}`);
      if (model.warnSource === 'online' && elements.some(e => e.type === 'warnings')) attrib.push(`${t('w.warnings_by')}: DWD / Bright Sky`);
    }
    const empty = !elements.length;

    return html`
      <ha-card class="${cfg.card_style === 'transparent' ? 'transparent' : ''} ${anim ? '' : 'no-anim'} ${this.designMode ? 'design' : ''}" style="${style}">
        ${raw(FWC_EL.DEFS)}
        ${empty && !this.designMode ? html`<div class="fwc-placeholder"><ha-icon icon="mdi:view-dashboard-edit-outline"></ha-icon><span>${t('w.empty_card')}</span></div>` : ''}
        ${model.missingWeather ? html`<div class="fwc-warn"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${t('w.not_found')}: ${cfg.weather_entity}</div>` : ''}
        <div class="fwc-grid ${this.designMode ? 'design' : ''}" style="${designRows ? `grid-template-rows: repeat(${designRows}, var(--fwc-row));` : ''}">
          ${this.designMode ? this._renderDesignCells(cols, designRows) : ''}
          ${shown.map(el => this._renderCell(el, model, ctx, hidden.has(el.id)))}
          ${this.designMode && this.ghost ? html`<div class="fwc-ghost ${this.ghost.invalid ? 'invalid' : ''}" style="grid-column:${this.ghost.x + 1} / span ${this.ghost.w};grid-row:${this.ghost.y + 1} / span ${this.ghost.h}"></div>` : ''}
        </div>
        ${attrib.length ? html`<div class="fwc-attrib">${attrib.join(' · ')}</div>` : ''}
      </ha-card>
    `;
  }

  // Formatierer (Intl-Objekte) nur neu anlegen, wenn sich Sprache, Profil-Einstellungen oder Zeitzone ändern
  _formatters(lang) {
    const h = this.hass;
    const key = `${lang}|${h.language}|${h.config && h.config.time_zone}`;
    if (!this._fmt || this._fmt.locale !== h.locale || this._fmt.key !== key) this._fmt = { locale: h.locale, key, f: fwcFormatters(h, lang) };
    return this._fmt.f;
  }

  _renderCell(el, model, ctx, isHidden) {
    const sel = this.designMode && this.selectedId === el.id;
    const def = FWC_EL.TYPES[el.type];
    return html`<div class="fwc-cell ${sel ? 'sel' : ''} ${this.dragId === el.id ? 'dragging' : ''} ${isHidden ? 'is-hidden' : ''}"
        data-fwc-cell=${el.id} style="grid-column:${el.x + 1} / span ${el.w};grid-row:${el.y + 1} / span ${el.h}${el.radius !== undefined && el.radius !== '' ? `;--fwc-radius:${Number(el.radius)}px` : ''}">
      ${FWC_EL.render(el, model, ctx)}
      ${this.designMode ? html`
        <div class="fwc-cover" data-fwc-id=${el.id}></div>
        ${isHidden ? html`<div class="fwc-hidden-badge"><ha-icon icon="mdi:eye-off-outline"></ha-icon></div>` : ''}
        ${sel ? html`<div class="fwc-badge"><ha-icon .icon=${def ? def.icon : 'mdi:help'}></ha-icon>${ctx.t(`el.${el.type}`)} · ${el.w}×${el.h}</div>
          <div class="fwc-handle" data-fwc-handle=${el.id} title="↘"></div>` : ''}` : ''}
    </div>`;
  }

  _renderDesignCells(cols, rows) {
    const out = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) out.push(html`<div class="fwc-dcell" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`);
    }
    return out;
  }

  /* --- HA-Schnittstellen ---------------------------------------------------------------------- */
  getCardSize() {
    const c = this.config || {};
    const rows = FWC_LAYOUT.rows(this._elements);
    const px = rows * (Number(c.row_height) || FWC_DEFAULTS.row_height) + Math.max(0, rows - 1) * (Number(c.gap ?? FWC_DEFAULTS.gap)) + 2 * (Number(c.padding ?? FWC_DEFAULTS.padding));
    return Math.max(1, Math.ceil(px / 50));
  }

  // Sections-Ansicht: volle Breite als Standard, Höhe richtet sich nach dem Inhalt (rows nicht gesetzt)
  getGridOptions() {
    return { columns: 12, min_columns: 3 };
  }

  // Vorlagen auch von außen erreichbar (Designer, Tests)
  static template(name) {
    return fwcTemplate(name);
  }

  static getConfigElement() {
    return document.createElement('flexible-weather-card-editor');
  }

  static getStubConfig(hass) {
    const weather = hass ? Object.keys(hass.states).find(e => e.startsWith('weather.')) : undefined;
    return { ...(weather ? { weather_entity: weather } : {}), columns: 6, elements: fwcTemplate('standard') };
  }

  static get styles() {
    return [FWC_EL.styles, css`
      :host { display: block; }
      /* außerhalb des sichtbaren Bereichs: alle Animationen anhalten */
      :host([offscreen]) *, :host([offscreen]) *::before, :host([offscreen]) *::after { animation-play-state: paused !important; }
      ha-card {
        --fwc-radius: max(4px, calc(var(--ha-card-border-radius, 12px) - 4px));
        --fwc-tile-bg: var(--fwc-tile-background, rgba(var(--rgb-primary-text-color, 128, 128, 128), 0.05));
        --fwc-tile-hover: rgba(var(--rgb-primary-text-color, 128, 128, 128), 0.09);
        --fwc-tile-solid: var(--ha-card-background, var(--card-background-color, #fff));
        position: relative; height: 100%; box-sizing: border-box; padding: var(--fwc-pad); overflow: hidden;
        font-size: calc(14px * var(--fwc-scale, 1));
      }
      ha-card.transparent { background: none; border: none; box-shadow: none; --fwc-tile-solid: var(--primary-background-color, #fafafa); }
      .fwc-grid {
        position: relative; display: grid; gap: var(--fwc-gap);
        grid-template-columns: repeat(var(--fwc-cols), minmax(0, 1fr)); grid-auto-rows: var(--fwc-row);
      }
      .fwc-grid[data-grow] { grid-template-rows: var(--fwc-grow-rows) !important; }
      .fwc-cell { position: relative; min-width: 0; min-height: 0; }
      .fwc-attrib { margin-top: 6px; text-align: right; font-size: 10.5px; color: var(--secondary-text-color); opacity: .75; }
      .fwc-placeholder { display: flex; align-items: center; gap: 12px; padding: 8px; color: var(--secondary-text-color); }
      .fwc-placeholder ha-icon { --mdc-icon-size: 32px; color: var(--primary-color); }
      .fwc-warn { display: flex; align-items: center; gap: 8px; color: var(--error-color, #db4437); font-size: 13px; margin-bottom: 8px; }

      /* --- Design-Modus (Layout-Designer) ---------------------------------------------------- */
      .fwc-dcell { border-radius: var(--fwc-radius); border: 1px dashed color-mix(in srgb, var(--primary-text-color) 14%, transparent); box-sizing: border-box; pointer-events: none; }
      :host([design-mode]) .fwc-el { pointer-events: none; user-select: none; }
      :host([design-mode]) .fwc-cell { cursor: grab; transition: box-shadow .15s; border-radius: var(--fwc-radius); background: var(--fwc-tile-solid); }
      :host([design-mode]) .fwc-cell:hover { box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--primary-color) 55%, transparent); }
      .fwc-cover { position: absolute; inset: 0; z-index: 2; border-radius: var(--fwc-radius); touch-action: none; }
      .fwc-cell.sel { z-index: 3; box-shadow: 0 0 0 2px var(--primary-color), 0 6px 18px rgba(0, 0, 0, .18) !important; }
      .fwc-cell.dragging { z-index: 4; opacity: .92; box-shadow: 0 0 0 2px var(--primary-color), 0 14px 30px rgba(0, 0, 0, .3) !important; cursor: grabbing; }
      .fwc-cell.is-hidden > .fwc-el { opacity: .45; }
      .fwc-hidden-badge { position: absolute; top: 4px; right: 4px; z-index: 3; color: var(--secondary-text-color); --mdc-icon-size: 16px; pointer-events: none; }
      .fwc-badge { position: absolute; left: 6px; top: -11px; z-index: 5; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px;
        border-radius: 10px; background: var(--primary-color); color: var(--text-primary-color, #fff); font-size: 11px; font-weight: 600; white-space: nowrap; pointer-events: none; --mdc-icon-size: 13px; }
      .fwc-handle { position: absolute; right: -7px; bottom: -7px; z-index: 6; width: 18px; height: 18px; border-radius: 50%; cursor: nwse-resize;
        background: var(--primary-color); border: 3px solid var(--card-background-color, #fff); box-sizing: border-box; box-shadow: 0 1px 4px rgba(0, 0, 0, .3); touch-action: none; }
      .fwc-ghost { border-radius: var(--fwc-radius); border: 2px dashed var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); pointer-events: none; z-index: 1; }
      .fwc-ghost.invalid { border-color: var(--error-color, #db4437); background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }
    `];
  }
}

// raw() aus fwc-elements.js steht hier nicht zur Verfügung -> eigener kleiner Helfer
const raw = (markup, cls = '') => html`<fwc-svg class="${cls}" .markup=${markup}></fwc-svg>`;

if (!customElements.get('flexible-weather-card')) customElements.define('flexible-weather-card', FlexibleWeatherCard);

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'flexible-weather-card')) {
  window.customCards.push({
    type: 'flexible-weather-card',
    name: 'Flexible Weather Card',
    preview: true,
    description: 'Frei gestaltbare Wetterkarte mit Drag & Drop Layout-Designer',
    documentationURL: 'https://github.com/jayjojayson/flexible-weather-card',
  });
}

console.info(`%c🌤️ Flexible Weather Card ${CARD_VERSION} ready`, 'background:#1e88e5;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold;');
