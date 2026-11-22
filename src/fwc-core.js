/*
 * Flexible Weather Card - CORE
 * Dateiname: fwc-core.js
 * Gemeinsame Basis für Card, Editor und Designer:
 * Übersetzungen, Formatierung, Einheiten, Astronomie, Online-Daten (Open-Meteo / Bright Sky),
 * Datenmodell und Layout-Logik (Raster mit x / y / w / h).
 */

const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const CARD_VERSION = "v_2.2";

const fireEvent = (node, type, detail, options = {}) => {
  const ev = new Event(type, {
    bubbles: options.bubbles !== false,
    cancelable: !!options.cancelable,
    composed: options.composed !== false,
  });
  ev.detail = detail === undefined || detail === null ? {} : detail;
  node.dispatchEvent(ev);
  return ev;
};

/* ------------------------------------------------------------------------------------------------
 * Übersetzungen (de / en). Fehlende Sprachen fallen auf Englisch zurück.
 * ---------------------------------------------------------------------------------------------- */
const FWC_I18N = {
  de: {
    cond: {
      'clear-night': 'Klare Nacht', cloudy: 'Bewölkt', fog: 'Nebel', hail: 'Hagel', lightning: 'Gewitter',
      'lightning-rainy': 'Gewitter mit Regen', partlycloudy: 'Teilweise bewölkt', pouring: 'Starkregen', rainy: 'Regen',
      snowy: 'Schnee', 'snowy-rainy': 'Schneeregen', sunny: 'Sonnig', windy: 'Windig', 'windy-variant': 'Windig & bewölkt',
      exceptional: 'Unwetter',
    },
    el: {
      header: 'Titel & Datum', current: 'Aktuelles Wetter', temperature: 'Temperatur', minmax: 'Min / Max heute',
      humidity: 'Luftfeuchte', pressure: 'Luftdruck', wind: 'Wind', visibility: 'Sichtweite', precipitation: 'Niederschlag',
      uv: 'UV-Index', sun: 'Sonnenstand 3D', sun_times: 'Sonnenauf- & -untergang', moon: 'Mond', forecast_daily: 'Tagesvorhersage',
      forecast_hourly: 'Stundenvorhersage', chart: 'Temp.- & Luftfeuchteverlauf', warnings: 'Wetterwarnungen', value: 'Messwert',
      sensor: 'Entität', image: 'Bild / iFrame', card: 'HA-Karte', solar: 'Solarstrahlung', pollen: 'Pollenflug', report: 'Wetterbericht',
      radar: 'Regenradar', weather3d: '3D Wetter', earth: '3D Erde',
    },
    eldesc: {
      header: 'Überschrift mit Datum und Uhrzeit', current: 'Symbol, Zustand, Temperatur, gefühlt, Min/Max',
      temperature: 'Große Temperatur mit Farbskala', minmax: 'Tagesspanne mit aktueller Temperatur',
      humidity: 'Ring-Anzeige mit Taupunkt', pressure: 'Barometer mit Wetterlage', wind: 'Kompass, Böen, Beaufort',
      visibility: 'Landschaft, die im Dunst verschwindet', precipitation: 'Regenmesser und die nächsten Stunden',
      uv: 'UV-Skala mit Schutzhinweis', sun: '3D-Kuppel mit Sonnen- und Mondbahn', sun_times: 'Tagbogen mit Tageslänge',
      moon: 'Mondphase, Beleuchtung, Auf-/Untergang', forecast_daily: 'Mehrere Tage als Liste oder Spalten',
      forecast_hourly: 'Die nächsten Stunden', chart: 'Kurven mit Niederschlagsbalken', warnings: 'DWD, Meteoalarm oder online',
      value: 'Einzelner Wert, frei wählbar', sensor: 'Beliebige HA-Entität, schaltbar', image: 'Bild, GIF oder iFrame',
      card: 'Beliebige Lovelace-Karte einbetten', solar: 'Globalstrahlung in W/m² mit Tageskurve', pollen: 'Belastung je Pollenart',
      report: 'Wetterbericht als Text (DWD oder automatisch)', radar: 'Animiertes Regenradar (online)', weather3d: 'Animiertes 3D-Diorama mit allen Werten', earth: 'Erdkugel mit Satellitenwolken, Tag/Nacht und Radar (online)',
    },
    group: { current: 'Aktuell', measure: 'Messwerte', astro: 'Sonne & Mond', forecast: 'Vorhersage', other: 'Sonstiges' },
    metric: {
      temperature: 'Temperatur', apparent_temperature: 'Gefühlt', dew_point: 'Taupunkt', humidity: 'Luftfeuchte',
      pressure: 'Luftdruck', wind_speed: 'Wind', wind_gust: 'Böen', wind_bearing: 'Windrichtung', visibility: 'Sichtweite',
      uv_index: 'UV-Index', cloud_coverage: 'Bewölkung', precipitation: 'Niederschlag', precipitation_probability: 'Regenrisiko',
      ozone: 'Ozon', solar_radiation: 'Solarstrahlung',
    },
    solar: ['Keine', 'Gering', 'Mäßig', 'Hoch', 'Sehr hoch'],
    pollen_type: { alder: 'Erle', birch: 'Birke', grass: 'Gräser', mugwort: 'Beifuß', olive: 'Olive', ragweed: 'Ambrosia', hazel: 'Hasel', ash: 'Esche', rye: 'Roggen' },
    pollen_level: ['Keine', 'Gering', 'Mittel', 'Hoch', 'Sehr hoch'],
    weekday_names: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    w: {
      feels_like: 'Gefühlt', clouds: 'Bewölkung', dew_point: 'Taupunkt', gust: 'Böen', today: 'Heute', tomorrow: 'Morgen', now: 'Jetzt',
      remaining: 'noch', illuminated: 'beleuchtet', full_in: 'Vollmond in {n} T.', new_in: 'Neumond in {n} T.', full_today: 'Vollmond heute', new_today: 'Neumond heute',
      no_warnings: 'Keine Warnungen', no_data: 'Keine Daten', loading: 'Lade Daten …', next_hours: 'Nächste {n} Std.',
      today_sum: 'Heute', advance: 'Vorabinfo', until: 'bis', from: 'ab', max_today: 'Max. heute',
      beaufort: 'Bft', not_found: 'Nicht gefunden', data_by: 'Daten', warnings_by: 'Warnungen', instructions: 'Hinweise', elevation: 'Höhe', azimuth: 'Azimut',
      select_entity: 'Bitte Entität wählen', empty_card: 'Noch keine Elemente – öffne den Layout-Designer im Karten-Editor.',
      no_url: 'Bitte URL eintragen', no_card: 'Bitte Karten-Konfiguration eintragen',
      temp: 'Temperatur', hum: 'Luftfeuchte', day_sum: 'Tagessumme', no_pollen: 'Kein Pollenflug', pollen_eu: 'Pollendaten online nur für Europa',
      day_after: 'Übermorgen', all_days: 'Alle', report_auto: 'Automatisch erstellt aus der Vorhersage',
      r_temp: '{lo} bis {hi} °', r_rain: 'Regenrisiko {p} %', r_rain_mm: '{mm} mm', r_wind: 'Wind aus {d} mit {v}', r_now: 'Aktuell {t}, {c}.',
      radar_loading: 'Radar wird geladen …', radar_none: 'Radar nicht erreichbar', earth_loading: 'Satellitenbild wird geladen …', earth_error: 'Satellitenbild nicht erreichbar', lowest: 'Tiefstwert', highest: 'Höchstwert',
    },
    humidity: ['Sehr trocken', 'Trocken', 'Angenehm', 'Feucht', 'Sehr feucht'],
    pressure: ['Sturm', 'Regen', 'Wechselhaft', 'Schön', 'Sehr trocken'],
    visibility: ['Dichter Nebel', 'Nebel', 'Dunst', 'Mäßig', 'Gut', 'Sehr gut', 'Ausgezeichnet'],
    uv: ['Niedrig', 'Mäßig', 'Hoch', 'Sehr hoch', 'Extrem'],
    uv_hint: ['Kein Schutz nötig', 'Sonnenschutz empfohlen', 'Schutz erforderlich', 'Mittags Schatten suchen', 'Draußen möglichst meiden'],
    beaufort: ['Windstille', 'Leiser Zug', 'Leichte Brise', 'Schwache Brise', 'Mäßige Brise', 'Frische Brise', 'Starker Wind',
      'Steifer Wind', 'Stürmischer Wind', 'Sturm', 'Schwerer Sturm', 'Orkanartiger Sturm', 'Orkan'],
    compass: ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
    moon: {
      new_moon: 'Neumond', waxing_crescent: 'Zunehmende Sichel', first_quarter: 'Erstes Viertel', waxing_gibbous: 'Zunehmender Mond',
      full_moon: 'Vollmond', waning_gibbous: 'Abnehmender Mond', last_quarter: 'Letztes Viertel', waning_crescent: 'Abnehmende Sichel',
    },
    warn_level: ['Keine', 'Wetterwarnung', 'Markantes Wetter', 'Unwetter', 'Extremes Unwetter'],
  },
  en: {
    cond: {
      'clear-night': 'Clear night', cloudy: 'Cloudy', fog: 'Fog', hail: 'Hail', lightning: 'Thunderstorm',
      'lightning-rainy': 'Thunderstorm & rain', partlycloudy: 'Partly cloudy', pouring: 'Heavy rain', rainy: 'Rain',
      snowy: 'Snow', 'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy & cloudy',
      exceptional: 'Severe weather',
    },
    el: {
      header: 'Title & date', current: 'Current weather', temperature: 'Temperature', minmax: 'Min / max today',
      humidity: 'Humidity', pressure: 'Air pressure', wind: 'Wind', visibility: 'Visibility', precipitation: 'Precipitation',
      uv: 'UV index', sun: 'Sun position 3D', sun_times: 'Sunrise & sunset', moon: 'Moon', forecast_daily: 'Daily forecast',
      forecast_hourly: 'Hourly forecast', chart: 'Temperature & humidity trend', warnings: 'Weather warnings', value: 'Value',
      sensor: 'Entity', image: 'Image / iFrame', card: 'HA card', solar: 'Solar radiation', pollen: 'Pollen', report: 'Weather report',
      radar: 'Rain radar', weather3d: '3D weather', earth: '3D earth',
    },
    eldesc: {
      header: 'Heading with date and time', current: 'Icon, condition, temperature, feels like, min/max',
      temperature: 'Large temperature with color scale', minmax: 'Day range with current temperature',
      humidity: 'Ring gauge with dew point', pressure: 'Barometer with weather tendency', wind: 'Compass, gusts, Beaufort',
      visibility: 'Landscape fading into the haze', precipitation: 'Rain gauge and the next hours',
      uv: 'UV scale with protection hint', sun: '3D dome with sun and moon path', sun_times: 'Day arc with day length',
      moon: 'Moon phase, illumination, rise/set', forecast_daily: 'Several days as list or columns',
      forecast_hourly: 'The next hours', chart: 'Curves with precipitation bars', warnings: 'DWD, Meteoalarm or online',
      value: 'Single value of your choice', sensor: 'Any HA entity, toggleable', image: 'Image, GIF or iFrame',
      card: 'Embed any Lovelace card', solar: 'Global radiation in W/m² with day curve', pollen: 'Load per pollen type',
      report: 'Weather report as text (DWD or automatic)', radar: 'Animated rain radar (online)', weather3d: 'Animated 3D diorama with all values', earth: 'Globe with satellite clouds, day/night and radar (online)',
    },
    group: { current: 'Current', measure: 'Measurements', astro: 'Sun & moon', forecast: 'Forecast', other: 'Other' },
    metric: {
      temperature: 'Temperature', apparent_temperature: 'Feels like', dew_point: 'Dew point', humidity: 'Humidity',
      pressure: 'Pressure', wind_speed: 'Wind', wind_gust: 'Gusts', wind_bearing: 'Wind direction', visibility: 'Visibility',
      uv_index: 'UV index', cloud_coverage: 'Cloud cover', precipitation: 'Precipitation', precipitation_probability: 'Chance of rain',
      ozone: 'Ozone', solar_radiation: 'Solar radiation',
    },
    solar: ['None', 'Low', 'Moderate', 'High', 'Very high'],
    pollen_type: { alder: 'Alder', birch: 'Birch', grass: 'Grass', mugwort: 'Mugwort', olive: 'Olive', ragweed: 'Ragweed', hazel: 'Hazel', ash: 'Ash', rye: 'Rye' },
    pollen_level: ['None', 'Low', 'Moderate', 'High', 'Very high'],
    weekday_names: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    w: {
      feels_like: 'Feels like', clouds: 'Cloud cover', dew_point: 'Dew point', gust: 'Gusts', today: 'Today', tomorrow: 'Tomorrow', now: 'Now',
      remaining: 'left', illuminated: 'illuminated', full_in: 'Full moon in {n} d', new_in: 'New moon in {n} d', full_today: 'Full moon today', new_today: 'New moon today',
      no_warnings: 'No warnings', no_data: 'No data', loading: 'Loading …', next_hours: 'Next {n} h',
      today_sum: 'Today', advance: 'Advance', until: 'until', from: 'from', max_today: 'Max today',
      beaufort: 'Bft', not_found: 'Not found', data_by: 'Data', warnings_by: 'Warnings', instructions: 'Instructions', elevation: 'Elevation', azimuth: 'Azimuth',
      select_entity: 'Please select an entity', empty_card: 'No elements yet – open the layout designer in the card editor.',
      no_url: 'Please enter a URL', no_card: 'Please enter a card configuration',
      temp: 'Temperature', hum: 'Humidity', day_sum: 'Day total', no_pollen: 'No pollen', pollen_eu: 'Online pollen data for Europe only',
      day_after: 'Day after', all_days: 'All', report_auto: 'Generated automatically from the forecast',
      r_temp: '{lo} to {hi} °', r_rain: 'chance of rain {p} %', r_rain_mm: '{mm} mm', r_wind: 'wind from {d} at {v}', r_now: 'Currently {t}, {c}.',
      radar_loading: 'Loading radar …', radar_none: 'Radar not reachable', earth_loading: 'Loading satellite image …', earth_error: 'Satellite image not reachable', lowest: 'Low', highest: 'High',
    },
    humidity: ['Very dry', 'Dry', 'Comfortable', 'Humid', 'Very humid'],
    pressure: ['Stormy', 'Rain', 'Change', 'Fair', 'Very dry'],
    visibility: ['Dense fog', 'Fog', 'Haze', 'Moderate', 'Good', 'Very good', 'Excellent'],
    uv: ['Low', 'Moderate', 'High', 'Very high', 'Extreme'],
    uv_hint: ['No protection needed', 'Sun protection advised', 'Protection required', 'Seek shade at midday', 'Avoid being outside'],
    beaufort: ['Calm', 'Light air', 'Light breeze', 'Gentle breeze', 'Moderate breeze', 'Fresh breeze', 'Strong breeze',
      'Near gale', 'Gale', 'Strong gale', 'Storm', 'Violent storm', 'Hurricane'],
    compass: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
    moon: {
      new_moon: 'New moon', waxing_crescent: 'Waxing crescent', first_quarter: 'First quarter', waxing_gibbous: 'Waxing gibbous',
      full_moon: 'Full moon', waning_gibbous: 'Waning gibbous', last_quarter: 'Last quarter', waning_crescent: 'Waning crescent',
    },
    warn_level: ['None', 'Weather warning', 'Notable weather', 'Severe weather', 'Extreme weather'],
  },
};

