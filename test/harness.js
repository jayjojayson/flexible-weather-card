// Test-Harness: stellt die HA-Umgebung nach (ha-lit-element, ha-card, ha-icon, ha-form-Stubs, hass-Mock)
import { LitElement, html, css } from 'lit';
import * as mdi from '@mdi/js';

class HaLit extends LitElement {}
HaLit.prototype.html = html;
HaLit.prototype.css = css;
customElements.define('ha-lit-element', HaLit);

const mdiKey = (name) => 'mdi' + String(name || '').replace('mdi:', '').split('-').map(s => (s ? s[0].toUpperCase() + s.slice(1) : '')).join('');
class HaIcon extends LitElement {
  static properties = { icon: {} };
  static styles = css`:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);vertical-align:middle;flex-shrink:0} svg{width:100%;height:100%;fill:currentColor}`;
  render() { const p = mdi[mdiKey(this.icon)] || mdi.mdiHelpRhombus; return html`<svg viewBox="0 0 24 24"><path d=${p}></path></svg>`; }
}
customElements.define('ha-icon', HaIcon);
class HaStateIcon extends HaIcon {
  static properties = { stateObj: {}, hass: {} };
  render() { this.icon = (this.stateObj && this.stateObj.attributes.icon) || 'mdi:lightbulb'; return super.render(); }
}
customElements.define('ha-state-icon', HaStateIcon);
class HaCard extends LitElement {
  static styles = css`:host{display:block;background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px);border:1px solid var(--ha-card-border-color, var(--divider-color));color:var(--primary-text-color);font-family:Roboto,'Segoe UI',sans-serif}`;
  render() { return html`<slot></slot>`; }
}
customElements.define('ha-card', HaCard);

// Einfache Stubs für Editor-Komponenten
class HaSelector extends LitElement {
  static properties = { hass: {}, selector: {}, value: {}, label: {} };
  static styles = css`input{width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--divider-color);background:transparent;color:inherit;font:inherit}`;
  render() {
    const v = Array.isArray(this.value) ? this.value.join(', ') : (this.value || '');
    return html`<input .value=${v} placeholder=${this.selector && this.selector.entity ? 'entity…' : ''} @change=${(e) => {
      let val = e.target.value;
      if (this.selector && this.selector.entity && this.selector.entity.multiple) val = val.split(',').map(s => s.trim()).filter(Boolean);
      this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: val }, bubbles: true, composed: true }));
    }}>`;
  }
}
customElements.define('ha-selector', HaSelector);

