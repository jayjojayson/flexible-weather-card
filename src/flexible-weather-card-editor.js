/*
 * Flexible Weather Card - EDITOR FILE
 * Dateiname: flexible-weather-card-editor.js
 * Version: 2.2
 * Karten-Editor (HA-Formular) für Datenquellen und Grundeinstellungen.
 * Das Layout selbst wird im Layout-Designer (Popup) per Drag & Drop gestaltet.
 */

const FWC_E_I18N = {
  de: {
    sources: 'Datenquellen', weather_entity: 'Wetter-Entität (z. B. DWD, Met.no, OpenWeatherMap)',
    online_fallback: 'Fehlende Werte online laden (Open-Meteo)', sensors: 'Eigene Sensoren (überschreiben die Wetter-Entität)',
    astro: 'Sonne, Mond & Warnungen', sun_entity: 'Sonnen-Entität (leer = sun.sun oder berechnet)', moon_entity: 'Mondphasen-Sensor (leer = berechnet)',
    warning_entities: 'Warn-Entitäten (DWD Weather Warnings, Meteoalarm; leer = automatisch)', warnings_online: 'Warnungen online laden, wenn keine Entität (DWD / Bright Sky, nur DE)',
    location: 'Standort (leer = Home-Assistant-Standort)', latitude: 'Breitengrad', longitude: 'Längengrad',
    display: 'Allgemein', language: 'Sprache', show_attribution: 'Datenquelle in der Karte nennen (online)', animations: 'Animationen',
    lang_auto: 'Wie Home Assistant', layout: 'Layout', open_designer: 'Layout-Designer öffnen',
    designer_hint: 'Ordne alle Wetter-Elemente frei per Drag & Drop an – Temperatur, Wind, Sonnenstand, Vorhersage, Warnungen und mehr.',
    elements: '{n} Elemente', columns: '{n} Spalten', no_layout: 'Noch kein Layout – im Designer eine Vorlage wählen oder frei starten.',
    info_online: 'Keine Wetter-Entität gewählt: Die Karte lädt die Daten von Open-Meteo (kostenlos, ohne Schlüssel).',
    info_offline: 'Keine Wetter-Entität und Online-Daten aus: Es stehen nur eigene Sensoren sowie berechnete Sonnen- und Monddaten zur Verfügung.',
    s_temperature: 'Temperatur', s_apparent_temperature: 'Gefühlte Temperatur', s_dew_point: 'Taupunkt', s_humidity: 'Luftfeuchte', s_pressure: 'Luftdruck',
    s_wind_speed: 'Windgeschwindigkeit', s_wind_gust: 'Böen', s_wind_bearing: 'Windrichtung', s_visibility: 'Sichtweite', s_uv_index: 'UV-Index',
    s_cloud_coverage: 'Bewölkung', s_precipitation: 'Niederschlag (aktuell)', s_precipitation_probability: 'Regenwahrscheinlichkeit',
    s_temperature_min: 'Tiefstwert heute (Min-Temperatur)', s_temperature_max: 'Höchstwert heute (Max-Temperatur)',
    s_solar_radiation: 'Solarstrahlung (W/m²)', element_radius: 'Eckenradius aller Elemente (px, leer = Theme)', font_scale: 'Schriftgröße (0,8 – 1,3)',
  },
  en: {
    sources: 'Data sources', weather_entity: 'Weather entity (e.g. DWD, Met.no, OpenWeatherMap)',
    online_fallback: 'Load missing values online (Open-Meteo)', sensors: 'Own sensors (override the weather entity)',
    astro: 'Sun, moon & warnings', sun_entity: 'Sun entity (empty = sun.sun or calculated)', moon_entity: 'Moon phase sensor (empty = calculated)',
    warning_entities: 'Warning entities (DWD Weather Warnings, Meteoalarm; empty = automatic)', warnings_online: 'Load warnings online if no entity (DWD / Bright Sky, Germany only)',
    location: 'Location (empty = Home Assistant location)', latitude: 'Latitude', longitude: 'Longitude',
    display: 'General', language: 'Language', show_attribution: 'Name the data source in the card (online)', animations: 'Animations',
    lang_auto: 'Like Home Assistant', layout: 'Layout', open_designer: 'Open layout designer',
    designer_hint: 'Arrange all weather elements freely by drag & drop – temperature, wind, sun position, forecast, warnings and more.',
    elements: '{n} elements', columns: '{n} columns', no_layout: 'No layout yet – pick a template in the designer or start from scratch.',
    info_online: 'No weather entity selected: the card loads its data from Open-Meteo (free, no key).',
    info_offline: 'No weather entity and online data off: only your own sensors plus calculated sun and moon data are available.',
    s_temperature: 'Temperature', s_apparent_temperature: 'Feels like', s_dew_point: 'Dew point', s_humidity: 'Humidity', s_pressure: 'Pressure',
    s_wind_speed: 'Wind speed', s_wind_gust: 'Gusts', s_wind_bearing: 'Wind direction', s_visibility: 'Visibility', s_uv_index: 'UV index',
    s_cloud_coverage: 'Cloud cover', s_precipitation: 'Precipitation (current)', s_precipitation_probability: 'Chance of rain',
    s_temperature_min: 'Low today (min temperature)', s_temperature_max: 'High today (max temperature)',
    s_solar_radiation: 'Solar radiation (W/m²)', element_radius: 'Corner radius of all elements (px, empty = theme)', font_scale: 'Font size (0.8 – 1.3)',
  },
};