const fwcLang = (hass, config) => {
  const raw = (config && config.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || 'en';
  const code = String(raw).split('-')[0].toLowerCase();
  return FWC_I18N[code] ? code : 'en';
};

// t('w.feels_like'), t('cond.sunny'), t('w.next_hours', { n: 12 })
const fwcT = (lang) => (key, vars) => {
  const dig = (dict) => key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
  let v = dig(FWC_I18N[lang]);
  if (v === undefined) v = dig(FWC_I18N.en);
  if (v === undefined) return key;
  if (vars && typeof v === 'string') Object.keys(vars).forEach(k => { v = v.replace(`{${k}}`, vars[k]); });
  return v;
};

/* ------------------------------------------------------------------------------------------------
 * Kleine Helfer
 * ---------------------------------------------------------------------------------------------- */
const FWC_U = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const toNum = (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  };
  const esc = (s) => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n1 = (v) => (Math.round(v * 10) / 10).toString();
  const n2 = (v) => (Math.round(v * 100) / 100).toString();
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Farbe als [r,g,b] aus #rrggbb
  const hex = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
    if (!m) return [128, 128, 128];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgb = (c) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
  // Farbskala aus [[wert, '#hex'], ...]
  const scale = (stops, v) => {
    if (!isNum(v)) return 'var(--secondary-text-color)';
    if (v <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (v <= stops[i][0]) {
        const [a, ca] = stops[i - 1];
        const [b, cb] = stops[i];
        const t = (v - a) / (b - a);
        const x = hex(ca), y = hex(cb);
        return rgb([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]);
      }
    }
    return stops[stops.length - 1][1];
  };

  // Temperaturfarben in °C
  // Temperaturfarben: im Bereich um 0 °C bewusst feiner gestuft (blau → cyan → türkis → grün), damit schon wenige Grad sichtbar sind
  const TEMP_STOPS = [[-20, '#8e24aa'], [-12, '#5e35b1'], [-6, '#3949ab'], [-2, '#1e88e5'], [0, '#039be5'], [2, '#00acc1'], [4, '#00897b'],
    [6, '#26a69a'], [9, '#43a047'], [13, '#7cb342'], [17, '#c0ca33'], [21, '#fdd835'], [25, '#ffb300'], [28, '#fb8c00'], [31, '#f4511e'], [35, '#e53935'], [40, '#b71c1c']];
  const tempColor = (c) => scale(TEMP_STOPS, c);
  const UV_STOPS = [[0, '#4caf50'], [2.5, '#8bc34a'], [3, '#fdd835'], [5.5, '#fbc02d'], [6, '#fb8c00'], [7.5, '#f57c00'], [8, '#e53935'], [10.5, '#c62828'], [11, '#8e24aa']];
  const uvColor = (v) => scale(UV_STOPS, v);
  // Beaufort-Farben
  // Windfarbe (m/s): grün = schwacher Wind, gelb = frisch, orange = stark/stürmisch, rot = Sturm, violett = Orkan
  const WIND_STOPS = [[0, '#81c784'], [3.4, '#4caf50'], [5.5, '#7cb342'], [8, '#c0ca33'], [10.8, '#fdd835'], [13.9, '#ffb300'],
    [17.2, '#fb8c00'], [20.8, '#f4511e'], [24.5, '#e53935'], [28.5, '#c62828'], [32.7, '#8e24aa']];
  const windColor = (ms) => scale(WIND_STOPS, ms);
  const BFT_COLORS = ['#90a4ae', '#80cbc4', '#4db6ac', '#26a69a', '#66bb6a', '#9ccc65', '#d4e157', '#ffca28', '#ffa726', '#ff7043', '#f4511e', '#e53935', '#b71c1c'];

  /* --- Einheiten ----------------------------------------------------------------------------- */
  const toC = (v, u) => (/F/i.test(u || '') ? (v - 32) * 5 / 9 : v);
  const fromC = (v, u) => (/F/i.test(u || '') ? v * 9 / 5 + 32 : v);
  const WIND_TO_MS = { 'm/s': 1, 'km/h': 1 / 3.6, 'mph': 0.44704, 'kn': 0.514444, 'kt': 0.514444, 'ft/s': 0.3048, 'bft': null };
  const windToMs = (v, u) => {
    const k = WIND_TO_MS[String(u || 'km/h').toLowerCase()];
    return k === undefined || k === null ? v / 3.6 : v * k;
  };
  const msToBft = (ms) => {
    const lim = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
    let b = 0;
    while (b < 12 && ms >= lim[b]) b++;
    return b;
  };
  const PRESS_TO_HPA = { hpa: 1, mbar: 1, pa: 0.01, kpa: 10, inhg: 33.8639, mmhg: 1.33322, psi: 68.9476, cbar: 10, bar: 1000 };
  const pressToHpa = (v, u) => v * (PRESS_TO_HPA[String(u || 'hPa').toLowerCase()] || 1);
  const hpaTo = (v, u) => v / (PRESS_TO_HPA[String(u || 'hPa').toLowerCase()] || 1);
  const LEN_TO_KM = { km: 1, m: 0.001, mi: 1.609344, ft: 0.0003048, yd: 0.0009144, nmi: 1.852 };
  const lenToKm = (v, u) => v * (LEN_TO_KM[String(u || 'km').toLowerCase()] || 1);
  const kmTo = (v, u) => v / (LEN_TO_KM[String(u || 'km').toLowerCase()] || 1);
  const precToMm = (v, u) => (/in/i.test(u || '') ? v * 25.4 : (/cm/i.test(u || '') ? v * 10 : v));

  // Windrichtung: Zahl (°) oder Text (N, NNO, SW, ...) -> Grad
  const COMPASS_EN = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const COMPASS_DE = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const bearing = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = toNum(v);
    if (n !== null) return ((n % 360) + 360) % 360;
    const s = String(v).trim().toUpperCase();
    let i = COMPASS_EN.indexOf(s);
    if (i < 0) i = COMPASS_DE.indexOf(s);
    return i < 0 ? null : i * 22.5;
  };

  // Glatte Kurve durch Punkte (Catmull-Rom -> kubische Bézier), Punkte als [x, y]
  const smoothPath = (pts, tension = 0.5) => {
    if (!pts.length) return '';
    if (pts.length < 3) return `M ${pts.map(p => `${n2(p[0])} ${n2(p[1])}`).join(' L ')}`;
    let d = `M ${n2(pts[0][0])} ${n2(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension * 2, p1[1] + (p2[1] - p0[1]) / 6 * tension * 2];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension * 2, p2[1] - (p3[1] - p1[1]) / 6 * tension * 2];
      d += ` C ${n2(c1[0])} ${n2(c1[1])} ${n2(c2[0])} ${n2(c2[1])} ${n2(p2[0])} ${n2(p2[1])}`;
    }
    return d;
  };

  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  return {
    clamp, lerp, isNum, toNum, esc, n1, n2, uid, hex, rgb, scale, tempColor, uvColor, windColor, BFT_COLORS,
    toC, fromC, windToMs, msToBft, pressToHpa, hpaTo, lenToKm, kmTo, precToMm, bearing, smoothPath, sameDay, toDate,
  };
})();

/* ------------------------------------------------------------------------------------------------
 * Formatierung nach den HA-Profil-Einstellungen (Zahlen, Uhrzeit, Zeitzone)
 * ---------------------------------------------------------------------------------------------- */
const fwcFormatters = (hass, lang) => {
  const loc = (hass && hass.locale) || {};
  const language = loc.language || (hass && hass.language) || lang || 'en';
  const NUM_LOCALE = { comma_decimal: 'en-US', decimal_comma: 'de-DE', space_comma: 'fr-FR', system: undefined };
  const numLocale = loc.number_format && loc.number_format in NUM_LOCALE ? NUM_LOCALE[loc.number_format] : language;
  const timeZone = loc.time_zone === 'server' && hass && hass.config && hass.config.time_zone ? hass.config.time_zone : undefined;
  const hour12 = loc.time_format === '12' ? true : (loc.time_format === '24' ? false : undefined);
  const nfCache = {};
  const num = (v, digits = 1, minDigits = 0, grouping = true) => {
    if (!FWC_U.isNum(v)) return '–';
    if (loc.number_format === 'none') return String(Math.round(v * 10 ** digits) / 10 ** digits);
    const k = `${digits}|${minDigits}|${grouping}`;
    if (!nfCache[k]) {
      try {
        nfCache[k] = new Intl.NumberFormat(numLocale, { maximumFractionDigits: digits, minimumFractionDigits: Math.min(minDigits, digits), useGrouping: grouping });
      } catch (e) {
        nfCache[k] = new Intl.NumberFormat('en', { maximumFractionDigits: digits });
      }
    }
    const out = nfCache[k].format(v);
    return out === '-0' ? '0' : out;
  };
  const dtf = (opts) => {
    try {
      return new Intl.DateTimeFormat(language, { timeZone, ...opts });
    } catch (e) {
      return new Intl.DateTimeFormat('en', opts);
    }
  };
  const fTime = dtf({ hour: '2-digit', minute: '2-digit', ...(hour12 !== undefined ? { hour12 } : {}) });
  const fHour = dtf({ hour: 'numeric', ...(hour12 !== undefined ? { hour12 } : {}) });
  const fWeekday = dtf({ weekday: 'short' });
  const fWeekdayLong = dtf({ weekday: 'long' });
  const fDate = dtf({ weekday: 'long', day: 'numeric', month: 'long' });
  const wrap = (f) => (d) => {
    const x = FWC_U.toDate(d);
    return x ? f.format(x) : '–';
  };
  // Stunde: 12-h-Sprachen "8 AM", sonst "08:00"
  const h12 = (() => { try { return !!fTime.resolvedOptions().hour12; } catch (e) { return false; } })();
  return {
    language,
    num,
    time: wrap(fTime),
    hour: wrap(h12 ? fHour : fTime),
    weekday: wrap(fWeekday),
    weekdayLong: wrap(fWeekdayLong),
    date: wrap(fDate),
    duration: (ms) => {
      if (!FWC_U.isNum(ms)) return '–';
      const m = Math.round(ms / 60000);
      return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h`;
    },
  };
};