class HaForm extends LitElement {
  static properties = { hass: {}, data: {}, schema: {}, computeLabel: {}, computeHelper: {} };
  static styles = css`:host{display:block} .f{display:flex;flex-direction:column;gap:6px;margin:6px 0} label{font-size:12px;opacity:.7} details{border:1px solid var(--divider-color);border-radius:8px;padding:6px 10px;margin:6px 0} summary{cursor:pointer;font-weight:500} input,select{padding:6px;border-radius:6px;border:1px solid var(--divider-color);background:transparent;color:inherit}`;
  _item(s, data, path) {
    const lbl = this.computeLabel ? this.computeLabel(s) : s.name;
    if (s.type === 'expandable' || s.type === 'grid') {
      const inner = s.name && !s.flatten ? (data[s.name] || {}) : data;
      const body = s.schema.map(c => this._item(c, inner, s.name && !s.flatten ? [...path, s.name] : path));
      return s.type === 'grid' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${body}</div>` : html`<details><summary>${s.title || lbl}</summary>${body}</details>`;
    }
    const v = data[s.name];
    const sel = s.selector || {};
    let input;
    if (sel.boolean !== undefined) input = html`<input type="checkbox" .checked=${!!v} @change=${e => this._set(path, s.name, e.target.checked)}>`;
    else if (sel.select) input = html`<select @change=${e => this._set(path, s.name, e.target.value)}>${sel.select.options.map(o => html`<option value=${o.value || o} ?selected=${(o.value || o) === v}>${o.label || o}</option>`)}</select>`;
    else input = html`<input .value=${v === undefined ? '' : (Array.isArray(v) ? v.join(',') : v)} @change=${e => this._set(path, s.name, sel.number ? Number(e.target.value) : e.target.value)}>`;
    return html`<div class="f"><label>${lbl}</label>${input}</div>`;
  }
  _set(path, key, val) {
    const data = JSON.parse(JSON.stringify(this.data || {}));
    let o = data; path.forEach(p => { o[p] = o[p] || {}; o = o[p]; }); o[key] = val;
    this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: data }, bubbles: true, composed: true }));
  }
  render() { return html`${(this.schema || []).map(s => this._item(s, this.data || {}, []))}`; }
}
customElements.define('ha-form', HaForm);
customElements.define('ha-yaml-editor', class extends LitElement {
  static properties = { defaultValue: {}, hass: {} };
  render() { return html`<textarea style="width:100%;min-height:80px" .value=${JSON.stringify(this.defaultValue || {}, null, 1)} @change=${(e) => { try { this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: JSON.parse(e.target.value), isValid: true }, bubbles: true, composed: true })); } catch (er) { /* */ } }}></textarea>`; }
});

/* --- hass-Mock --------------------------------------------------------------------------------- */
const H = 3600e3;
const base = Math.floor(Date.now() / H) * H;
const conds = ['partlycloudy', 'cloudy', 'rainy', 'rainy', 'cloudy', 'partlycloudy', 'sunny', 'sunny'];
const hourly = Array.from({ length: 48 }, (_, i) => {
  const t = new Date(base + i * H);
  const hr = t.getHours();
  const temp = (globalThis.FWC_TEMP_OFFSET || 0) + 8 + 5 * Math.sin(((hr - 9) / 24) * 2 * Math.PI) + (i > 24 ? -1.5 : 0) + Math.sin(i / 3) * 0.6;
  const rain = i >= 5 && i <= 10 ? [0.2, 0.8, 1.6, 2.4, 1.1, 0.3][i - 5] : 0;
  return {
    datetime: t.toISOString(), condition: rain > 1 ? 'pouring' : rain > 0 ? 'rainy' : (hr > 7 && hr < 17 ? (i % 5 === 0 ? 'cloudy' : 'partlycloudy') : 'clear-night'),
    temperature: Math.round(temp * 10) / 10, wind_speed: Math.round(8 + 10 * Math.abs(Math.sin(i / 5))), wind_bearing: (200 + i * 7) % 360, humidity: Math.round(70 + 15 * Math.sin(i / 4)), pressure: Math.round((1015 - i * 0.35 + 1.2 * Math.sin(i / 3)) * 10) / 10, precipitation: rain, precipitation_probability: rain ? 40 + rain * 20 : (i % 7) * 3,
  };
});
const d0 = new Date(); d0.setHours(12, 0, 0, 0);
const daily = Array.from({ length: 7 }, (_, i) => ({
  datetime: new Date(d0.getTime() + i * 24 * H).toISOString(), condition: conds[i],
  temperature: [13, 11, 9, 8, 10, 14, 15][i], templow: [4, 6, 5, 2, -1, 3, 6][i],
  precipitation: [3.2, 1.0, 6.4, 2.2, 0, 0, 0.4][i], precipitation_probability: [70, 40, 90, 60, 5, 0, 20][i], uv_index: [2, 1, 1, 2, 3, 3, 2][i], wind_speed: [18, 25, 41, 12, 6, 15, 30][i], wind_bearing: [250, 270, 300, 180, 90, 220, 240][i],
}));

window.fwcMockHass = (opts = {}) => {
  const states = {
    'weather.home': {
      entity_id: 'weather.home', state: opts.condition || 'partlycloudy',
      attributes: {
        temperature: 11.4, apparent_temperature: 9.2, dew_point: 5.6, humidity: 68, pressure: 1016.3, wind_speed: 18.4, wind_gust_speed: 34.2,
        wind_bearing: 236, visibility: opts.visibility ?? 14.5, uv_index: 2.4, cloud_coverage: 55, temperature_unit: '°C', pressure_unit: 'hPa',
        wind_speed_unit: 'km/h', visibility_unit: 'km', precipitation_unit: 'mm', supported_features: 3, friendly_name: 'Zuhause',
      },
    },
    'sensor.moon_phase': { entity_id: 'sensor.moon_phase', state: 'waxing_gibbous', attributes: { friendly_name: 'Mond' } },
    'sensor.berlin_aktuelle_warnstufe': {
      entity_id: 'sensor.berlin_aktuelle_warnstufe', state: '2',
      attributes: opts.noWarnings ? { region_name: 'Berlin', warning_count: 0 } : {
        region_name: 'Berlin', region_id: 111000000, warning_count: 2,
        warning_1_name: 'STURMBÖEN', warning_1_level: 2, warning_1_headline: 'Amtliche WARNUNG vor STURMBÖEN', warning_1_color: '#fb8c00',
        warning_1_description: 'Es treten Sturmböen mit Geschwindigkeiten um 70 km/h aus südwestlicher Richtung auf.',
        warning_1_instruction: 'Achten Sie besonders auf herabstürzende Äste, Dachziegel oder Gegenstände.',
        warning_1_start: new Date(base + 2 * H).toISOString(), warning_1_end: new Date(base + 14 * H).toISOString(),
        warning_2_name: 'FROST', warning_2_level: 1, warning_2_headline: 'Amtliche WARNUNG vor FROST', warning_2_color: '#ffeb3b',
        warning_2_description: 'Es tritt leichter Frost um -2 °C auf.', warning_2_start: new Date(base + 20 * H).toISOString(), warning_2_end: new Date(base + 30 * H).toISOString(),
      },
    },
    'sensor.fuerstenwalde_spree_wetterbericht': { entity_id: 'sensor.fuerstenwalde_spree_wetterbericht', state: 'Wetter', attributes: {
      data: window.FWC_REPORT, station_name: 'Fuerstenwalde/Spree', friendly_name: 'Fuerstenwalde/Spree Wetterbericht' } },
    'light.wohnzimmer': { entity_id: 'light.wohnzimmer', state: 'on', attributes: { friendly_name: 'Wohnzimmer', icon: 'mdi:sofa-outline' } },
    'sensor.t_min': { entity_id: 'sensor.t_min', state: '-0.2', attributes: { friendly_name: 'Min', unit_of_measurement: '°C', device_class: 'temperature' } },
    'sensor.t_max': { entity_id: 'sensor.t_max', state: '0.4', attributes: { friendly_name: 'Max', unit_of_measurement: '°C', device_class: 'temperature' } },
    'sensor.balkon_feuchte': { entity_id: 'sensor.balkon_feuchte', state: '92', attributes: { friendly_name: 'Balkon Feuchte', unit_of_measurement: '%', device_class: 'humidity' } },
    'sensor.balkon_temperatur': { entity_id: 'sensor.balkon_temperatur', state: '10.8', attributes: { friendly_name: 'Balkon', unit_of_measurement: '°C', device_class: 'temperature' } },
  };
  if (opts.sunEl !== undefined) states['sun.sun'] = { entity_id: 'sun.sun', state: opts.sunEl > 0 ? 'above_horizon' : 'below_horizon', attributes: { elevation: opts.sunEl, azimuth: opts.sunEl > 0 ? 180 : 330 } };
  if (opts.windSpeed !== undefined) states['weather.home'].attributes.wind_speed = opts.windSpeed;
  if (opts.bearing !== undefined) states['weather.home'].attributes.wind_bearing = opts.bearing;
  if (opts.temp !== undefined) states['weather.home'].attributes.temperature = opts.temp;
  if (opts.clouds !== undefined) states['weather.home'].attributes.cloud_coverage = opts.clouds;
  if (opts.noWeather) delete states['weather.home'];
  if (opts.noDwd) delete states['sensor.berlin_aktuelle_warnstufe'];
  return {
    states,
    config: { latitude: 52.52, longitude: 13.405, location_name: 'Berlin', time_zone: 'Europe/Berlin',
      unit_system: { temperature: '°C', pressure: 'hPa', wind_speed: 'km/h', length: 'km', accumulated_precipitation: 'mm' } },
    locale: { language: opts.lang || 'de', number_format: 'language', time_format: 'language', time_zone: 'local' },
    language: opts.lang || 'de',
    themes: { darkMode: !opts.light },
    localize: () => '',
    formatEntityState: (s) => `${s.state === 'on' ? 'An' : s.state}${s.attributes.unit_of_measurement ? ` ${s.attributes.unit_of_measurement}` : ''}`,
    callService: (...a) => console.log('callService', ...a),
    connection: {
      subscribeMessage: (cb, msg) => {
        setTimeout(() => cb({ forecast: msg.forecast_type === 'hourly' ? hourly : daily }), 20);
        return Promise.resolve(() => {});
      },
    },
  };
};

// Fake Open-Meteo-Antwort (für den Online-Test ohne Netz)
window.fwcFakeFetch = () => {
  const realFetch = window.fetch;
  window.fetch = async (url) => {
    if (String(url).includes('api.open-meteo.com/v1/forecast')) {
      const t0 = Math.floor(Date.now() / 1000 / 3600) * 3600;
      const body = {
        current: { shortwave_radiation: 214, temperature_2m: 7.9, relative_humidity_2m: 81, apparent_temperature: 5.2, dew_point_2m: 4.8, is_day: 1, precipitation: 0.3, weather_code: 61,
          cloud_cover: 90, pressure_msl: 1003.2, wind_speed_10m: 26, wind_direction_10m: 250, wind_gusts_10m: 52, visibility: 6400, uv_index: 0.8 },
        hourly: {
          time: Array.from({ length: 48 }, (_, i) => t0 + i * 3600),
          temperature_2m: Array.from({ length: 48 }, (_, i) => 7 + 3 * Math.sin(i / 4)),
          precipitation_probability: Array.from({ length: 48 }, (_, i) => (i * 13) % 100),
          precipitation: Array.from({ length: 48 }, (_, i) => (i % 6 === 0 ? 0.6 : 0)),
          relative_humidity_2m: Array.from({ length: 48 }, (_, i) => 70 + 15 * Math.sin(i / 5)),
          shortwave_radiation: Array.from({ length: 48 }, (_, i) => { const h = new Date((t0 + i * 3600) * 1000).getHours(); return h > 7 && h < 17 ? Math.round(380 * Math.sin((h - 7) / 10 * Math.PI)) : 0; }),
          weather_code: Array.from({ length: 48 }, (_, i) => [61, 3, 2, 1, 0, 80][i % 6]),
          wind_speed_10m: Array(48).fill(20), wind_direction_10m: Array(48).fill(250), is_day: Array.from({ length: 48 }, (_, i) => (i % 24 < 10 ? 1 : 0)), uv_index: Array(48).fill(1),
        },
        daily: {
          time: Array.from({ length: 8 }, (_, i) => t0 - (t0 % 86400) + i * 86400),
          weather_code: [61, 3, 2, 0, 95, 71, 45, 1], temperature_2m_max: [9, 10, 12, 13, 15, 3, 6, 8], temperature_2m_min: [4, 5, 6, 3, 8, -2, 1, 2],
          sunrise: Array.from({ length: 8 }, (_, i) => t0 - (t0 % 86400) + i * 86400 + 6 * 3600), sunset: Array.from({ length: 8 }, (_, i) => t0 - (t0 % 86400) + i * 86400 + 16 * 3600),
          precipitation_sum: [4, 0.2, 0, 0, 12, 3, 0, 0], precipitation_probability_max: [90, 20, 5, 0, 80, 60, 10, 0], uv_index_max: [1, 2, 2, 3, 2, 1, 1, 2],
          wind_speed_10m_max: [30, 20, 15, 10, 45, 20, 10, 12], wind_direction_10m_dominant: [250, 240, 200, 180, 270, 0, 90, 120],
          shortwave_radiation_sum: [4.1, 6.2, 3.3, 7.5, 2.1, 5.5, 6.0, 4.4],
        },
      };
      return new Response(JSON.stringify(body), { status: 200 });
    }
    if (String(url).includes('air-quality')) {
      const t0 = Math.floor(Date.now() / 1000 / 3600) * 3600;
      const arr = (v) => Array.from({ length: 48 }, (_, i) => v * (1 + Math.sin(i / 4)) / 2);
      return new Response(JSON.stringify({ current: { alder_pollen: 0, birch_pollen: 14, grass_pollen: 42, mugwort_pollen: 3, olive_pollen: 0, ragweed_pollen: 0 },
        hourly: { time: Array.from({ length: 48 }, (_, i) => t0 + i * 3600), alder_pollen: arr(0), birch_pollen: arr(30), grass_pollen: arr(60), mugwort_pollen: arr(4), olive_pollen: arr(0), ragweed_pollen: arr(0) } }), { status: 200 });
    }
    if (String(url).includes('rainviewer')) {
      const t = Math.floor(Date.now() / 600000) * 600;
      return new Response(JSON.stringify({ host: 'https://tilecache.rainviewer.com', radar: { past: Array.from({ length: 13 }, (_, i) => ({ time: t - (12 - i) * 600, path: `/v2/radar/abc${i}` })) } }), { status: 200 });
    }
    if (String(url).includes('brightsky')) {
      return new Response(JSON.stringify({ location: { name: 'Berlin' }, alerts: [{ severity: 'severe', event_de: 'GEWITTER', headline_de: 'Amtliche UNWETTERWARNUNG vor SCHWEREM GEWITTER', description_de: 'Schwere Gewitter mit Hagel.', onset: new Date().toISOString(), expires: new Date(Date.now() + 5 * 3600e3).toISOString() }] }), { status: 200 });
    }
    return realFetch(url);
  };
};