const FWC_SENSOR_CLASSES = {
  // Min/Max oft als Systemvariable/Template ohne device_class
  temperature: 'temperature', temperature_min: null, temperature_max: null, apparent_temperature: 'temperature', dew_point: 'temperature', humidity: 'humidity',
  pressure: ['pressure', 'atmospheric_pressure'], wind_speed: 'wind_speed', wind_gust: 'wind_speed', wind_bearing: null, visibility: 'distance',
  uv_index: null, cloud_coverage: null, precipitation: ['precipitation', 'precipitation_intensity'], precipitation_probability: null,
  solar_radiation: 'irradiance',
};

class FlexibleWeatherCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      lovelace: { attribute: false },
      _config: { state: true },
      _designerOpen: { state: true },
    };
  }

  setConfig(config) {
    this._config = fwcMigrate(JSON.parse(JSON.stringify(config || {})));
  }

  get _lang() { return fwcLang(this.hass, this._config); }

  _e(key, vars) {
    const d = FWC_E_I18N[this._lang] || FWC_E_I18N.en;
    let v = d[key] || FWC_E_I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => { v = v.replace(`{${k}}`, vars[k]); });
    return v;
  }

  _fire(config) {
    this._config = config;
    fireEvent(this, 'config-changed', { config });
  }

  // Leere Werte entfernen, damit die YAML schlank bleibt
  _clean(c) {
    const out = { ...c };
    Object.keys(out).forEach((k) => { if (out[k] === '' || out[k] === null || out[k] === undefined) delete out[k]; });
    if (out.sensors) {
      const s = {};
      Object.keys(out.sensors).forEach((k) => { if (out.sensors[k]) s[k] = out.sensors[k]; });
      if (Object.keys(s).length) out.sensors = s; else delete out.sensors;
    }
    if (out.location) {
      const l = {};
      ['latitude', 'longitude'].forEach((k) => { if (out.location[k] !== undefined && out.location[k] !== '' && out.location[k] !== null) l[k] = Number(out.location[k]); });
      if (Object.keys(l).length) out.location = l; else delete out.location;
    }
    if (Array.isArray(out.warning_entities) && !out.warning_entities.length) delete out.warning_entities;
    if (out.language === 'auto') delete out.language;
    ['online_fallback', 'warnings_online', 'show_attribution', 'animations'].forEach((k) => { if (out[k] === true) delete out[k]; });
    return out;
  }

  _schema() {
    const sensors = Object.keys(FWC_SENSOR_CLASSES).map((k) => {
      const dc = FWC_SENSOR_CLASSES[k];
      return { name: k, selector: { entity: { filter: { domain: ['sensor', 'input_number'], ...(dc ? { device_class: dc } : {}) } } } };
    });
    return [
      { name: 'weather_entity', selector: { entity: { filter: { domain: 'weather' } } } },
      { name: 'online_fallback', selector: { boolean: {} } },
      { type: 'expandable', name: 'sensors', title: this._e('sensors'), icon: 'mdi:home-thermometer-outline', schema: sensors },
      {
        type: 'expandable', name: 'astro_group', flatten: true, title: this._e('astro'), icon: 'mdi:weather-sunset',
        schema: [
          { name: 'sun_entity', selector: { entity: { filter: { domain: 'sun' } } } },
          { name: 'moon_entity', selector: { entity: { filter: { domain: 'sensor' } } } },
          { name: 'warning_entities', selector: { entity: { multiple: true, filter: { domain: ['sensor', 'binary_sensor'] } } } },
          { name: 'warnings_online', selector: { boolean: {} } },
        ],
      },
      {
        type: 'expandable', name: 'location', title: this._e('location'), icon: 'mdi:map-marker-outline',
        schema: [{ type: 'grid', name: '', schema: [
          { name: 'latitude', selector: { number: { min: -90, max: 90, step: 0.0001, mode: 'box' } } },
          { name: 'longitude', selector: { number: { min: -180, max: 180, step: 0.0001, mode: 'box' } } },
        ] }],
      },
      {
        type: 'expandable', name: 'display_group', flatten: true, title: this._e('display'), icon: 'mdi:cog-outline',
        schema: [
          { name: 'language', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: this._e('lang_auto') }, { value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }] } } },
          { name: 'element_radius', selector: { number: { min: 0, max: 40, step: 1, mode: 'box', unit_of_measurement: 'px' } } },
          { name: 'font_scale', selector: { number: { min: 0.8, max: 1.3, step: 0.05, mode: 'slider' } } },
          { name: 'animations', selector: { boolean: {} } },
          { name: 'show_attribution', selector: { boolean: {} } },
        ],
      },
    ];
  }

  _label = (s) => {
    if (FWC_SENSOR_CLASSES[s.name] !== undefined) return this._e(`s_${s.name}`);
    return this._e(s.name);
  };

  _formData() {
    const c = this._config;
    return {
      ...c,
      online_fallback: c.online_fallback !== false,
      warnings_online: c.warnings_online !== false,
      show_attribution: c.show_attribution !== false,
      animations: c.animations !== false,
      language: c.language || 'auto',
      sensors: c.sensors || {},
      location: c.location || {},
    };
  }

  _valueChanged(ev) {
    ev.stopPropagation();
    const v = ev.detail.value || {};
    const next = this._clean({ ...this._config, ...v });
    // abgeschaltete Standard-Optionen explizit speichern
    ['online_fallback', 'warnings_online', 'show_attribution', 'animations'].forEach((k) => { if (v[k] === false) next[k] = false; });
    this._fire(next);
  }

  _designerChanged(ev) {
    ev.stopPropagation();
    const cfg = ev.detail && ev.detail.config;
    if (!cfg) return;
    this._fire({ ...cfg, type: this._config.type || cfg.type });
  }

  _renderMiniMap() {
    const els = this._config.elements || [];
    const cols = Number(this._config.columns) || FWC_DEFAULTS.columns;
    const rows = Math.max(1, FWC_LAYOUT.rows(els));
    if (!els.length) return html`<div class="mini empty"><ha-icon icon="mdi:view-grid-plus-outline"></ha-icon></div>`;
    return html`<div class="mini" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},minmax(5px,1fr));aspect-ratio:${cols}/${Math.max(rows * 0.9, 1)}">
      ${els.map(e => html`<div class="mini-el" title=${fwcT(this._lang)(`el.${e.type}`)} style="grid-column:${e.x + 1}/span ${e.w};grid-row:${e.y + 1}/span ${e.h}">
        ${e.h >= 2 && e.w >= 2 ? html`<ha-icon .icon=${(FWC_EL.TYPES[e.type] || {}).icon}></ha-icon>` : ''}</div>`)}
    </div>`;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const c = this._config;
    const els = c.elements || [];
    let info = '';
    if (!c.weather_entity) info = c.online_fallback === false ? this._e('info_offline') : this._e('info_online');
    return html`
      <div class="editor">
        <div class="designer-box">
          <div class="db-text">
            <div class="db-title"><ha-icon icon="mdi:view-dashboard-edit-outline"></ha-icon>${this._e('layout')}</div>
            <div class="db-hint">${this._e('designer_hint')}</div>
            <div class="db-meta">${els.length ? `${this._e('elements', { n: els.length })} · ${this._e('columns', { n: Number(c.columns) || FWC_DEFAULTS.columns })}` : this._e('no_layout')}</div>
            <button class="db-btn" @click=${() => { this._designerOpen = true; }}><ha-icon icon="mdi:drag-variant"></ha-icon>${this._e('open_designer')}</button>
          </div>
          ${this._renderMiniMap()}
        </div>

        <div class="section-title"><ha-icon icon="mdi:database-outline"></ha-icon>${this._e('sources')}</div>
        <ha-form .hass=${this.hass} .data=${this._formData()} .schema=${this._schema()} .computeLabel=${this._label} @value-changed=${this._valueChanged}></ha-form>
        ${info ? html`<div class="info"><ha-icon icon="mdi:information-outline"></ha-icon><span>${info}</span></div>` : ''}

        ${this._designerOpen ? html`<flexible-weather-card-designer .hass=${this.hass} .cardConfig=${this._config}
          @fwc-config-changed=${this._designerChanged} @designer-closed=${() => { this._designerOpen = false; }}></flexible-weather-card-designer>` : ''}

        <div class="version-footer">
          <a href="https://github.com/jayjojayson/flexible-weather-card" target="_blank" rel="noopener noreferrer">🌤️ Flexible Weather Card ${CARD_VERSION}</a>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .editor { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; }
      .designer-box {
        display: flex; gap: 16px; align-items: stretch; padding: 16px; border-radius: 16px;
        background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 16%, transparent), color-mix(in srgb, var(--primary-color) 4%, transparent));
        border: 1px solid color-mix(in srgb, var(--primary-color) 35%, transparent);
      }
      .db-text { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .db-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; }
      .db-title ha-icon { color: var(--primary-color); }
      .db-hint { font-size: 13px; color: var(--secondary-text-color); line-height: 1.4; }
      .db-meta { font-size: 12px; color: var(--secondary-text-color); }
      .db-btn {
        margin-top: 6px; align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer;
        background: var(--primary-color); color: var(--text-primary-color, #fff); font: inherit; font-weight: 600; font-size: 14px;
        padding: 10px 16px; border-radius: 12px; box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 40%, transparent); transition: transform .15s, box-shadow .15s;
      }
      .db-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color) 45%, transparent); }
      .mini { width: 120px; flex-shrink: 0; display: grid; gap: 3px; align-self: center; max-height: 170px; overflow: hidden; }
      .mini.empty { height: 90px; display: flex; align-items: center; justify-content: center; border: 2px dashed color-mix(in srgb, var(--primary-color) 40%, transparent); border-radius: 10px; color: var(--primary-color); }
      .mini.empty ha-icon { --mdc-icon-size: 34px; }
      .mini-el { background: color-mix(in srgb, var(--primary-color) 30%, var(--card-background-color, #fff)); border-radius: 3px; display: flex; align-items: center; justify-content: center; min-height: 5px; color: var(--primary-color); --mdc-icon-size: 12px; }
      .section-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
      .section-title ha-icon { color: var(--primary-color); --mdc-icon-size: 20px; }
      .info { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: var(--secondary-text-color); padding: 10px 12px; border-radius: 10px;
        background: color-mix(in srgb, var(--info-color, #039be5) 10%, transparent); }
      .info ha-icon { color: var(--info-color, #039be5); --mdc-icon-size: 18px; flex-shrink: 0; }
      .version-footer { text-align: center; margin-top: 8px; font-size: 12px; }
      .version-footer a { color: var(--secondary-text-color); text-decoration: none; }
      .version-footer a:hover { color: var(--primary-color); }
      @media (max-width: 450px) { .mini { display: none; } }
    `;
  }
}

if (!customElements.get('flexible-weather-card-editor')) customElements.define('flexible-weather-card-editor', FlexibleWeatherCardEditor);