/* ------------------------------------------------------------------------------------------------
 * Astronomie (aus der Sun Position Card, Genauigkeit ~1°)
 * Sonnen- und Mondposition aus Breiten-/Längengrad, Auf-/Untergänge, Mondphase.
 * ---------------------------------------------------------------------------------------------- */
const FWC_ASTRO = (() => {
  const RAD = Math.PI / 180;
  const OBLIQUITY = RAD * 23.4397;
  const toDays = (date) => date.valueOf() / 864e5 - 0.5 + 2440588 - 2451545;
  const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
  const sunLongitude = (d) => {
    const M = RAD * (357.5291 + 0.98560028 * d);
    const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    return M + C + RAD * 102.9372 + Math.PI;
  };
  const moonEcliptic = (d) => {
    const L = RAD * (218.316 + 13.176396 * d);
    const M = RAD * (134.963 + 13.064993 * d);
    const F = RAD * (93.272 + 13.229350 * d);
    return { l: L + RAD * 6.289 * Math.sin(M), b: RAD * 5.128 * Math.sin(F) };
  };
  // Azimut (0° = Norden, im Uhrzeigersinn) und Höhe in Grad
  const horizontal = (date, lat, lng, l, b) => {
    const d = toDays(date);
    const phi = RAD * lat;
    const dec = declination(l, b);
    const H = RAD * (280.16 + 360.9856235 * d) + RAD * lng - rightAscension(l, b);
    const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    const azSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
    return { az: ((azSouth / RAD) + 540) % 360, alt: alt / RAD };
  };
  const sunPosition = (date, lat, lng) => horizontal(date, lat, lng, sunLongitude(toDays(date)), 0);
  const moonPosition = (date, lat, lng) => {
    const m = moonEcliptic(toDays(date));
    return horizontal(date, lat, lng, m.l, m.b);
  };
  // Elongation Mond-Sonne in Grad (0 = Neumond, 180 = Vollmond), zunehmend < 180
  const moonElongation = (date) => {
    const d = toDays(date);
    return ((((moonEcliptic(d).l - sunLongitude(d)) / RAD) % 360) + 360) % 360;
  };
  const PHASES = ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'];
  const phaseFromElongation = (e) => PHASES[Math.round(e / 45) % 8];
  const normalizePhase = (s) => {
    if (!s) return null;
    const p = String(s).trim().toLowerCase().replace(/[\s-]+/g, '_');
    return PHASES.includes(p) ? p : null;
  };

  // Durchgänge einer Höhenfunktion durch "h0" im Zeitraum [t0, t1] (Abtastung + lineare Interpolation)
  const crossings = (altFn, t0, t1, h0, stepMin = 10) => {
    const step = stepMin * 60000;
    const out = [];
    let pt = t0, pa = altFn(new Date(t0)) - h0;
    for (let t = t0 + step; t <= t1; t += step) {
      const a = altFn(new Date(t)) - h0;
      if ((pa < 0 && a >= 0) || (pa >= 0 && a < 0)) {
        // Feinsuche per Bisektion
        let lo = pt, hi = t, alo = pa;
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          const am = altFn(new Date(mid)) - h0;
          if ((alo < 0) === (am < 0)) { lo = mid; alo = am; } else hi = mid;
        }
        out.push({ t: new Date((lo + hi) / 2), rising: pa < 0 });
      }
      pt = t; pa = a;
    }
    return out;
  };

  // Sonnenauf-/-untergang für den Kalendertag von "date" (lokale Zeit)
  const sunTimes = (date, lat, lng) => {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 864e5);
    const list = crossings((d) => sunPosition(d, lat, lng).alt, start.getTime(), end.getTime(), -0.833, 10);
    const rise = list.find(c => c.rising);
    const set = list.find(c => !c.rising);
    // Sonnenhöchststand (für den Tagbogen)
    let noon = null, noonAlt = -90;
    for (let t = start.getTime(); t <= end.getTime(); t += 10 * 60000) {
      const a = sunPosition(new Date(t), lat, lng).alt;
      if (a > noonAlt) { noonAlt = a; noon = new Date(t); }
    }
    return { rise: rise ? rise.t : null, set: set ? set.t : null, noon, noonAlt };
  };

  // Nächster Mondauf-/-untergang ab "now" (Schwelle +0,125°)
  const moonEvents = (now, lat, lng) => {
    const t0 = now.getTime();
    const list = crossings((d) => moonPosition(d, lat, lng).alt, t0, t0 + 48 * 36e5, 0.125, 10);
    const rise = list.find(c => c.rising);
    const set = list.find(c => !c.rising);
    return { up: moonPosition(now, lat, lng).alt > 0.125, rise: rise ? rise.t : null, set: set ? set.t : null };
  };

  return { RAD, toDays, sunPosition, moonPosition, moonElongation, phaseFromElongation, normalizePhase, sunTimes, moonEvents, PHASES };
})();

/* ------------------------------------------------------------------------------------------------
 * Online-Daten: Open-Meteo (Wetter, weltweit, ohne API-Key) und Bright Sky (DWD-Warnungen, nur DE)
 * Ergebnisse werden pro Standort zwischengespeichert und von allen Cards gemeinsam genutzt.
 * ---------------------------------------------------------------------------------------------- */
const FWC_ONLINE = (() => {
  const cache = new Map(); // key -> { t, data, promise, error }
  const TTL_WEATHER = 15 * 60000;
  const TTL_ALERTS = 10 * 60000;
  const RETRY = 5 * 60000;

  // WMO-Code -> HA-Wetterzustand
  const wmoToCondition = (code, isDay) => {
    const c = Number(code);
    if (c === 0 || c === 1) return isDay ? 'sunny' : 'clear-night';
    if (c === 2) return 'partlycloudy';
    if (c === 3) return 'cloudy';
    if (c === 45 || c === 48) return 'fog';
    if ([51, 53, 55, 56, 57, 61, 63, 80, 81].includes(c)) return 'rainy';
    if ([65, 82].includes(c)) return 'pouring';
    if ([66, 67].includes(c)) return 'snowy-rainy';
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'snowy';
    if (c === 95) return 'lightning-rainy';
    if (c === 96 || c === 99) return 'hail';
    return 'cloudy';
  };

  const get = (key, ttl, loader, onDone) => {
    const now = Date.now();
    const e = cache.get(key);
    if (e && e.data && now - e.t < ttl) return e.data;
    // läuft der Abruf schon (z. B. von einer anderen Card), bei Fertigstellung ebenfalls Bescheid geben
    if (e && e.promise) { if (onDone) e.waiters.add(onDone); return e.data || null; }
    // nach einem Fehler erst nach RETRY erneut versuchen (bis dahin ggf. die älteren Daten zeigen)
    if (e && e.error && now - e.errT < RETRY) return e.data || null;
    const entry = { t: e ? e.t : 0, data: e ? e.data : null, promise: null, error: null, errT: 0, waiters: new Set(onDone ? [onDone] : []) };
    entry.promise = loader()
      .then((data) => { entry.data = data; entry.t = Date.now(); entry.error = null; })
      .catch((err) => { entry.error = err; entry.errT = Date.now(); console.warn('[flexible-weather-card]', key.split('|')[0], err && err.message ? err.message : err); })
      .finally(() => { entry.promise = null; const w = [...entry.waiters]; entry.waiters.clear(); w.forEach(fn => fn()); });
    cache.set(key, entry);
    return entry.data;
  };

  const fetchJson = async (url) => {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 15000) : null;
    try {
      const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  // Open-Meteo in den Einheiten des HA-Systems abrufen und in HA-Feldnamen umbauen
  const openMeteo = (lat, lon, imperial, onDone) => {
    const key = `open-meteo|${lat.toFixed(3)}|${lon.toFixed(3)}|${imperial ? 'imp' : 'met'}`;
    return get(key, TTL_WEATHER, async () => {
      const cur = ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'dew_point_2m', 'is_day', 'precipitation',
        'weather_code', 'cloud_cover', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'visibility', 'uv_index', 'shortwave_radiation'];
      const hourly = ['temperature_2m', 'relative_humidity_2m', 'precipitation_probability', 'precipitation', 'weather_code', 'wind_speed_10m',
        'wind_direction_10m', 'is_day', 'uv_index', 'shortwave_radiation', 'pressure_msl'];
      const daily = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'precipitation_sum',
        'precipitation_probability_max', 'uv_index_max', 'wind_speed_10m_max', 'wind_direction_10m_dominant', 'shortwave_radiation_sum'];
      const units = imperial ? '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch' : '&wind_speed_unit=kmh';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}`
        + `&current=${cur.join(',')}&hourly=${hourly.join(',')}&daily=${daily.join(',')}`
        + `&timezone=auto&timeformat=unixtime&forecast_days=8${units}`;
      const j = await fetchJson(url);
      const c = j.current || {};
      const isDay = c.is_day === 1;
      const visKm = FWC_U.isNum(c.visibility) ? c.visibility / 1000 : null;
      const out = {
        source: 'Open-Meteo',
        units: imperial
          ? { temperature: '°F', wind: 'mph', precipitation: 'in', pressure: 'hPa', visibility: 'km' }
          : { temperature: '°C', wind: 'km/h', precipitation: 'mm', pressure: 'hPa', visibility: 'km' },
        current: {
          condition: wmoToCondition(c.weather_code, isDay), is_day: isDay,
          temperature: c.temperature_2m, apparent_temperature: c.apparent_temperature, dew_point: c.dew_point_2m,
          humidity: c.relative_humidity_2m, pressure: c.pressure_msl, wind_speed: c.wind_speed_10m, wind_gust: c.wind_gusts_10m,
          wind_bearing: c.wind_direction_10m, visibility: visKm, uv_index: c.uv_index, cloud_coverage: c.cloud_cover,
          precipitation: c.precipitation, solar_radiation: c.shortwave_radiation,
        },
        hourly: [],
        daily: [],
      };
      const h = j.hourly || {};
      (h.time || []).forEach((ts, i) => {
        out.hourly.push({
          datetime: new Date(ts * 1000).toISOString(),
          condition: wmoToCondition(h.weather_code[i], h.is_day ? h.is_day[i] === 1 : true),
          temperature: h.temperature_2m[i], precipitation: h.precipitation[i], precipitation_probability: h.precipitation_probability[i],
          wind_speed: h.wind_speed_10m[i], wind_bearing: h.wind_direction_10m[i], uv_index: h.uv_index ? h.uv_index[i] : null,
          humidity: h.relative_humidity_2m ? h.relative_humidity_2m[i] : null, pressure: h.pressure_msl ? h.pressure_msl[i] : null, shortwave_radiation: h.shortwave_radiation ? h.shortwave_radiation[i] : null,
        });
      });
      // Tagesmittel der Luftfeuchte aus den Stundenwerten
      const humByDay = new Map();
      out.hourly.forEach((f) => {
        if (!FWC_U.isNum(f.humidity)) return;
        const k = new Date(f.datetime).toDateString();
        const e = humByDay.get(k) || [0, 0];
        humByDay.set(k, [e[0] + f.humidity, e[1] + 1]);
      });
      const d = j.daily || {};
      (d.time || []).forEach((ts, i) => {
        out.daily.push({
          datetime: new Date(ts * 1000).toISOString(),
          condition: wmoToCondition(d.weather_code[i], true),
          temperature: d.temperature_2m_max[i], templow: d.temperature_2m_min[i], precipitation: d.precipitation_sum[i],
          precipitation_probability: d.precipitation_probability_max[i], uv_index: d.uv_index_max[i],
          wind_speed: d.wind_speed_10m_max[i], wind_bearing: d.wind_direction_10m_dominant[i],
          sunrise: d.sunrise ? new Date(d.sunrise[i] * 1000).toISOString() : null,
          sunset: d.sunset ? new Date(d.sunset[i] * 1000).toISOString() : null,
          radiation_sum: d.shortwave_radiation_sum && FWC_U.isNum(d.shortwave_radiation_sum[i]) ? d.shortwave_radiation_sum[i] / 3.6 : null,
          humidity: (() => { const e = humByDay.get(new Date(ts * 1000).toDateString()); return e ? Math.round(e[0] / e[1]) : null; })(),
        });
      });
      return out;
    }, onDone);
  };

  // DWD-Warnungen über Bright Sky (nur Deutschland). Außerhalb Deutschlands kommt eine leere Liste.
  const brightSky = (lat, lon, onDone) => {
    const key = `bright-sky|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    return get(key, TTL_ALERTS, async () => {
      const j = await fetchJson(`https://api.brightsky.dev/alerts?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
      const sev = { minor: 1, moderate: 2, severe: 3, extreme: 4 };
      return {
        source: 'DWD / Bright Sky',
        region: j.location ? j.location.name : null,
        alerts: (j.alerts || []).map(a => ({
          level: sev[String(a.severity || '').toLowerCase()] || 1,
          event: { de: a.event_de, en: a.event_en },
          headline: { de: a.headline_de, en: a.headline_en },
          description: { de: a.description_de, en: a.description_en },
          instruction: { de: a.instruction_de, en: a.instruction_en },
          start: a.onset || a.effective, end: a.expires, code: a.event_code,
        })),
      };
    }, onDone);
  };

  // Pollen über die Open-Meteo Air-Quality-API (CAMS, nur Europa): heute und morgen (Tagesmaximum)
  const POLLEN = ['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed'];
  const pollen = (lat, lon, onDone) => {
    const key = `pollen|${lat.toFixed(2)}|${lon.toFixed(2)}`;
    return get(key, 60 * 60000, async () => {
      const vars = POLLEN.map(p => `${p}_pollen`).join(',');
      const j = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}`
        + `&current=${vars}&hourly=${vars}&timezone=auto&timeformat=unixtime&forecast_days=2`);
      const c = j.current || {};
      const h = j.hourly || {};
      const today = new Date().toDateString();
      const out = { source: 'Open-Meteo / CAMS', types: [] };
      POLLEN.forEach((p) => {
        const k = `${p}_pollen`;
        if (c[k] === undefined && !h[k]) return;
        let maxT = null, maxM = null;
        (h.time || []).forEach((ts, i) => {
          const v = h[k] ? h[k][i] : null;
          if (!FWC_U.isNum(v)) return;
          if (new Date(ts * 1000).toDateString() === today) maxT = Math.max(maxT ?? 0, v); else maxM = Math.max(maxM ?? 0, v);
        });
        out.types.push({ type: p, now: FWC_U.isNum(c[k]) ? c[k] : null, today: maxT, tomorrow: maxM, unit: 'grains/m³' });
      });
      // Außerhalb Europas liefert die API nur null-Werte
      out.covered = out.types.some(t => t.now !== null || t.today !== null);
      return out;
    }, onDone);
  };

  // RainViewer: Liste der Radarbilder (letzte 2 Std., 10-Minuten-Schritte)
  const rainviewer = (onDone) => get('rainviewer', 5 * 60000, async () => {
    const j = await fetchJson('https://api.rainviewer.com/public/weather-maps.json');
    return { host: j.host, frames: ((j.radar && j.radar.past) || []).map(f => ({ time: f.time, path: f.path })) };
  }, onDone);

  return { openMeteo, brightSky, pollen, rainviewer, wmoToCondition };
})();

/* ------------------------------------------------------------------------------------------------
 * Datenmodell: führt Wetter-Entität, lokale Sensoren, Forecast-Abo und Online-Daten zusammen.
 * Jeder Messwert: { v, u, src, e }  (Wert, Einheit, Quelle, Entität für more-info)
 * ---------------------------------------------------------------------------------------------- */
const FWC_FIELDS = ['temperature', 'apparent_temperature', 'dew_point', 'humidity', 'pressure', 'wind_speed', 'wind_gust',
  'wind_bearing', 'visibility', 'uv_index', 'cloud_coverage', 'precipitation', 'precipitation_probability', 'solar_radiation', 'ozone'];

const FWC_MODEL = (() => {
  const U = FWC_U;
  // Astronomie-Ergebnisse kurz zwischenspeichern (die Card rendert bei jedem hass-Update)
  const memo = new Map();
  const cached = (key, fn) => {
    if (memo.has(key)) return memo.get(key);
    const v = fn();
    if (memo.size > 60) memo.clear();
    memo.set(key, v);
    return v;
  };
  const WEATHER_ATTR = {
    temperature: 'temperature', apparent_temperature: 'apparent_temperature', dew_point: 'dew_point', humidity: 'humidity',
    pressure: 'pressure', wind_speed: 'wind_speed', wind_gust: 'wind_gust_speed', wind_bearing: 'wind_bearing',
    visibility: 'visibility', uv_index: 'uv_index', cloud_coverage: 'cloud_coverage', ozone: 'ozone',
  };

  // Standort: Card-Option > HA-Konfiguration
  const location = (hass, cfg) => {
    const l = (cfg && cfg.location) || {};
    const lat = U.toNum(l.latitude);
    const lon = U.toNum(l.longitude);
    if (lat !== null && lon !== null) return { lat, lon };
    const c = (hass && hass.config) || {};
    if (U.isNum(c.latitude) && U.isNum(c.longitude)) return { lat: c.latitude, lon: c.longitude };
    return null;
  };

  const units = (hass, attrs) => {
    const us = (hass && hass.config && hass.config.unit_system) || {};
    const a = attrs || {};
    const imperial = /F/.test(us.temperature || '');
    return {
      imperial,
      temperature: a.temperature_unit || us.temperature || '°C',
      pressure: a.pressure_unit || us.pressure || (imperial ? 'inHg' : 'hPa'),
      wind: a.wind_speed_unit || us.wind_speed || (imperial ? 'mph' : 'km/h'),
      visibility: a.visibility_unit || us.length || (imperial ? 'mi' : 'km'),
      precipitation: a.precipitation_unit || us.accumulated_precipitation || (imperial ? 'in' : 'mm'),
    };
  };

  const unitFor = (field, un) => ({
    temperature: un.temperature, apparent_temperature: un.temperature, dew_point: un.temperature, humidity: '%',
    pressure: un.pressure, wind_speed: un.wind, wind_gust: un.wind, wind_bearing: '°', visibility: un.visibility,
    uv_index: '', cloud_coverage: '%', precipitation: un.precipitation, precipitation_probability: '%', solar_radiation: 'W/m²', ozone: 'DU',
  })[field];

  // Wert aus einem HA-Zustand lesen (Zahl, bei Windrichtung auch Text)
  const fromEntity = (hass, eid, field) => {
    const s = eid && hass.states[eid];
    if (!s || ['unknown', 'unavailable', ''].includes(s.state)) return null;
    const v = field === 'wind_bearing' ? U.bearing(s.state) : U.toNum(s.state);
    if (v === null) return null;
    return { v, u: s.attributes.unit_of_measurement || '', src: 'sensor', e: eid };
  };

  // Online-Wert in die Ziel-Einheit umrechnen
  const convertOnline = (field, v, on, un) => {
    if (!U.isNum(v)) return null;
    if (field === 'pressure') return U.hpaTo(v, un.pressure);
    if (field === 'visibility') return U.kmTo(v, un.visibility);
    if (['temperature', 'apparent_temperature', 'dew_point'].includes(field)) {
      if (on.units.temperature === un.temperature) return v;
      return U.fromC(U.toC(v, on.units.temperature), un.temperature);
    }
    if (['wind_speed', 'wind_gust'].includes(field)) {
      if (on.units.wind === un.wind) return v;
      return U.windToMs(v, on.units.wind) / (U.windToMs(1, un.wind) || 1);
    }
    if (field === 'precipitation') {
      if (on.units.precipitation === un.precipitation) return v;
      const mm = U.precToMm(v, on.units.precipitation);
      return /in/i.test(un.precipitation) ? mm / 25.4 : mm;
    }
    return v;
  };

  const normForecast = (list) => (Array.isArray(list) ? list : []).map(f => ({
    t: U.toDate(f.datetime),
    cond: f.condition,
    temp: U.toNum(f.temperature),
    low: U.toNum(f.templow),
    precip: U.toNum(f.precipitation),
    pop: U.toNum(f.precipitation_probability),
    wind: U.toNum(f.wind_speed),
    bearing: U.bearing(f.wind_bearing),
    uv: U.toNum(f.uv_index),
    day: f.is_daytime,
    sunrise: U.toDate(f.sunrise),
    sunset: U.toDate(f.sunset),
    hum: U.toNum(f.humidity),
    press: U.toNum(f.pressure),
    rad: U.toNum(f.shortwave_radiation),
    radSum: U.toNum(f.radiation_sum),
  })).filter(f => f.t);

  // Warnungen aus HA-Entitäten (DWD Weather Warnings, Meteoalarm, generisch)
  const warningsFromEntities = (hass, ids) => {
    const out = [];
    ids.forEach((eid) => {
      const s = hass.states[eid];
      if (!s) return;
      const a = s.attributes || {};
      const advance = /advance|vorab|vorwarn/i.test(eid);
      if (a.warning_count !== undefined) {
        const n = U.toNum(a.warning_count) || 0;
        for (let i = 1; i <= n; i++) {
          const p = `warning_${i}_`;
          if (!a[`${p}headline`] && !a[`${p}name`]) continue;
          out.push({
            level: U.toNum(a[`${p}level`]) || 1, color: a[`${p}color`] || null,
            event: a[`${p}name`] || '', headline: a[`${p}headline`] || a[`${p}name`] || '',
            description: a[`${p}description`] || '', instruction: a[`${p}instruction`] || '',
            start: a[`${p}start`] || null, end: a[`${p}end`] || null, code: a[`${p}type`], advance, e: eid,
            region: a.region_name || null,
          });
        }
        return;
      }
      // Meteoalarm & ähnliche: binary_sensor mit headline/event/awareness_level
      if (s.state === 'on' && (a.headline || a.event || a.awareness_level)) {
        let level = 2;
        const al = String(a.awareness_level || '');
        if (/red|3;/i.test(al)) level = 3;
        else if (/orange|2;/i.test(al)) level = 2;
        else if (/yellow|1;/i.test(al)) level = 1;
        const sev = String(a.severity || '').toLowerCase();
        if (sev === 'extreme') level = 4; else if (sev === 'severe') level = Math.max(level, 3);
        out.push({
          level, event: a.event || a.awareness_type || '', headline: a.headline || a.event || '',
          description: a.description || '', instruction: a.instruction || '', start: a.onset || a.effective || null,
          end: a.expires || null, e: eid,
        });
      }
    });
    // Doppelte (aktuell + Vorab) zusammenführen
    const seen = new Set();
    return out.filter((w) => {
      const k = `${w.headline}|${w.start}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((x, y) => (y.level - x.level) || (String(x.start || '').localeCompare(String(y.start || ''))));
  };

  const guessPollen = (txt) => {
    const t = String(txt).toLowerCase();
    const map = { alder: /erle|alder/, birch: /birke|birch/, grass: /gr[aä]s|grass/, mugwort: /beifu|mugwort/, ragweed: /ambrosia|ragweed/,
      hazel: /hasel|hazel/, ash: /esche|ash/, rye: /roggen|rye/, olive: /olive/ };
    return Object.keys(map).find(k => map[k].test(t)) || null;
  };

  // Warn-Entitäten automatisch finden. Die Suche über alle Entitäten läuft nur, wenn sich deren Anzahl ändert
  // oder spätestens jede Minute – nicht bei jedem hass-Update.
  let autoWarn = { n: -1, t: 0, ids: [] };
  const autoWarningEntities = (hass) => {
    const keys = Object.keys(hass.states);
    const now = Date.now();
    if (keys.length === autoWarn.n && now - autoWarn.t < 60000) return autoWarn.ids;
    const ids = keys.filter((eid) => {
      if (!eid.startsWith('sensor.')) return false;
      const a = hass.states[eid].attributes || {};
      return a.warning_count !== undefined && (a.region_name !== undefined || a.region_id !== undefined);
    });
    autoWarn = { n: keys.length, t: now, ids };
    return ids;
  };

  /**
   * ext: { forecast: { daily, hourly, twice_daily }, notify: () => void }
   * notify wird aufgerufen, wenn Online-Daten eingetroffen sind (Card rendert neu).
   */
  const build = (hass, cfg, ext = {}, needs = {}) => {
    const lang = fwcLang(hass, cfg);
    const now = new Date();
    const wid = cfg.weather_entity;
    const W = wid && hass.states[wid];
    const wOk = !!W && !['unavailable', 'unknown'].includes(W.state);
    const A = (W && W.attributes) || {};
    const un = units(hass, wOk ? A : null);
    const loc = location(hass, cfg);
    const onlineAllowed = cfg.online_fallback !== false && !!loc;
    const sensors = cfg.sensors || {};
    const cur = {};

    FWC_FIELDS.forEach((f) => {
      let val = fromEntity(hass, sensors[f], f);
      if (!val && wOk && WEATHER_ATTR[f] && A[WEATHER_ATTR[f]] !== undefined && A[WEATHER_ATTR[f]] !== null) {
        const raw = f === 'wind_bearing' ? U.bearing(A[WEATHER_ATTR[f]]) : U.toNum(A[WEATHER_ATTR[f]]);
        if (raw !== null) val = { v: raw, u: unitFor(f, un), src: 'weather', e: wid };
      }
      cur[f] = val;
    });

    // Forecast aus dem HA-Abo
    const fc = ext.forecast || {};
    let daily = normForecast(fc.daily);
    let hourly = normForecast(fc.hourly);
    if (!daily.length && fc.twice_daily) {
      // twice_daily -> daily zusammenfassen
      const tw = normForecast(fc.twice_daily);
      const byDay = new Map();
      tw.forEach((f) => {
        const k = f.t.toDateString();
        const d = byDay.get(k) || { ...f, low: null };
        if (f.day === false) d.low = f.temp; else { d.temp = f.temp; d.cond = f.cond; }
        byDay.set(k, d);
      });
      daily = [...byDay.values()];
    }

    // Regenwahrscheinlichkeit: Sensor > nächste Stunde > heute
    const derivePop = () => {
      if (cur.precipitation_probability) return;
      const nowMs = now.getTime();
      const h0 = hourly.find(f => f.pop !== null && f.t.getTime() > nowMs - 3600e3);
      const d0 = daily.find(f => U.sameDay(f.t, now) && f.pop !== null);
      const p = h0 ? h0.pop : (d0 ? d0.pop : null);
      if (p !== null) cur.precipitation_probability = { v: p, u: '%', src: 'forecast', e: wid || null };
    };
    derivePop();

    // Online nur laden, wenn etwas fehlt, das tatsächlich gebraucht wird.
    // Forecast-Typen, die abonniert, aber noch nicht eingetroffen sind, zählen nicht als "fehlt".
    const pend = ext.pending || {};
    const fromForecast = ['precipitation_probability'];
    const missingCurrent = Object.keys(needs.fields || {}).some(f => !cur[f] && !(fromForecast.includes(f) && (pend.daily || pend.hourly)))
      || (!wOk && needs.condition);
    const noHum = (l) => l.length > 0 && !l.some(f => f.hum !== null);
    const noPress = (l) => l.length > 0 && !l.some(f => f.press !== null);
    const missingExtra = (needs.fhum && ((needs.hourly && noHum(hourly)) || (needs.daily && noHum(daily))))
      || (needs.fpress && needs.hourly && noPress(hourly))
      || (needs.solar && !pend.hourly && !hourly.some(f => f.rad !== null));
    const needOnline = onlineAllowed && (missingCurrent || missingExtra || (needs.daily && !daily.length && !pend.daily) || (needs.hourly && !hourly.length && !pend.hourly));
    let online = null;
    let solarDay = [];
    if (needOnline) online = FWC_ONLINE.openMeteo(loc.lat, loc.lon, un.imperial, ext.notify);
    const sources = new Set();
    if (wOk) sources.add('ha');
    let usedOnline = false;
    if (online) {
      FWC_FIELDS.forEach((f) => {
        if (cur[f]) return;
        const v = convertOnline(f, online.current[f], online, un);
        if (v !== null && v !== undefined) { cur[f] = { v, u: unitFor(f, un), src: 'online', e: null }; usedOnline = usedOnline || !!(needs.fields || {})[f]; }
      });
      const convF = (list) => list.map(f => ({
        ...f,
        temperature: convertOnline('temperature', f.temperature, online, un),
        templow: convertOnline('temperature', f.templow, online, un),
        wind_speed: convertOnline('wind_speed', f.wind_speed, online, un),
        precipitation: convertOnline('precipitation', f.precipitation, online, un),
      }));
      if (!daily.length && online.daily.length) { daily = normForecast(convF(online.daily)); usedOnline = usedOnline || !!needs.daily; }
      if (!hourly.length && online.hourly.length) { hourly = normForecast(convF(online.hourly)); usedOnline = usedOnline || !!needs.hourly; }
      // Luftfeuchte / Strahlung in der HA-Vorhersage ergänzen, wenn die Integration sie nicht liefert
      const onH = normForecast(online.hourly);
      const onD = normForecast(online.daily);
      const fill = (list, src, key, same) => {
        if (!list.length || list.some(f => f[key] !== null)) return;
        list.forEach((f) => { const m = src.find(o => same(o.t, f.t)); if (m && m[key] !== null) { f[key] = m[key]; usedOnline = true; } });
      };
      const sameHour = (a, b) => Math.abs(a - b) < 30 * 60000;
      if (needs.fhum) { fill(hourly, onH, 'hum', sameHour); fill(daily, onD, 'hum', U.sameDay); }
      if (needs.fpress) fill(hourly, onH, 'press', sameHour);
      if (needs.solar) { fill(hourly, onH, 'rad', sameHour); fill(daily, onD, 'radSum', U.sameDay); }
      if (needs.solar) solarDay = onH.filter(f => U.sameDay(f.t, now) && f.rad !== null);
    }
    if (needs.solar && !solarDay.length) solarDay = hourly.filter(f => U.sameDay(f.t, now) && f.rad !== null);
    // Stündliche Werte, die schon vorbei sind, ausblenden (die laufende Stunde bleibt)
    const hourlyAll = hourly;
    hourly = hourly.filter(f => f.t.getTime() > now.getTime() - 60 * 60000);
    // Tage vor heute ausblenden
    const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
    daily = daily.filter(f => f.t.getTime() >= today0.getTime() - 12 * 36e5 && !(f.t < today0 && !U.sameDay(f.t, now)));

    // Zustand
    let condition = wOk ? W.state : null;
    if (!condition && online) { condition = online.current.condition; usedOnline = usedOnline || !!needs.condition; }

    derivePop();

    // Heute min/max
    const todayF = daily.find(f => U.sameDay(f.t, now)) || null;
    let tmin = todayF ? todayF.low : null;
    let tmax = todayF ? todayF.temp : null;
    const todayHours = hourly.filter(f => U.sameDay(f.t, now) && f.temp !== null);
    if ((tmin === null || tmax === null) && todayHours.length) {
      const temps = todayHours.map(f => f.temp).concat(cur.temperature ? [cur.temperature.v] : []);
      if (tmin === null) tmin = Math.min(...temps);
      if (tmax === null) tmax = Math.max(...temps);
    }
    // Eigene Min/Max-Sensoren haben Vorrang: Karteneinstellungen > Entitäten eines Min/Max-Elements > Wetterdaten
    const mmEl = (cfg.elements || []).find(e => e && e.type === 'minmax' && (e.min_entity || e.max_entity)) || {};
    const minS = fromEntity(hass, sensors.temperature_min || mmEl.min_entity, 'temperature');
    const maxS = fromEntity(hass, sensors.temperature_max || mmEl.max_entity, 'temperature');
    if (minS) tmin = minS.v;
    if (maxS) tmax = maxS.v;
    const sumToday = todayF && todayF.precip !== null ? todayF.precip
      : (todayHours.length ? todayHours.reduce((s, f) => s + (f.precip || 0), 0) : null);

    // Sonne
    const sunId = cfg.sun_entity || 'sun.sun';
    const S = hass.states[sunId];
    let sun = null;
    if (loc || S) {
      const calc = loc ? FWC_ASTRO.sunPosition(now, loc.lat, loc.lon) : null;
      const az = S && U.isNum(S.attributes.azimuth) ? S.attributes.azimuth : (calc ? calc.az : null);
      const el = S && U.isNum(S.attributes.elevation) ? S.attributes.elevation : (calc ? calc.alt : null);
      const times = loc ? cached(`st|${loc.lat}|${loc.lon}|${now.toDateString()}`, () => FWC_ASTRO.sunTimes(now, loc.lat, loc.lon)) : {};
      let rise = times.rise, set = times.set;
      // Genauere Zeiten aus der Sonnen-Entität bzw. Open-Meteo übernehmen
      const nr = S ? U.toDate(S.attributes.next_rising) : null;
      const ns = S ? U.toDate(S.attributes.next_setting) : null;
      // next_rising / next_setting liegen nach dem Ereignis schon auf morgen: dann ist "minus 1 Tag" der heutige Wert (± 2 min)
      const today = (d) => (!d ? null : (U.sameDay(d, now) ? d : (U.sameDay(new Date(d.getTime() - 864e5), now) ? new Date(d.getTime() - 864e5) : null)));
      if (today(nr)) rise = today(nr);
      if (today(ns)) set = today(ns);
      if (!S && todayF && todayF.sunrise) rise = todayF.sunrise;
      if (!S && todayF && todayF.sunset) set = todayF.sunset;
      sun = {
        az, el, rise, set, noon: times.noon || null, noonAlt: times.noonAlt,
        nextRise: nr || (rise && rise > now ? rise : (rise ? new Date(rise.getTime() + 864e5) : null)),
        nextSet: ns || (set && set > now ? set : (set ? new Date(set.getTime() + 864e5) : null)),
        e: S ? sunId : null, src: S ? 'sun' : 'calc',
      };
    }

    // Mond
    let moon = null;
    {
      const elong = FWC_ASTRO.moonElongation(now);
      const mid = cfg.moon_entity || (hass.states['sensor.moon_phase'] ? 'sensor.moon_phase' : null);
      const M = mid && hass.states[mid];
      const phase = (M && FWC_ASTRO.normalizePhase(M.state)) || FWC_ASTRO.phaseFromElongation(elong);
      const pos = loc ? FWC_ASTRO.moonPosition(now, loc.lat, loc.lon) : null;
      const ev = loc ? cached(`me|${loc.lat}|${loc.lon}|${Math.floor(now.getTime() / 300000)}`, () => FWC_ASTRO.moonEvents(now, loc.lat, loc.lon)) : null;
      moon = {
        phase, elong, illum: (1 - Math.cos(elong * FWC_ASTRO.RAD)) / 2,
        az: pos ? pos.az : null, alt: pos ? pos.alt : null,
        rise: ev ? ev.rise : null, set: ev ? ev.set : null,
        daysToFull: ((180 - elong + 360) % 360) / 12.19, daysToNew: ((360 - elong) % 360) / 12.19,
        e: M ? mid : null,
      };
    }

    // Warnungen
    let warnings = null, warnSource = null, warnRegion = null;
    if (needs.warnings) {
      const ids = (needs.warnings.entities && needs.warnings.entities.length) ? needs.warnings.entities
        : ((cfg.warning_entities && cfg.warning_entities.length) ? cfg.warning_entities : autoWarningEntities(hass));
      if (ids.length) {
        warnings = warningsFromEntities(hass, ids);
        warnSource = 'ha';
        const r = ids.map(i => hass.states[i]).find(s => s && s.attributes.region_name);
        warnRegion = r ? r.attributes.region_name : null;
      } else if (needs.warnings.online !== false && cfg.warnings_online !== false && loc) {
        const bs = FWC_ONLINE.brightSky(loc.lat, loc.lon, ext.notify);
        if (bs) {
          const pick = (o) => (o ? (o[lang] || o.de || o.en || '') : '');
          warnings = bs.alerts.map(a => ({
            ...a, event: pick(a.event), headline: pick(a.headline), description: pick(a.description), instruction: pick(a.instruction),
          })).sort((x, y) => y.level - x.level);
          warnSource = 'online';
          warnRegion = bs.region;
        }
      }
    }

    // Pollen: eigene Sensoren (z. B. DWD Pollenflug) oder online (Open-Meteo / CAMS, nur Europa)
    let pollen = null;
    if (needs.pollen) {
      const ids = needs.pollen.entities || [];
      if (ids.length) {
        pollen = { src: 'ha', covered: true, types: ids.map((eid) => {
          const st = hass.states[eid];
          if (!st) return { name: eid, missing: true, e: eid };
          const a = st.attributes || {};
          return {
            name: a.friendly_name || eid, value: U.toNum(st.state), unit: a.unit_of_measurement || '', e: eid,
            tomorrow: U.toNum(a.state_tomorrow ?? a.tomorrow), type: guessPollen(`${eid} ${a.friendly_name || ''}`),
          };
        }) };
      } else if (needs.pollen.online !== false && loc) {
        const po = FWC_ONLINE.pollen(loc.lat, loc.lon, ext.notify);
        if (po) pollen = { src: 'online', covered: po.covered, source: po.source, types: po.types.map(x => ({ ...x, value: x.today ?? x.now })) };
      }
    }

    return {
      now, lang, units: un, loc, condition, pollen, isDay: sun && U.isNum(sun.el) ? sun.el > 0 : (online ? online.current.is_day : true),
      cur, daily, hourly, hourlyAll, solarDay, today: { min: tmin, max: tmax, precip: sumToday, uv: todayF ? todayF.uv : null, radSum: todayF ? todayF.radSum : null },
      sun, moon, warnings, warnSource, warnRegion,
      weather: wOk ? W : null, weatherId: wid || null, missingWeather: !!wid && !W,
      online: online ? online.source : null, usedOnline, onlinePending: needOnline && !online,
    };
  };

  return { build, location, units, autoWarningEntities };
})();

/* ------------------------------------------------------------------------------------------------
 * Layout: Elemente liegen auf einem Raster (x, y, w, h in Zellen).
 * Kollisionen werden durch Verschieben nach unten aufgelöst.
 * ---------------------------------------------------------------------------------------------- */
const FWC_LAYOUT = (() => {
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  // Ganze Zahlen, innerhalb der Spalten
  const normalize = (el, cols) => {
    const w = Math.max(1, Math.min(cols, Math.round(el.w || 1)));
    const h = Math.max(1, Math.round(el.h || 1));
    const x = Math.max(0, Math.min(cols - w, Math.round(el.x || 0)));
    const y = Math.max(0, Math.round(el.y || 0));
    return { ...el, x, y, w, h };
  };

  // "fixedId" bleibt, wo es ist; alles, was überlappt, rutscht nach unten
  const resolve = (elements, fixedId, cols) => {
    const items = elements.map(e => normalize(e, cols));
    const fixed = items.find(e => e.id === fixedId);
    const queue = fixed ? [fixed] : [];
    const placed = new Set(fixed ? [fixed.id] : []);
    let guard = 0;
    while (queue.length && guard++ < 2000) {
      const a = queue.shift();
      items
        .filter(b => b !== a && overlap(a, b))
        .sort((p, q) => p.y - q.y)
        .forEach((b) => {
          b.y = a.y + a.h;
          queue.push(b);
          placed.add(b.id);
        });
    }
    // Restliche Überlappungen (z. B. aus von Hand geschriebener YAML) von oben nach unten auflösen
    const sorted = [...items].sort((p, q) => (p.y - q.y) || (p.x - q.x));
    sorted.forEach((a, i) => {
      for (let j = 0; j < i; j++) {
        const b = sorted[j];
        if (overlap(a, b) && a.id !== fixedId) a.y = b.y + b.h;
      }
    });
    return items;
  };

  // Lücken schließen: jedes Element (in Lesereihenfolge) auf den ersten freien Platz weiter oben setzen –
  // bevorzugt in derselben Spalte, sonst an der ersten freien Stelle der Zeile. Nach unten wird nie verschoben.
  const compact = (elements, cols) => {
    const items = elements.map(e => normalize(e, cols)).sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const done = [];
    items.forEach((it) => {
      const free = (x, y) => !done.some(d => overlap({ ...it, x, y }, d));
      let spot = null;
      for (let y = 0; y <= it.y && !spot; y++) {
        if (free(it.x, y)) { spot = { x: it.x, y }; break; }
        for (let x = 0; x <= cols - it.w; x++) { if (free(x, y)) { spot = { x, y }; break; } }
      }
      if (spot) { it.x = spot.x; it.y = spot.y; } else { while (!free(it.x, it.y)) it.y += 1; }
      done.push(it);
    });
    return items;
  };

  // Erster freier Platz für ein neues Element (Zeile für Zeile)
  const freeSpot = (elements, w, h, cols) => {
    w = Math.min(w, cols);
    for (let y = 0; y < 500; y++) {
      for (let x = 0; x <= cols - w; x++) {
        const c = { x, y, w, h };
        if (!elements.some(e => overlap(c, e))) return { x, y };
      }
    }
    return { x: 0, y: rows(elements) };
  };

  const rows = (elements) => elements.reduce((m, e) => Math.max(m, (e.y || 0) + (e.h || 1)), 0);

  // Ausgeblendete Elemente: Zeilen, die dadurch komplett leer werden, fallen weg
  const collapse = (elements, hiddenIds) => {
    if (!hiddenIds.size) return elements;
    let visible = elements.filter(e => !hiddenIds.has(e.id)).map(e => ({ ...e }));
    const total = rows(elements);
    const used = new Array(total).fill(false);
    visible.forEach(e => { for (let r = e.y; r < e.y + e.h; r++) used[r] = true; });
    const hiddenRows = new Array(total).fill(false);
    elements.filter(e => hiddenIds.has(e.id)).forEach(e => { for (let r = e.y; r < e.y + e.h; r++) hiddenRows[r] = true; });
    // Zeilen entfernen, die nur von ausgeblendeten Elementen belegt waren
    const shift = new Array(total + 1).fill(0);
    let s = 0;
    for (let r = 0; r < total; r++) {
      shift[r] = s;
      if (hiddenRows[r] && !used[r]) s++;
    }
    shift[total] = s;
    visible = visible.map(e => ({ ...e, y: e.y - shift[Math.min(e.y, total)] }));
    return visible;
  };

  return { overlap, normalize, resolve, compact, freeSpot, rows, collapse };
})();
