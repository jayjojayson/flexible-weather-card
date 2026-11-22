/*
 * Flexible Weather Card - LAYOUT DESIGNER
 * Dateiname: flexible-weather-card-designer.js
 * Modales Fenster (aus dem Karten-Editor geöffnet): Elemente aus der Palette per Drag & Drop
 * auf das Raster ziehen, verschieben, Größe ändern, Eigenschaften bearbeiten.
 * Aufbau angelehnt an den House Designer der Power Flux Card.
 * Jede Änderung geht als "fwc-config-changed" ({ config }) an den Editor.
 */

const FWC_D_I18N = {
  de: {
    title: 'Layout-Designer', done: 'Fertig', undo: 'Rückgängig', templates: 'Vorlagen',
    palette: 'Elemente', palette_hint: 'Ziehen oder antippen', search: 'Suchen …', props: 'Eigenschaften', card: 'Karte',
    grid: 'Raster', columns: 'Spalten', row_height: 'Zeilenhöhe', gap: 'Abstand', padding: 'Innenabstand', tile_style: 'Stil der Kacheln',
    animations: 'Animationen', background: 'Hintergrund', bg_card: 'Karte', bg_transparent: 'Transparent', font_scale: 'Schriftgröße',
    layers: 'Elemente auf der Karte', no_elements: 'Noch keine Elemente. Zieh welche aus der Palette links auf das Raster.',
    position: 'Position & Größe', x: 'Spalte', y: 'Zeile', w: 'Breite', h: 'Höhe', appearance: 'Darstellung', style: 'Stil',
    style_default: 'Standard', style_tile: 'Kachel', style_outline: 'Rahmen', style_flat: 'Flach', style_none: 'Ohne', style_accent: 'Akzent',
    accent: 'Akzentfarbe', auto: 'Auto', show_title: 'Beschriftung anzeigen', title_text: 'Eigene Beschriftung', options: 'Optionen',
    duplicate: 'Duplizieren', delete: 'Löschen', source: 'Datenquelle', src_weather: 'Wetter-Entität', src_sensor: 'Eigener Sensor',
    src_online: 'Open-Meteo (online)', src_forecast: 'Vorhersage', src_calc: 'Berechnet', src_sun: 'Sonnen-Entität', src_none: 'Keine Daten',
    hint_mobile: 'Auf dem Handy (unter 600 px) wird diese Card automatisch zweispaltig umgebrochen – die Vorschau zeigt das Raster unverändert.', preview_width: 'Vorschau-Breite', zoom_in: 'Vergrößern', zoom_out: 'Verkleinern', zoom_fit: 'Einpassen', zoom_hint: 'Zoom – auch mit Strg + Mausrad oder Strg + / −', keep_proportions: 'Auf breiteren Bildschirmen proportional vergrößern', keep_proportions_d: 'Die Card sieht aus wie in der Vorschau ({w} px) – Zeilen, Abstände und Schrift wachsen mit, statt die Elemente nur in die Breite zu ziehen.', hint_select: 'Element anklicken zum Bearbeiten · Ziehen zum Verschieben · Ecke unten rechts zum Vergrößern',
    hint_drag: 'Loslassen zum Ablegen – andere Elemente rutschen automatisch nach unten', hint_palette: 'Auf das Raster ziehen oder antippen, um es unten anzufügen',
    keys: 'Tastenkürzel', key_move: 'Verschieben', key_resize: 'Größe ändern', key_delete: 'Löschen', key_undo: 'Rückgängig', key_dup: 'Duplizieren', key_esc: 'Auswahl aufheben / schließen',
    tpl_title: 'Wie soll deine Wetterkarte aussehen?', tpl_hint: 'Wähle eine Vorlage als Startpunkt – danach kannst du alles frei anordnen. Rückgängig ist jederzeit möglich.',
    tpl_compact: 'Kompakt', tpl_standard: 'Standard', tpl_detailed: 'Ausführlich', tpl_astro: 'Sonne & Mond', tpl_weather3d: '3D Wetter ausführlich', tpl_dashboard: 'Dashboard-Seite', tpl_empty: 'Leer starten',
    tpl_compact_d: 'Aktuelles Wetter und 5 Tage', tpl_standard_d: 'Wetter, Wind, Feuchte, Verlauf, Vorhersage', tpl_detailed_d: 'Alle Messwerte, 3D-Sonne, Mond, Vorhersagen',
    tpl_astro_d: '3D-Kuppel, Sonnenzeiten, Mond', tpl_weather3d_d: '3D-Diorama mit Wetterszene, allen Werten und Vorhersagen', tpl_dashboard_d: 'Komplette Seite über die volle Breite (12 Spalten)', tpl_empty_d: 'Leeres Raster, alles selbst platzieren', use_tpl: 'Übernehmen', back: 'Zurück zum Layout',
    elements_count: '{n} Elemente', rows_count: '{n} Zeilen', empty_canvas: 'Elemente aus der Palette hierher ziehen',
    yaml_hint: 'Konfiguration einer beliebigen Karte (YAML), z. B. type: entities', none: 'Keine', invalid_yaml: 'Ungültige Konfiguration',
    radius: 'Eckenradius', radius_all: 'Eckenradius aller Elemente', inherited: 'Aus den Karteneinstellungen', inherited_auto: 'Automatisch erkannt',
  },
  en: {
    title: 'Layout designer', done: 'Done', undo: 'Undo', templates: 'Templates',
    palette: 'Elements', palette_hint: 'Drag or tap', search: 'Search …', props: 'Properties', card: 'Card',
    grid: 'Grid', columns: 'Columns', row_height: 'Row height', gap: 'Gap', padding: 'Padding', tile_style: 'Tile style',
    animations: 'Animations', background: 'Background', bg_card: 'Card', bg_transparent: 'Transparent', font_scale: 'Font size',
    layers: 'Elements on the card', no_elements: 'No elements yet. Drag some from the palette onto the grid.',
    position: 'Position & size', x: 'Column', y: 'Row', w: 'Width', h: 'Height', appearance: 'Appearance', style: 'Style',
    style_default: 'Default', style_tile: 'Tile', style_outline: 'Outline', style_flat: 'Flat', style_none: 'None', style_accent: 'Accent',
    accent: 'Accent color', auto: 'Auto', show_title: 'Show label', title_text: 'Custom label', options: 'Options',
    duplicate: 'Duplicate', delete: 'Delete', source: 'Data source', src_weather: 'Weather entity', src_sensor: 'Own sensor',
    src_online: 'Open-Meteo (online)', src_forecast: 'Forecast', src_calc: 'Calculated', src_sun: 'Sun entity', src_none: 'No data',
    hint_mobile: 'On phones (below 600 px) this card is automatically rearranged into two columns – the preview shows the grid unchanged.', preview_width: 'Preview width', zoom_in: 'Zoom in', zoom_out: 'Zoom out', zoom_fit: 'Fit', zoom_hint: 'Zoom – also with Ctrl + mouse wheel or Ctrl + / −', keep_proportions: 'Scale proportionally on wider screens', keep_proportions_d: 'The card looks like in the preview ({w} px) – rows, gaps and text grow with it instead of only stretching the elements.', hint_select: 'Click an element to edit · drag to move · bottom-right corner to resize',
    hint_drag: 'Release to drop – other elements move down automatically', hint_palette: 'Drag onto the grid or tap to append it at the bottom',
    keys: 'Shortcuts', key_move: 'Move', key_resize: 'Resize', key_delete: 'Delete', key_undo: 'Undo', key_dup: 'Duplicate', key_esc: 'Deselect / close',
    tpl_title: 'What should your weather card look like?', tpl_hint: 'Pick a template as a starting point – afterwards you can arrange everything freely. Undo is always available.',
    tpl_compact: 'Compact', tpl_standard: 'Standard', tpl_detailed: 'Detailed', tpl_astro: 'Sun & moon', tpl_weather3d: '3D weather detailed', tpl_dashboard: 'Dashboard page', tpl_empty: 'Start empty',
    tpl_compact_d: 'Current weather and 5 days', tpl_standard_d: 'Weather, wind, humidity, trend, forecast', tpl_detailed_d: 'All measurements, 3D sun, moon, forecasts',
    tpl_astro_d: '3D dome, sun times, moon', tpl_weather3d_d: '3D diorama with weather scene, all values and forecasts', tpl_dashboard_d: 'Complete page using the full width (12 columns)', tpl_empty_d: 'Empty grid, place everything yourself', use_tpl: 'Apply', back: 'Back to layout',
    elements_count: '{n} elements', rows_count: '{n} rows', empty_canvas: 'Drag elements from the palette here',
    yaml_hint: 'Configuration of any card (YAML), e.g. type: entities', none: 'None', invalid_yaml: 'Invalid configuration',
    radius: 'Corner radius', radius_all: 'Corner radius of all elements', inherited: 'From the card settings', inherited_auto: 'Detected automatically',
  },
};

// Beschriftungen der Element-Eigenschaften (f.*) und Auswahlwerte (o.*)
const FWC_F_I18N = {
  de: {
    f: {
      header_text: 'Titel (leer = Ortsname)', show_date: 'Datum anzeigen', show_time: 'Uhrzeit anzeigen', show_condition: 'Wetterzustand anzeigen', align: 'Ausrichtung',
      temp_entity: 'Temperatur-Sensor (optional)', show_feels_like: 'Gefühlte Temperatur', show_minmax: 'Min / Max heute', show_details: 'Details (Feuchte, Wind, Regen)',
      temp_colors: 'Farbe nach Temperatur', animated: 'Animiertes Symbol', temp_metric: 'Wert', show_thermometer: 'Thermometer', decimals: 'Nachkommastellen',
      show_current: 'Aktuelle Temperatur markieren', show_label: 'Bezeichnung anzeigen', hum_entity: 'Feuchte-Sensor (optional)', show_dew_point: 'Taupunkt',
      show_comfort: 'Bewertung (trocken … feucht)', press_entity: 'Luftdruck-Sensor (optional)', press_min: 'Skala von', press_max: 'Skala bis',
      show_weather_label: 'Wetterlage anzeigen', show_press_normal: 'Abweichung vom Normaldruck (1013 hPa)', wind_entity: 'Wind-Sensor (optional)', wind_dir_entity: 'Windrichtungs-Sensor (optional)',
      gust_entity: 'Böen-Sensor (optional)', show_gust: 'Böen', show_beaufort: 'Beaufort', show_side: 'Details neben dem Kompass', vis_entity: 'Sichtweiten-Sensor (optional)',
      precip_entity: 'Niederschlags-Sensor (optional)', precip_mode: 'Menge', hours: 'Stunden', show_bars: 'Balken der nächsten Stunden', show_gauge: 'Regenmesser',
      uv_entity: 'UV-Sensor (optional)', show_hint: 'Schutzhinweis', show_max: 'Maximum heute', show_times: 'Auf- und Untergang', show_track: 'Bahn anzeigen',
      show_moon: 'Nachts Mond anzeigen', weather_overlay: 'Wetter-Effekte (Wolken, Regen …)', show_sun_info: 'Höhe & Azimut', show_day_length: 'Tageslänge',
      show_remaining: 'Verbleibendes Tageslicht', moon_entity: 'Mondphasen-Sensor (optional)', show_next_phase: 'Nächster Voll-/Neumond', days: 'Tage',
      variant: 'Darstellung', show_precip: 'Regenrisiko', show_temp_bars: 'Temperaturbalken', animated_icons: 'Animierte Symbole', step: 'Abstand (Stunden)',
      range: 'Zeitraum', show_precip_bars: 'Niederschlagsbalken', show_values: 'Werte beschriften', show_now: 'Jetzt-Markierung',
      warn_entities: 'Warn-Entitäten (leer = automatisch)', warn_online: 'Online-Warnungen (DWD), wenn keine Entität', warn_max: 'Maximal anzeigen',
      warn_expanded: 'Details sofort aufklappen', hide_when_empty: 'Ausblenden, wenn keine Warnung', show_region: 'Region anzeigen', metric: 'Messwert',
      value_entity: 'Eigener Sensor (optional)', icon: 'Icon', temp_colors_value: 'Farbe nach Temperatur', entity: 'Entität', name: 'Name', tap: 'Antippen',
      url: 'URL (Bild, GIF oder Webseite)', image_mode: 'Art', fit: 'Einpassen', refresh: 'Neu laden alle', card_config: 'Karten-Konfiguration',
      series: 'Kurven', show_temp_line: 'Temperaturkurven (Max / Min)', show_humidity_line: 'Luftfeuchte-Kurve', show_rain_bars: 'Niederschlag als Balken',
      solar_entity: 'Strahlungs-Sensor (optional)', show_curve: 'Tageskurve', show_sum: 'Tagessumme', solar_max: 'Skala bis',
      pollen_entities: 'Pollen-Sensoren (leer = online)', pollen_online: 'Online-Pollendaten (Europa)', hide_zero: 'Nur Pollen mit Belastung', show_tomorrow: 'Morgen anzeigen',
      report_entity: 'Wetterbericht-Sensor (leer = automatisch)', report_attribute: 'Attribut mit dem Text (leer = automatisch)', report_range: 'Zeitraum beim Start',
      show_tabs: 'Umschalter für die Tage', show_headline: 'Schlagzeile', show_meta: 'Quelle / Ausgabezeit',
      radar_provider: 'Radarquelle', zoom: 'Zoomstufe', frames: 'Bilder (je 10 min)', speed: 'Geschwindigkeit pro Bild', map_style: 'Karte',
      show_marker: 'Standort markieren', show_time_radar: 'Uhrzeit anzeigen',
      earth_view: 'Ansicht', earth_speed: 'Drehgeschwindigkeit', earth_zoom: 'Größe / Zoom', earth_radar: 'Niederschlag (Radar)', earth_wind: 'Windströme (Open-Meteo)', earth_night: 'Tag/Nacht mit Stadtlichtern',
      earth_stars: 'Sternenhimmel', earth_drag: 'Mit Maus / Finger drehbar', earth_values: 'Werte anzeigen (Druck, Wind, Feuchte)', earth_quality: 'Bildqualität', map_source: 'Hintergrundkarte', map_key: 'CARTO-API-Key', show_map_labels: 'Ortsnamen anzeigen',
      show_pop: 'Regenwahrscheinlichkeit anzeigen',
      show_scene: 'Wetterszene als Hintergrund', w3d_landscape: 'Insel mit Bäumen & Windrad', w3d_values: 'Werte in der Grafik (Temp., Wind, Feuchte, Druck)', w3d_season: 'Jahreszeit der Bäume', sun_size: 'Größe der Sonne', animate_sun: 'Sonne animieren', dome_island: '3D-Insel in der Kuppel', dome_values: 'Wetterwerte anzeigen (Temp., Wind, Feuchte, Druck)', gauge_view: 'Darstellung', show_tube: 'Messsäule anzeigen', w3d_wind_object: 'Windrad / Windsack', w3d_wind: 'Wind', w3d_humidity: 'Luftfeuchte', w3d_pressure: 'Luftdruck', w3d_precip: 'Niederschlag', w3d_uv: 'UV-Index', w3d_sun: 'Sonnenauf-/untergang', w3d_visibility: 'Sichtweite', w3d_dew: 'Taupunkt', w3d_clouds: 'Bewölkung', w3d_scene: 'Wetterszene im Hintergrund', w3d_temp: 'Temperaturfeld anzeigen', current_display: 'Darstellung', animate_low: 'Min-Linie animieren (laufender Zug)', show_wind_row: 'Wind anzeigen',
      show_hourly_chart: 'Temperaturkurve (Chart)', image_preset: 'Vorlage', windy_overlay: 'Ebene',
      dwd_hint: 'Das Kürzel im Dateinamen (z. B. "PD" in SchilderPD.jpg) an deine Region anpassen.',
      loc_hint: 'Der Standort wird aus den Karteneinstellungen bzw. von Home Assistant übernommen.',
      report_length: 'Textlänge', min_entity: 'Tiefstwert-Sensor (optional)', max_entity: 'Höchstwert-Sensor (optional)', show_minmax_times: 'Uhrzeit von Tiefst-/Höchstwert',
    },
    o: {
      rotate: 'Drehen', home: 'Standort', slow: 'Langsam', medium: 'Mittel', fast: 'Schnell', low: 'Niedrig', normal: 'Normal', high: 'Hoch',
      spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter', ring: 'Ring', column: 'Säule', both: 'Beides', turbine: 'Windrad', windsock: 'Windsack',
      left: 'Links', center: 'Mitte', right: 'Rechts', auto: 'Auto', list: 'Liste', columns: 'Spalten', today: 'Heute', current: 'Aktuell',
      '12': '12 Std.', '24': '24 Std.', '48': '48 Std.', daily: '7 Tage', image: 'Bild', iframe: 'Webseite', cover: 'Füllen', contain: 'Ganz zeigen',
      'more-info': 'Details', toggle: 'Schalten', none: 'Nichts', temperature: 'Temperatur', apparent_temperature: 'Gefühlt', dew_point: 'Taupunkt',
      temperature_humidity: 'Temp. + Feuchte', short: 'Kurz', long: 'Ausführlich', esri: 'Esri', osm: 'OSM', carto: 'CARTO',
      icon: 'Symbol', scene: 'Wetterszene', custom: 'Eigene URL', windy: 'Windy (Wetterkarte)', wetteronline: 'WetterOnline Radar',
      radarfilm_de: 'Radarfilm Deutschland (GIF)', dwd_warnings: 'DWD-Warnkarte', temp: 'Temperatur', rain: 'Regen', wind: 'Wind', clouds: 'Wolken', pressure: 'Luftdruck', tomorrow: 'Morgen', day3: 'Übermorgen', all: 'Alles', rainviewer: 'RainViewer', dwd: 'DWD', light: 'Hell', dark: 'Dunkel',
    },
  },
  en: {
    f: {
      header_text: 'Title (empty = location name)', show_date: 'Show date', show_time: 'Show time', show_condition: 'Show condition', align: 'Alignment',
      temp_entity: 'Temperature sensor (optional)', show_feels_like: 'Feels like', show_minmax: 'Min / max today', show_details: 'Details (humidity, wind, rain)',
      temp_colors: 'Color by temperature', animated: 'Animated icon', temp_metric: 'Value', show_thermometer: 'Thermometer', decimals: 'Decimals',
      show_current: 'Mark current temperature', show_label: 'Show label', hum_entity: 'Humidity sensor (optional)', show_dew_point: 'Dew point',
      show_comfort: 'Rating (dry … humid)', press_entity: 'Pressure sensor (optional)', press_min: 'Scale from', press_max: 'Scale to',
      show_weather_label: 'Show weather tendency', show_press_normal: 'Difference to normal pressure (1013 hPa)', wind_entity: 'Wind sensor (optional)', wind_dir_entity: 'Wind direction sensor (optional)',
      gust_entity: 'Gust sensor (optional)', show_gust: 'Gusts', show_beaufort: 'Beaufort', show_side: 'Details next to the compass', vis_entity: 'Visibility sensor (optional)',
      precip_entity: 'Precipitation sensor (optional)', precip_mode: 'Amount', hours: 'Hours', show_bars: 'Bars for the next hours', show_gauge: 'Rain gauge',
      uv_entity: 'UV sensor (optional)', show_hint: 'Protection hint', show_max: 'Maximum today', show_times: 'Rise and set', show_track: 'Show path',
      show_moon: 'Show moon at night', weather_overlay: 'Weather effects (clouds, rain …)', show_sun_info: 'Elevation & azimuth', show_day_length: 'Day length',
      show_remaining: 'Remaining daylight', moon_entity: 'Moon phase sensor (optional)', show_next_phase: 'Next full / new moon', days: 'Days',
      variant: 'Layout', show_precip: 'Chance of rain', show_temp_bars: 'Temperature bars', animated_icons: 'Animated icons', step: 'Step (hours)',
      range: 'Range', show_precip_bars: 'Precipitation bars', show_values: 'Label values', show_now: 'Now marker',
      warn_entities: 'Warning entities (empty = automatic)', warn_online: 'Online warnings (DWD) if no entity', warn_max: 'Show at most',
      warn_expanded: 'Expand details', hide_when_empty: 'Hide when there is no warning', show_region: 'Show region', metric: 'Measurement',
      value_entity: 'Own sensor (optional)', icon: 'Icon', temp_colors_value: 'Color by temperature', entity: 'Entity', name: 'Name', tap: 'Tap',
      url: 'URL (image, GIF or web page)', image_mode: 'Type', fit: 'Fit', refresh: 'Reload every', card_config: 'Card configuration',
      series: 'Curves', show_temp_line: 'Temperature curves (max / min)', show_humidity_line: 'Humidity curve', show_rain_bars: 'Precipitation as bars',
      solar_entity: 'Radiation sensor (optional)', show_curve: 'Day curve', show_sum: 'Day total', solar_max: 'Scale to',
      pollen_entities: 'Pollen sensors (empty = online)', pollen_online: 'Online pollen data (Europe)', hide_zero: 'Only pollen with load', show_tomorrow: 'Show tomorrow',
      report_entity: 'Weather report sensor (empty = automatic)', report_attribute: 'Attribute with the text (empty = automatic)', report_range: 'Initial range',
      show_tabs: 'Day switcher', show_headline: 'Headline', show_meta: 'Source / issue time',
      radar_provider: 'Radar source', zoom: 'Zoom level', frames: 'Frames (10 min each)', speed: 'Speed per frame', map_style: 'Map',
      show_marker: 'Mark location', show_time_radar: 'Show time',
      earth_view: 'View', earth_speed: 'Rotation speed', earth_zoom: 'Size / zoom', earth_radar: 'Precipitation (radar)', earth_wind: 'Wind streams (Open-Meteo)', earth_night: 'Day/night with city lights',
      earth_stars: 'Starry sky', earth_drag: 'Turn with mouse / finger', earth_values: 'Show values (pressure, wind, humidity)', earth_quality: 'Image quality', map_source: 'Background map', map_key: 'CARTO API key', show_map_labels: 'Show place names',
      show_pop: 'Show rain probability',
      show_scene: 'Weather scene as background', w3d_landscape: 'Island with trees & wind turbine', w3d_values: 'Values in the graphic (temp., wind, humidity, pressure)', w3d_season: 'Season of the trees', sun_size: 'Sun size', animate_sun: 'Animate sun', dome_island: '3D island in the dome', dome_values: 'Show weather values (temp., wind, humidity, pressure)', gauge_view: 'Display', show_tube: 'Show gauge column', w3d_wind_object: 'Wind turbine / windsock', w3d_wind: 'Wind', w3d_humidity: 'Humidity', w3d_pressure: 'Air pressure', w3d_precip: 'Precipitation', w3d_uv: 'UV index', w3d_sun: 'Sunrise / sunset', w3d_visibility: 'Visibility', w3d_dew: 'Dew point', w3d_clouds: 'Cloud cover', w3d_scene: 'Weather scene in the background', w3d_temp: 'Show temperature panel', current_display: 'Display', animate_low: 'Animate low line (moving train)', show_wind_row: 'Show wind',
      show_hourly_chart: 'Temperature curve (chart)', image_preset: 'Preset', windy_overlay: 'Layer',
      dwd_hint: 'Adjust the code in the file name (e.g. "PD" in SchilderPD.jpg) to your region.',
      loc_hint: 'The location is taken from the card settings or from Home Assistant.',
      report_length: 'Text length', min_entity: 'Low sensor (optional)', max_entity: 'High sensor (optional)', show_minmax_times: 'Time of low / high',
    },
    o: {
      rotate: 'Rotate', home: 'Location', slow: 'Slow', medium: 'Medium', fast: 'Fast', low: 'Low', normal: 'Normal', high: 'High',
      spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter', ring: 'Ring', column: 'Column', both: 'Both', turbine: 'Wind turbine', windsock: 'Windsock',
      left: 'Left', center: 'Center', right: 'Right', auto: 'Auto', list: 'List', columns: 'Columns', today: 'Today', current: 'Current',
      '12': '12 h', '24': '24 h', '48': '48 h', daily: '7 days', image: 'Image', iframe: 'Web page', cover: 'Fill', contain: 'Fit whole',
      'more-info': 'Details', toggle: 'Toggle', none: 'Nothing', temperature: 'Temperature', apparent_temperature: 'Feels like', dew_point: 'Dew point',
      temperature_humidity: 'Temp. + humidity', short: 'Short', long: 'Detailed', esri: 'Esri', osm: 'OSM', carto: 'CARTO',
      icon: 'Icon', scene: 'Weather scene', custom: 'Own URL', windy: 'Windy (weather map)', wetteronline: 'WetterOnline radar',
      radarfilm_de: 'Radar loop Germany (GIF)', dwd_warnings: 'DWD warning map', temp: 'Temperature', rain: 'Rain', wind: 'Wind', clouds: 'Clouds', pressure: 'Pressure', tomorrow: 'Tomorrow', day3: 'Day after', all: 'All', rainviewer: 'RainViewer', dwd: 'DWD', light: 'Light', dark: 'Dark',
    },
  },
};

(() => {
  const clone = (o) => JSON.parse(JSON.stringify(o || {}));
  const L = FWC_LAYOUT;
  const WIDTHS = { s: 360, m: 480, l: 640, xl: 900, xxl: 1280, x3: 1600 };
  const WIDTH_ICONS = { s: 'mdi:cellphone', m: 'mdi:tablet', l: 'mdi:monitor', xl: 'mdi:monitor-screenshot', xxl: 'mdi:monitor-dashboard', x3: 'mdi:television' };
  const ZOOMS = [0.25, 0.33, 0.5, 0.6, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5];
  const widthKey = (px) => {
    const n = Number(px);
    if (!n) return null;
    return Object.keys(WIDTHS).reduce((a, b) => (Math.abs(WIDTHS[b] - n) < Math.abs(WIDTHS[a] - n) ? b : a), 'm');
  };
  const PRIMARY = {
    current: 'temperature', weather3d: 'temperature', earth: 'temperature', temperature: null, humidity: 'humidity', pressure: 'pressure', wind: 'wind_speed', visibility: 'visibility', uv: 'uv_index',
  };

  class FlexibleWeatherCardDesigner extends LitElement {
    static get properties() {
      return {
        hass: { attribute: false },
        cardConfig: { attribute: false },
        _cfg: { state: true },
        _sel: { state: true },
        _preview: { state: true },
        _dragId: { state: true },
        _pghost: { state: true },
        _histLen: { state: true },
        _step: { state: true },
        _width: { state: true },
        _zoom: { state: true },
        _canvasW: { state: true },
        _search: { state: true },
        _tpl: { state: true },
        _yamlError: { state: true },
      };
    }

    constructor() {
      super();
      this._history = [];
      this._histLen = 0;
      this._sel = null;
      this._preview = null;
      this._width = 'm';
      this._zoom = 'fit';
      try { const z = localStorage.getItem('fwc-designer-zoom'); if (z) this._zoom = z === 'fit' ? 'fit' : Number(z) || 'fit'; } catch (e) { /* kein Speicher */ }
      this._canvasW = 0;
      this._onWheel = this._onWheel.bind(this);
      this._search = '';
      this._tpl = 'standard';
      this._onWinMove = this._onWinMove.bind(this);
      this._onWinUp = this._onWinUp.bind(this);
    }

    /* --- Sprache ---------------------------------------------------------------------------- */
    get _lang() { return fwcLang(this.hass, this.cardConfig); }
    _d(key, vars) {
      const dict = FWC_D_I18N[this._lang] || FWC_D_I18N.en;
      let v = dict[key] !== undefined ? dict[key] : (FWC_D_I18N.en[key] !== undefined ? FWC_D_I18N.en[key] : key);
      if (vars) Object.keys(vars).forEach(k => { v = v.replace(`{${k}}`, vars[k]); });
      return v;
    }
    _f(key) {
      const d = FWC_F_I18N[this._lang] || FWC_F_I18N.en;
      const k = key.replace(/^f\./, '');
      return d.f[k] || FWC_F_I18N.en.f[k] || k;
    }
    _o(field, value) {
      if (field === 'metric' || field === 'temp_metric') return this._t(`metric.${value}`);
      const d = FWC_F_I18N[this._lang] || FWC_F_I18N.en;
      return d.o[value] || FWC_F_I18N.en.o[value] || String(value);
    }
    get _t() { return fwcT(this._lang); }

    /* --- Lebenszyklus ----------------------------------------------------------------------- */
    willUpdate() {
      if (this._cfg === undefined && this.cardConfig) {
        const c = fwcMigrate(clone(this.cardConfig));
        c.columns = Number(c.columns) || FWC_DEFAULTS.columns;
        c.elements = (c.elements || []).map(e => L.normalize({ ...e, id: e.id || `${e.type}_${FWC_U.uid().slice(0, 4)}` }, c.columns));
        this._cfg = c;
        // zuletzt verwendete Vorschaubreite der Card wieder verwenden
        if (c.design_width) this._width = widthKey(c.design_width) || this._width;
        else if (c.columns > 6) this._width = 'xl';
        this._step = c.elements.length ? 'edit' : 'templates';
      }
      if (this.hass && this.hass.themes && this.hass.themes.darkMode === false) this.setAttribute('data-light', '');
      else this.removeAttribute('data-light');
    }

    firstUpdated() {
      const dlg = this.renderRoot.querySelector('dialog');
      if (dlg && typeof dlg.showModal === 'function') {
        try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
      } else if (dlg) dlg.setAttribute('open', '');
      if (window.innerWidth < 560 && !(this._cfg && this._cfg.design_width)) this._width = 's';
    }

    updated() {
      // Breite der Arbeitsfläche messen (für „Einpassen“) und Strg + Mausrad zum Zoomen
      const cv = this.renderRoot.querySelector('.canvas');
      if (cv && cv !== this._cvEl) {
        if (this._cvRo) this._cvRo.disconnect();
        if (this._cvEl) this._cvEl.removeEventListener('wheel', this._onWheel);
        this._cvEl = cv;
        cv.addEventListener('wheel', this._onWheel, { passive: false });
        if (typeof ResizeObserver !== 'undefined') {
          this._cvRo = new ResizeObserver((en) => { const w = Math.round(en[0].contentRect.width); if (w !== this._canvasW) this._canvasW = w; });
          this._cvRo.observe(cv);
        }
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._cvRo) { this._cvRo.disconnect(); this._cvRo = null; }
      if (this._cvEl) { this._cvEl.removeEventListener('wheel', this._onWheel); this._cvEl = null; }
      window.removeEventListener('pointermove', this._onWinMove);
      window.removeEventListener('pointerup', this._onWinUp);
      window.removeEventListener('pointercancel', this._onWinUp);
    }

    /* --- Zustand ---------------------------------------------------------------------------- */
    get _cols() { return Math.max(1, Number(this._cfg.columns) || FWC_DEFAULTS.columns); }
    get _els() { return this._cfg.elements || []; }
    _el(id) { return this._els.find(e => e.id === id); }

    _snapshot() { return JSON.stringify(this._cfg); }

    _commit(cfg, history = true) {
      if (history) {
        this._history.push(this._snapshot());
        if (this._history.length > 80) this._history.shift();
        this._histLen = this._history.length;
      }
      this._cfg = cfg;
      this.dispatchEvent(new CustomEvent('fwc-config-changed', { detail: { config: clone(cfg) }, bubbles: true, composed: true }));
    }

    _setElements(elements, history = true) {
      this._commit({ ...this._cfg, elements }, history);
    }

    _patchCfg(patch, history = true) {
      const c = { ...this._cfg, ...patch };
      Object.keys(patch).forEach((k) => { if (patch[k] === undefined || patch[k] === '') delete c[k]; });
      this._commit(c, history);
    }

    _patchEl(id, patch, history = true) {
      const els = this._els.map((e) => {
        if (e.id !== id) return e;
        const n = { ...e, ...patch };
        Object.keys(patch).forEach((k) => { if (patch[k] === undefined || patch[k] === '' || (Array.isArray(patch[k]) && !patch[k].length)) delete n[k]; });
        return n;
      });
      const geo = ['x', 'y', 'w', 'h'].some(k => k in patch);
      this._setElements(geo ? L.resolve(els, id, this._cols) : els, history);
    }

    _undo() {
      if (!this._history.length) return;
      this._cfg = JSON.parse(this._history.pop());
      this._histLen = this._history.length;
      if (this._sel && !this._el(this._sel)) this._sel = null;
      this._commit(this._cfg, false);
    }

    _close() {
      const dlg = this.renderRoot.querySelector('dialog');
      if (dlg && dlg.open && typeof dlg.close === 'function') dlg.close();
      this.dispatchEvent(new CustomEvent('designer-closed', { bubbles: true, composed: true }));
    }

    /* --- Vorschaubreite & Zoom -------------------------------------------------------------- */
    _setWidth(w) {
      this._width = w;
      // Breite in der Card merken: wird beim nächsten Öffnen wieder verwendet und dient als Bezug für die Darstellung
      if (this._cfg && Number(this._cfg.design_width) !== WIDTHS[w]) this._patchCfg({ design_width: WIDTHS[w] }, false);
    }
    get _fitZoom() {
      const w = WIDTHS[this._width] || WIDTHS.m;
      const avail = (this._canvasW || 0) - 8;
      return avail > 100 ? Math.min(1, avail / w) : 1;
    }
    get _zoomVal() { return this._zoom === 'fit' ? this._fitZoom : FWC_U.clamp(Number(this._zoom) || 1, 0.25, 1.5); }
    _setZoom(z) {
      this._zoom = z;
      try { localStorage.setItem('fwc-designer-zoom', String(z)); } catch (e) { /* kein Speicher */ }
    }
    _stepZoom(dir) {
      const cur = this._zoomVal;
      const next = dir > 0 ? ZOOMS.find(z => z > cur + 0.001) : [...ZOOMS].reverse().find(z => z < cur - 0.001);
      if (next) this._setZoom(next);
    }
    _onWheel(ev) {
      if (!(ev.ctrlKey || ev.metaKey) || this._step === 'templates') return;
      ev.preventDefault();
      const now = Date.now();
      if (this._wheelAt && now - this._wheelAt < 90) return;
      this._wheelAt = now;
      this._stepZoom(ev.deltaY < 0 ? 1 : -1);
    }

    /* --- Aktionen --------------------------------------------------------------------------- */
    _add(type, pos) {
      const el = FWC_EL.create(type, this._cols);
      const spot = pos || L.freeSpot(this._els, el.w, el.h, this._cols);
      el.x = spot.x; el.y = spot.y;
      this._setElements(L.resolve([...this._els, el], el.id, this._cols));
      this._sel = el.id;
      this.updateComplete.then(() => this._scrollToSel());
    }

    _duplicate(id) {
      const src = this._el(id);
      if (!src) return;
      const el = { ...clone(src), id: `${src.type}_${FWC_U.uid().slice(0, 4)}`, y: src.y + src.h };
      this._setElements(L.resolve([...this._els, el], el.id, this._cols));
      this._sel = el.id;
      this.updateComplete.then(() => this._scrollToSel());
    }

    _delete(id) {
      this._setElements(this._els.filter(e => e.id !== id));
      if (this._sel === id) this._sel = null;
    }

    // Spaltenzahl ändern: Positionen und Breiten proportional umrechnen
    _setColumns(n) {
      n = Math.max(1, Math.min(24, Math.round(n)));
      const old = this._cols;
      if (n === old) return;
      const f = n / old;
      const scaled = this._els.map((e) => {
        const def = FWC_EL.TYPES[e.type] || { minW: 1 };
        const w = Math.max(Math.min(def.minW || 1, n), Math.min(n, Math.round(e.w * f)));
        return { ...e, x: Math.min(n - w, Math.round(e.x * f)), w };
      });
      const sorted = [...scaled].sort((a, b) => (a.y - b.y) || (a.x - b.x));
      let out = sorted;
      sorted.forEach((e) => { out = L.resolve(out, e.id, n); });
      this._commit({ ...this._cfg, columns: n, elements: L.compact(out, n) });
    }

    _applyTemplate(name) {
      const els = name === 'empty' ? [] : fwcTemplate(name);
      const own = FWC_TEMPLATE_COLS[name];
      if (own) {
        // Vorlage mit eigener Spaltenzahl (z. B. Dashboard-Seite): Raster und Vorschaubreite passend setzen
        const extra = FWC_TEMPLATE_CFG[name] || {};
        this._commit({ ...this._cfg, ...extra, columns: own, elements: L.compact(els.map(e => L.normalize(e, own)), own) });
        if (extra.design_width) this._width = widthKey(extra.design_width) || this._width;
        else if (own > 6 && WIDTHS[this._width] < 900) this._setWidth('xl');
      } else {
        const cols = this._cols;
        const scaled = cols === 6 ? els : els.map(e => ({ ...e, x: Math.round(e.x * cols / 6), w: Math.max(1, Math.round(e.w * cols / 6)) }));
        this._setElements(L.compact(scaled.map(e => L.normalize(e, cols)), cols));
      }
      this._sel = null;
      this._step = 'edit';
    }

    _scrollToSel() {
      const card = this._card();
      const cell = card && card.shadowRoot && card.shadowRoot.querySelector(`[data-fwc-cell="${this._sel}"]`);
      if (cell && cell.scrollIntoView) cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* --- Geometrie -------------------------------------------------------------------------- */
    _card() { return this.renderRoot.querySelector('flexible-weather-card'); }

    _geom() {
      const card = this._card();
      const grid = card && card.shadowRoot && card.shadowRoot.querySelector('.fwc-grid');
      if (!grid) return null;
      const r = grid.getBoundingClientRect();
      const cols = this._cols;
      // Zoom der Vorschau: sichtbare Größe / Layoutgröße
      const z = grid.offsetWidth ? r.width / grid.offsetWidth : 1;
      const gap = Math.max(0, Number(this._cfg.gap ?? FWC_DEFAULTS.gap)) * z;
      const rowH = Math.max(20, Number(this._cfg.row_height) || FWC_DEFAULTS.row_height) * z;
      const colW = (r.width - gap * (cols - 1)) / cols;
      return { r, cols, gap, rowH, colW };
    }

    _cellAt(ev, g) {
      const x = ev.clientX - g.r.left;
      const y = ev.clientY - g.r.top;
      return {
        cx: Math.floor((x + g.gap / 2) / (g.colW + g.gap)),
        cy: Math.floor((y + g.gap / 2) / (g.rowH + g.gap)),
        inside: x >= -12 && y >= -12 && x <= g.r.width + 12 && y <= g.r.height + 12,
      };
    }

    /* --- Ziehen auf der Arbeitsfläche ------------------------------------------------------- */
    _onCanvasDown(ev) {
      if (ev.button !== undefined && ev.button !== 0) return;
      const path = ev.composedPath();
      const handle = path.find(n => n && n.dataset && n.dataset.fwcHandle);
      const cover = path.find(n => n && n.dataset && n.dataset.fwcId);
      const g = this._geom();
      if (!g) return;
      if (!handle && !cover) {
        // Klick ins Leere: Auswahl aufheben
        this._sel = null;
        return;
      }
      ev.preventDefault();
      const id = handle ? handle.dataset.fwcHandle : cover.dataset.fwcId;
      const el = this._el(id);
      if (!el) return;
      this._sel = id;
      // Griffpunkt in Pixeln relativ zur linken oberen Ecke des Elements (bzw. zur rechten unteren beim Vergrößern)
      const sx = g.colW + g.gap, sy = g.rowH + g.gap;
      const px = ev.clientX - g.r.left, py = ev.clientY - g.r.top;
      this._drag = {
        kind: handle ? 'resize' : 'move', id, x0: ev.clientX, y0: ev.clientY, moved: false,
        grabX: handle ? px - (el.x + el.w) * sx : px - el.x * sx,
        grabY: handle ? py - (el.y + el.h) * sy : py - el.y * sy,
        cur: handle ? { x: el.x + el.w, y: el.y + el.h } : { x: el.x, y: el.y },
        base: clone(this._els), last: null,
      };
      this._listen();
      const canvas = this.renderRoot.querySelector('.canvas');
      if (canvas) canvas.focus({ preventScroll: true });
    }

    _listen() {
      window.addEventListener('pointermove', this._onWinMove);
      window.addEventListener('pointerup', this._onWinUp);
      window.addEventListener('pointercancel', this._onWinUp);
    }

    _autoScroll(ev) {
      const canvas = this.renderRoot.querySelector('.canvas');
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      if (ev.clientY < r.top + 40) canvas.scrollTop -= 14;
      else if (ev.clientY > r.bottom - 40) canvas.scrollTop += 14;
    }

    _onWinMove(ev) {
      const d = this._drag;
      const p = this._pdrag;
      if (p) { this._movePalette(ev); return; }
      if (!d) return;
      if (!d.moved && Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 5) return;
      d.moved = true;
      this._dragId = d.id;
      this._autoScroll(ev);
      const g = this._geom();
      if (!g) return;
      const el = d.base.find(e => e.id === d.id);
      const def = FWC_EL.TYPES[el.type] || { minW: 1, minH: 1 };
      // Position in (Bruchteilen von) Rasterzellen; ein neues Feld gilt erst, wenn man deutlich über die Mitte hinaus
      // gezogen hat (Hysterese) – so springt das Element an Kanten nicht hin und her
      const sx = g.colW + g.gap, sy = g.rowH + g.gap;
      const rawX = (ev.clientX - g.r.left - d.grabX) / sx, rawY = (ev.clientY - g.r.top - d.grabY) / sy;
      const snap = (raw, prev) => (Math.abs(raw - prev) < 0.68 ? prev : Math.round(raw));
      d.cur = { x: snap(rawX, d.cur.x), y: snap(rawY, d.cur.y) };
      let next;
      let swap = null;
      if (d.kind === 'move') {
        next = { x: FWC_U.clamp(d.cur.x, 0, g.cols - el.w), y: Math.max(0, d.cur.y), w: el.w, h: el.h };
        // Gleich großes Element getroffen -> Plätze tauschen statt nach unten schieben
        const hit = d.base.filter(e => e.id !== d.id && L.overlap(e, next));
        if (hit.length === 1 && hit[0].w === el.w && hit[0].h === el.h && (hit[0].x !== el.x || hit[0].y !== el.y)) {
          const o = hit[0];
          const covered = Math.max(0, Math.min(o.x + o.w, next.x + next.w) - Math.max(o.x, next.x)) * Math.max(0, Math.min(o.y + o.h, next.y + next.h) - Math.max(o.y, next.y));
          if (covered >= (o.w * o.h) / 2) { next = { ...next, x: o.x, y: o.y }; swap = { id: o.id, x: el.x, y: el.y }; }
        }
      } else {
        next = {
          x: el.x, y: el.y,
          w: FWC_U.clamp(d.cur.x - el.x, Math.min(def.minW || 1, g.cols - el.x), g.cols - el.x),
          h: Math.max(def.minH || 1, d.cur.y - el.y),
        };
      }
      const key = `${next.x}|${next.y}|${next.w}|${next.h}|${swap ? swap.id : ''}`;
      if (key === d.last) return;
      d.last = key;
      const moved = d.base.map((e) => {
        if (e.id === d.id) return { ...e, ...next };
        if (swap && e.id === swap.id) return { ...e, x: swap.x, y: swap.y };
        return e;
      });
      this._preview = L.resolve(moved, d.id, g.cols);
    }

    _onWinUp() {
      window.removeEventListener('pointermove', this._onWinMove);
      window.removeEventListener('pointerup', this._onWinUp);
      window.removeEventListener('pointercancel', this._onWinUp);
      if (this._pdrag) { this._dropPalette(); return; }
      const d = this._drag;
      this._drag = null;
      this._dragId = null;
      if (d && d.moved && this._preview) this._setElements(this._preview);
      this._preview = null;
    }

    /* --- Ziehen aus der Palette ------------------------------------------------------------- */
    _onPaletteDown(ev, type) {
      if (ev.button !== undefined && ev.button !== 0) return;
      ev.preventDefault();
      this._pdrag = { type, x0: ev.clientX, y0: ev.clientY, moved: false, base: clone(this._els), el: FWC_EL.create(type, this._cols), last: null };
      this._listen();
    }

    _movePalette(ev) {
      const p = this._pdrag;
      if (!p.moved && Math.hypot(ev.clientX - p.x0, ev.clientY - p.y0) < 6) return;
      p.moved = true;
      const g = this._geom();
      const c = g ? this._cellAt(ev, g) : null;
      const over = !!c && c.inside;
      this._pghost = { type: p.type, x: ev.clientX, y: ev.clientY, over };
      if (over) {
        this._autoScroll(ev);
        const w = Math.min(p.el.w, g.cols);
        const x = FWC_U.clamp(c.cx - Math.floor(w / 2), 0, g.cols - w);
        const y = Math.max(0, c.cy);
        const key = `${x}|${y}`;
        if (key !== p.last) {
          p.last = key;
          this._preview = L.resolve([...p.base, { ...p.el, x, y, w }], p.el.id, g.cols);
          this._dragId = p.el.id;
        }
      } else if (p.last) {
        p.last = null;
        this._preview = null;
        this._dragId = null;
      }
    }

    _dropPalette() {
      const p = this._pdrag;
      this._pdrag = null;
      this._pghost = null;
      this._dragId = null;
      if (!p.moved) { this._preview = null; this._add(p.type); return; }
      if (this._preview) {
        this._setElements(this._preview);
        this._sel = p.el.id;
      }
      this._preview = null;
    }

    /* --- Tastatur --------------------------------------------------------------------------- */
    _onKey(ev) {
      const t = ev.composedPath()[0] || {};
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable || (t.closest && t.closest('ha-selector, ha-yaml-editor, ha-code-editor'));
      if (typing) { ev.stopPropagation(); return; }
      const mod = ev.ctrlKey || ev.metaKey;
      const el = this._sel && this._el(this._sel);
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (mod && (ev.key === '+' || ev.key === '=' || ev.key === '-' || ev.key === '0')) {
        ev.preventDefault();
        if (ev.key === '0') this._setZoom('fit'); else this._stepZoom(ev.key === '-' ? -1 : 1);
      } else if (mod && (ev.key === 'z' || ev.key === 'Z')) { ev.preventDefault(); this._undo(); } else if (el && arrows[ev.key]) {
        ev.preventDefault();
        const [dx, dy] = arrows[ev.key];
        const def = FWC_EL.TYPES[el.type] || {};
        if (ev.shiftKey) this._patchEl(el.id, { w: FWC_U.clamp(el.w + dx, def.minW || 1, this._cols - el.x), h: Math.max(def.minH || 1, el.h + dy) });
        else this._patchEl(el.id, { x: FWC_U.clamp(el.x + dx, 0, this._cols - el.w), y: Math.max(0, el.y + dy) });
      } else if (el && (ev.key === 'Delete' || ev.key === 'Backspace')) { ev.preventDefault(); this._delete(el.id); } else if (el && mod && (ev.key === 'd' || ev.key === 'D')) { ev.preventDefault(); this._duplicate(el.id); }
      ev.stopPropagation();
    }

    _onCancel(ev) {
      ev.preventDefault();
      if (this._step === 'templates' && this._els.length) { this._step = 'edit'; return; }
      if (this._sel) { this._sel = null; return; }
      this._close();
    }

    /* --- Rendern: Felder ------------------------------------------------------------------- */
    _toggle(label, checked, onChange) {
      return html`<label class="toggle"><span>${label}</span><input type="checkbox" .checked=${!!checked} @change=${e => onChange(e.target.checked)}><span class="knob"></span></label>`;
    }

    _number(label, value, min, max, step, onChange, unit = '') {
      const set = (v) => { const n = Number(v); if (isFinite(n)) onChange(FWC_U.clamp(n, min, max)); };
      return html`<div class="field"><span>${label}</span>
        <div class="num">
          <button class="nb" @click=${() => set((Number(value) || 0) - step)} ?disabled=${Number(value) <= min}><ha-icon icon="mdi:minus"></ha-icon></button>
          <input type="number" .value=${String(value ?? '')} min=${min} max=${max} step=${step} @change=${e => set(e.target.value)}>
          ${unit ? html`<em>${unit}</em>` : ''}
          <button class="nb" @click=${() => set((Number(value) || 0) + step)} ?disabled=${Number(value) >= max}><ha-icon icon="mdi:plus"></ha-icon></button>
        </div></div>`;
    }

    _seg(options, value, onChange, small = false) {
      return html`<div class="seg ${small ? 'small' : ''}">${options.map(([v, label]) => html`<button class="${v === value ? 'on' : ''}" @click=${() => onChange(v)}>${label}</button>`)}</div>`;
    }

    _entityField(label, value, onChange, filter = {}, multiple = false, inherited = null) {
      const sel = customElements.get('ha-selector');
      const f = {};
      if (filter.domain) f.domain = filter.domain;
      if (filter.device_class) f.device_class = filter.device_class;
      const selector = { entity: { ...(Object.keys(f).length ? { filter: f } : {}), ...(multiple ? { multiple: true } : {}) } };
      const empty = !value || (Array.isArray(value) && !value.length);
      const shown = empty && inherited && (!Array.isArray(inherited) || inherited.length) ? inherited : value;
      const inh = empty && shown && shown !== value;
      return html`<div class="field ${inh ? 'inherited' : ''}"><span>${label}</span>
        ${sel ? html`<ha-selector .hass=${this.hass} .selector=${selector} .value=${shown || (multiple ? [] : '')} @value-changed=${(e) => { e.stopPropagation(); onChange(e.detail.value); }}></ha-selector>`
        : html`<input type="text" .value=${multiple ? (value || []).join(', ') : (value || '')} placeholder="sensor.…" @change=${(e) => {
          const v = e.target.value.trim();
          onChange(multiple ? v.split(',').map(s => s.trim()).filter(Boolean) : v);
        }}>`}
        ${inh ? html`<em class="hint"><ha-icon icon="mdi:link-variant"></ha-icon>${this._d(filter.inheritAuto ? 'inherited_auto' : 'inherited')}</em>` : ''}
      </div>`;
    }

    _renderField(el, f) {
      const label = this._f(f.label);
      const val = el[f.key];
      const set = (v) => this._patchEl(el.id, { [f.key]: v, ...(f.apply ? f.apply(v, el) : {}) });
      switch (f.type) {
        case 'entity': return this._entityField(label, val, v => set(v || undefined), f, false, f.inherit ? f.inherit(el, this._cfg, this.hass) : null);
        case 'entities': return this._entityField(label, val, v => set(Array.isArray(v) && v.length ? v : undefined), f, true, f.inherit ? f.inherit(el, this._cfg, this.hass) : null);
        case 'bool': return this._toggle(label, val === undefined ? f.def !== false : val, v => set(v));
        case 'number': return this._number(label, val ?? f.def ?? '', f.min, f.max, f.step || 1, v => set(v), f.unit);
        case 'select': {
          const opts = f.options.map(o => [o, this._o(f.key === 'metric' && el.type === 'temperature' ? 'temp_metric' : f.key, o)]);
          const cur = val ?? f.def;
          if (opts.length <= 4 && opts.every(o => String(o[1]).length < 14)) return html`<div class="field"><span>${label}</span>${this._seg(opts, cur, v => set(v), true)}</div>`;
          return html`<div class="field"><span>${label}</span><select @change=${e => set(e.target.value)}>${opts.map(([v, l]) => html`<option value=${v} ?selected=${v === cur}>${l}</option>`)}</select></div>`;
        }
        case 'hint': return html`<div class="field"><em class="hint"><ha-icon icon="mdi:information-outline"></ha-icon>${label}</em></div>`;
        case 'text': return html`<div class="field"><span>${label}</span><input type="text" .value=${val || ''} placeholder=${f.placeholder || ''} @change=${e => set(e.target.value.trim() || undefined)}></div>`;
        case 'yaml': {
          const ed = customElements.get('ha-yaml-editor');
          return html`<div class="field"><span>${label}</span>
            ${ed ? html`<ha-yaml-editor .hass=${this.hass} .defaultValue=${val || {}} @value-changed=${(e) => {
              e.stopPropagation();
              if (e.detail.isValid === false) { this._yamlError = true; return; }
              this._yamlError = false;
              const v = e.detail.value;
              if (v && typeof v === 'object' && v.type) set(v);
            }}></ha-yaml-editor>`
            : html`<textarea rows="8" .value=${val ? JSON.stringify(val, null, 2) : ''} @change=${(e) => {
              try { const v = JSON.parse(e.target.value); this._yamlError = false; set(v); } catch (er) { this._yamlError = true; }
            }}></textarea>`}
            <em class="hint">${this._yamlError ? this._d('invalid_yaml') : this._d('yaml_hint')}</em></div>`;
        }
        default: return '';
      }
    }

    /* --- Rendern: Eigenschaften ------------------------------------------------------------- */
    _renderCardProps() {
      const c = this._cfg;
      const els = this._els;
      return html`
        <div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:grid"></ha-icon>${this._d('grid')}</div>
          ${this._number(this._d('columns'), this._cols, 1, 24, 1, v => this._setColumns(v))}
          <div class="two">
            ${this._number(this._d('row_height'), c.row_height ?? FWC_DEFAULTS.row_height, 32, 120, 4, v => this._patchCfg({ row_height: v === FWC_DEFAULTS.row_height ? undefined : v }), 'px')}
            ${this._number(this._d('gap'), c.gap ?? FWC_DEFAULTS.gap, 0, 32, 2, v => this._patchCfg({ gap: v === FWC_DEFAULTS.gap ? undefined : v }), 'px')}
          </div>
          ${this._number(this._d('padding'), c.padding ?? FWC_DEFAULTS.padding, 0, 32, 2, v => this._patchCfg({ padding: v === FWC_DEFAULTS.padding ? undefined : v }), 'px')}
        </div>
        <div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:palette-outline"></ha-icon>${this._d('appearance')}</div>
          <div class="field"><span>${this._d('tile_style')}</span>
            ${this._seg([['tile', this._d('style_tile')], ['outline', this._d('style_outline')], ['flat', this._d('style_flat')]], c.tile_style || 'tile', v => this._patchCfg({ tile_style: v === 'tile' ? undefined : v }), true)}</div>
          <div class="field"><span>${this._d('background')}</span>
            ${this._seg([['card', this._d('bg_card')], ['transparent', this._d('bg_transparent')]], c.card_style || 'card', v => this._patchCfg({ card_style: v === 'card' ? undefined : v }), true)}</div>
          <div class="field"><span>${this._d('radius_all')}</span>
            <div class="color-row">${this._number('', c.element_radius ?? '', 0, 40, 2, v => this._patchCfg({ element_radius: v }), 'px')}
            <button class="btn small ${c.element_radius === undefined ? 'on' : ''}" @click=${() => this._patchCfg({ element_radius: undefined })}>${this._d('auto')}</button></div></div>
          <div class="field"><span>${this._d('font_scale')} <em>${Math.round((c.font_scale || 1) * 100)} %</em></span>
            <input type="range" min="0.8" max="1.3" step="0.05" .value=${String(c.font_scale || 1)} @change=${e => this._patchCfg({ font_scale: Number(e.target.value) === 1 ? undefined : Number(e.target.value) })}></div>
          ${this._toggle(this._d('animations'), c.animations !== false, v => this._patchCfg({ animations: v ? undefined : false }))}
          ${this._toggle(this._d('keep_proportions'), c.keep_proportions !== false, v => this._patchCfg({ keep_proportions: v ? undefined : false }))}
          <div class="note">${this._d('keep_proportions_d', { w: WIDTHS[this._width] })}</div>
        </div>
        <div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:layers-outline"></ha-icon>${this._d('layers')}</div>
          ${els.length ? html`<div class="layers">${[...els].sort((a, b) => (a.y - b.y) || (a.x - b.x)).map((e) => {
            const def = FWC_EL.TYPES[e.type] || { icon: 'mdi:help' };
            return html`<div class="layer" @click=${() => { this._sel = e.id; this.updateComplete.then(() => this._scrollToSel()); }}>
              <ha-icon .icon=${def.icon}></ha-icon><span>${e.title || this._t(`el.${e.type}`)}</span><em>${e.w}×${e.h}</em>
              <button class="icon-btn" title=${this._d('delete')} @click=${(ev) => { ev.stopPropagation(); this._delete(e.id); }}><ha-icon icon="mdi:close"></ha-icon></button>
            </div>`;
          })}</div>` : html`<p class="muted small">${this._d('no_elements')}</p>`}
        </div>
        ${this._renderKeys()}`;
    }

    _renderKeys() {
      const k = (...keys) => html`<span class="keys">${keys.map((x, i) => html`${i ? html`<span class="plus">+</span>` : ''}<kbd>${x}</kbd>`)}</span>`;
      return html`<div class="sub-box keys-box">
        <div class="sub-title"><ha-icon icon="mdi:keyboard-outline"></ha-icon>${this._d('keys')}</div>
        <div class="key-list">
          ${k('←', '→', '↑', '↓')}<span>${this._d('key_move')}</span>
          ${k('⇧', '←↑→↓')}<span>${this._d('key_resize')}</span>
          ${k('Ctrl', 'D')}<span>${this._d('key_dup')}</span>
          ${k('Entf')}<span>${this._d('key_delete')}</span>
          ${k('Ctrl', 'Z')}<span>${this._d('key_undo')}</span>
          ${k('Esc')}<span>${this._d('key_esc')}</span>
        </div></div>`;
    }

    _sourceInfo(el) {
      const card = this._card();
      const m = card && card._model;
      if (!m) return '';
      let field = PRIMARY[el.type];
      if (el.type === 'value') field = el.metric || 'humidity';
      if (el.type === 'temperature') field = el.metric || 'temperature';
      let src = null;
      if (field) {
        if (el.entity && this.hass.states[el.entity]) src = 'sensor';
        else src = m.cur[field] ? m.cur[field].src : 'none';
      } else if (['forecast_daily', 'forecast_hourly', 'chart', 'minmax', 'precipitation'].includes(el.type)) {
        src = m.usedOnline && (!m.weather || (el.type === 'forecast_hourly' && !m.hourly.length)) ? 'online' : (m.weather ? 'weather' : (m.online ? 'online' : 'none'));
      } else if (['sun', 'sun_times'].includes(el.type)) src = m.sun ? (m.sun.src === 'sun' ? 'sun' : 'calc') : 'none';
      else if (el.type === 'moon') src = m.moon && m.moon.e ? 'sensor' : 'calc';
      else if (el.type === 'warnings') src = m.warnSource === 'ha' ? 'sensor' : (m.warnSource === 'online' ? 'online' : 'none');
      if (!src) return '';
      const icon = { weather: 'mdi:weather-partly-cloudy', sensor: 'mdi:home-thermometer-outline', online: 'mdi:cloud-download-outline', forecast: 'mdi:calendar-clock', calc: 'mdi:calculator-variant-outline', sun: 'mdi:white-balance-sunny', none: 'mdi:help-circle-outline' }[src];
      return html`<div class="src src-${src}"><ha-icon .icon=${icon}></ha-icon><span>${this._d('source')}: <b>${this._d(`src_${src}`)}</b></span></div>`;
    }

    _renderElProps(el) {
      const def = FWC_EL.TYPES[el.type];
      if (!def) return html`<p class="muted">${el.type}</p>`;
      const cols = this._cols;
      const hasTitle = def.titled !== false || def.ownTitle;
      const styleOpts = [['', this._d('style_default')], ['tile', this._d('style_tile')], ['outline', this._d('style_outline')], ['flat', this._d('style_flat')], ['accent', this._d('style_accent')], ['none', this._d('style_none')]];
      return html`
        <div class="props-head">
          <div class="chip"><ha-icon .icon=${def.icon}></ha-icon></div>
          <div><div class="ph-title">${this._t(`el.${el.type}`)}</div><div class="muted small">${this._t(`eldesc.${el.type}`)}</div></div>
        </div>
        ${this._sourceInfo(el)}
        <div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:arrow-expand-all"></ha-icon>${this._d('position')}</div>
          <div class="two">
            ${this._number(this._d('x'), el.x + 1, 1, cols - el.w + 1, 1, v => this._patchEl(el.id, { x: v - 1 }))}
            ${this._number(this._d('y'), el.y + 1, 1, 99, 1, v => this._patchEl(el.id, { y: v - 1 }))}
            ${this._number(this._d('w'), el.w, Math.min(def.minW || 1, cols), cols - el.x, 1, v => this._patchEl(el.id, { w: v }))}
            ${this._number(this._d('h'), el.h, def.minH || 1, 24, 1, v => this._patchEl(el.id, { h: v }))}
          </div>
        </div>
        ${(def.fields || []).length ? html`<div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:tune-variant"></ha-icon>${this._d('options')}</div>
          ${def.fields.filter(f => !f.visible || f.visible(el)).map(f => this._renderField(el, f))}
        </div>` : ''}
        <div class="sub-box">
          <div class="sub-title"><ha-icon icon="mdi:palette-outline"></ha-icon>${this._d('appearance')}</div>
          ${hasTitle ? html`
            ${this._toggle(this._d('show_title'), FWC_EL.showTitle(el, def) || (def.ownTitle && el.show_title !== false), v => this._patchEl(el.id, { show_title: v }))}
            <div class="field"><span>${this._d('title_text')}</span><input type="text" .value=${el.title || ''} placeholder=${def.label ? def.label(el, { t: this._t }) : this._t(`el.${el.type}`)} @change=${e => this._patchEl(el.id, { title: e.target.value.trim() || undefined })}></div>` : ''}
          <div class="field"><span>${this._d('style')}</span>
            <select @change=${e => this._patchEl(el.id, { style: e.target.value || undefined })}>${styleOpts.map(([v, l]) => html`<option value=${v} ?selected=${(el.style || '') === v}>${l}</option>`)}</select></div>
          <div class="field"><span>${this._d('radius')}</span>
            <div class="color-row">${this._number('', el.radius ?? '', 0, 40, 2, v => this._patchEl(el.id, { radius: v }), 'px')}
            <button class="btn small ${el.radius === undefined ? 'on' : ''}" @click=${() => this._patchEl(el.id, { radius: undefined })}>${this._d('auto')}</button></div></div>
          <div class="field"><span>${this._d('accent')}</span>
            <div class="color-row">
              <input type="color" .value=${/^#[0-9a-f]{6}$/i.test(el.color || '') ? el.color : '#03a9f4'} @change=${e => this._patchEl(el.id, { color: e.target.value })}>
              <button class="btn small ${el.color ? '' : 'on'}" @click=${() => this._patchEl(el.id, { color: undefined })}>${this._d('auto')}</button>
            </div></div>
        </div>
        <div class="btn-row">
          <button class="btn" @click=${() => this._duplicate(el.id)}><ha-icon icon="mdi:content-copy"></ha-icon>${this._d('duplicate')}</button>
          <button class="btn danger" @click=${() => this._delete(el.id)}><ha-icon icon="mdi:delete-outline"></ha-icon>${this._d('delete')}</button>
        </div>`;
    }

    /* --- Rendern: Palette, Vorlagen, Arbeitsfläche ------------------------------------------ */
    _renderPalette() {
      const q = this._search.trim().toLowerCase();
      const match = (type) => !q || `${this._t(`el.${type}`)} ${this._t(`eldesc.${type}`)} ${type}`.toLowerCase().includes(q);
      return html`
        <div class="pane-title">${this._d('palette')}<span>${this._d('palette_hint')}</span></div>
        <div class="search"><ha-icon icon="mdi:magnify"></ha-icon><input type="text" .value=${this._search} placeholder=${this._d('search')} @input=${e => { this._search = e.target.value; }}></div>
        ${FWC_EL.GROUPS.map((g) => {
          const types = FWC_EL.ORDER.filter(t => FWC_EL.TYPES[t].group === g && match(t));
          if (!types.length) return '';
          return html`<div class="pal-group">${this._t(`group.${g}`)}</div>
            <div class="pal-list">${types.map(type => html`<div class="pal-item" title=${this._t(`eldesc.${type}`)} @pointerdown=${e => this._onPaletteDown(e, type)}>
              <span class="pal-ic"><ha-icon .icon=${FWC_EL.TYPES[type].icon}></ha-icon></span>
              <span class="pal-txt"><b>${this._t(`el.${type}`)}</b><small>${this._t(`eldesc.${type}`)}</small></span>
            </div>`)}</div>`;
        })}`;
    }

    _renderTemplates() {
      const names = ['compact', 'standard', 'detailed', 'astro', 'weather3d', 'dashboard', 'empty'];
      return html`<div class="tpl-step">
        <h2>${this._d('tpl_title')}</h2>
        <p class="muted">${this._d('tpl_hint')}</p>
        <div class="tpl-grid">${names.map(n => html`<button class="tpl-card ${this._tpl === n ? 'on' : ''} ${n === 'dashboard' ? 'wide' : ''}" @click=${() => { this._tpl = n; }} @dblclick=${() => this._applyTemplate(n)}>
          <div class="tpl-prev">${n === 'empty' ? html`<div class="tpl-empty"><ha-icon icon="mdi:view-grid-plus-outline"></ha-icon></div>`
            : html`<flexible-weather-card .hass=${this.hass} .config=${{ ...this._cfg, ...(FWC_TEMPLATE_CFG[n] || {}), columns: FWC_TEMPLATE_COLS[n] || 6, elements: fwcTemplate(n) }}></flexible-weather-card>`}</div>
          <div class="tpl-name">${this._d(`tpl_${n}`)}<span>${this._d(`tpl_${n}_d`)}</span></div>
        </button>`)}</div>
        <div class="btn-row center">
          ${this._els.length ? html`<button class="btn" @click=${() => { this._step = 'edit'; }}><ha-icon icon="mdi:arrow-left"></ha-icon>${this._d('back')}</button>` : ''}
          <button class="btn primary" @click=${() => this._applyTemplate(this._tpl)}>${this._d('use_tpl')}<ha-icon icon="mdi:arrow-right"></ha-icon></button>
        </div>
      </div>`;
    }

    _renderEdit() {
      const sel = this._sel && this._el(this._sel);
      const rows = L.rows(this._els);
      let hint = this._d('hint_select');
      if (this._pdrag && this._pdrag.moved) hint = this._d('hint_palette');
      else if (this._drag && this._drag.moved) hint = this._d('hint_drag');
      else if (this._cols > 6 && WIDTHS[this._width] < 600) hint = this._d('hint_mobile');
      const width = WIDTHS[this._width] || WIDTHS.m;
      return html`
        <div class="workspace">
          <aside class="palette">${this._renderPalette()}</aside>
          <section class="canvas" tabindex="0" @pointerdown=${this._onCanvasDown}>
            <div class="stage" style="width:${width}px;zoom:${this._zoomVal}">
              <flexible-weather-card design-mode .hass=${this.hass} .config=${this._cfg} .previewElements=${this._preview}
                .selectedId=${this._sel} .dragId=${this._dragId}></flexible-weather-card>
              ${!this._els.length && !this._preview ? html`<div class="canvas-empty"><ha-icon icon="mdi:drag-variant"></ha-icon>${this._d('empty_canvas')}</div>` : ''}
            </div>
          </section>
          <aside class="props">
            <div class="pane-title">${sel ? this._d('props') : this._d('card')}
              <span>${sel ? html`<a class="link" @click=${() => { this._sel = null; }}>← ${this._d('card')}</a>` : html`${this._d('elements_count', { n: this._els.length })} · ${this._d('rows_count', { n: rows })}`}</span></div>
            ${sel ? this._renderElProps(sel) : this._renderCardProps()}
          </aside>
        </div>
        <div class="hintbar"><ha-icon icon="mdi:information-outline"></ha-icon><span>${hint}</span></div>`;
    }

    render() {
      if (!this._cfg) return html``;
      const edit = this._step !== 'templates';
      return html`
        <dialog @cancel=${this._onCancel} @keydown=${this._onKey} @close=${e => e.stopPropagation()}>
          <div class="frame">
            <header>
              <div class="title"><ha-icon icon="mdi:view-dashboard-edit-outline"></ha-icon>${this._d('title')}</div>
              <div class="head-actions">
                ${edit ? html`
                  <div class="seg width-seg" title=${this._d('preview_width')}>
                    ${Object.keys(WIDTHS).map(w => html`<button class="${this._width === w ? 'on' : ''}" @click=${() => this._setWidth(w)}>
                      <ha-icon .icon=${WIDTH_ICONS[w]}></ha-icon><span>${WIDTHS[w]}</span></button>`)}
                  </div>
                  <div class="seg zoom-seg" title=${this._d('zoom_hint')}>
                    <button @click=${() => this._stepZoom(-1)} title=${this._d('zoom_out')}><ha-icon icon="mdi:magnify-minus-outline"></ha-icon></button>
                    <button class="zv" @click=${() => this._setZoom(1)} title="100 %">${Math.round(this._zoomVal * 100)} %</button>
                    <button @click=${() => this._stepZoom(1)} title=${this._d('zoom_in')}><ha-icon icon="mdi:magnify-plus-outline"></ha-icon></button>
                    <button class="${this._zoom === 'fit' ? 'on' : ''}" @click=${() => this._setZoom('fit')} title=${this._d('zoom_fit')}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
                  </div>
                  <button class="btn ghost" @click=${() => { this._tpl = 'standard'; this._step = 'templates'; }}><ha-icon icon="mdi:view-dashboard-variant-outline"></ha-icon><span class="lbl">${this._d('templates')}</span></button>
                  <button class="btn ghost" ?disabled=${!this._histLen} @click=${() => this._undo()}><ha-icon icon="mdi:undo"></ha-icon><span class="lbl">${this._d('undo')}</span></button>` : ''}
                <button class="btn primary" @click=${() => this._close()}><ha-icon icon="mdi:check"></ha-icon>${this._d('done')}</button>
              </div>
            </header>
            ${edit ? this._renderEdit() : this._renderTemplates()}
          </div>
          ${this._pghost ? html`<div class="drag-ghost ${this._pghost.over ? 'over' : ''}" style="left:${this._pghost.x}px;top:${this._pghost.y}px">
            <ha-icon .icon=${FWC_EL.TYPES[this._pghost.type].icon}></ha-icon><span>${this._t(`el.${this._pghost.type}`)}</span></div>` : ''}
        </dialog>`;
    }

    static get styles() {
      return css`
        :host {
          --ed-bg: var(--card-background-color, #1c1c1c);
          --ed-pane: color-mix(in srgb, var(--primary-text-color, #fff) 4%, var(--ed-bg));
          --ed-canvas: color-mix(in srgb, var(--primary-text-color, #fff) 2%, var(--primary-background-color, #111));
          --ed-line: var(--divider-color, rgba(255, 255, 255, 0.12));
          --ed-accent: var(--primary-color, #03a9f4);
        }
        dialog {
          padding: 0; border: none; border-radius: 18px; color: var(--primary-text-color);
          background: var(--ed-bg); width: min(1480px, 97vw); height: min(960px, 95vh); max-width: none; max-height: none;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5); overflow: hidden; font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, sans-serif));
        }
        dialog:not([open]) { display: none; }
        dialog[open]:not(:modal) { position: fixed; inset: 2.5vh 1.5vw; margin: auto; z-index: 10000; }
        dialog::backdrop { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px); }
        .frame { display: flex; flex-direction: column; height: 100%; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--ed-line); flex-wrap: wrap; }
        .title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 600; }
        .title ha-icon { color: var(--ed-accent); --mdc-icon-size: 22px; }
        .head-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        ha-icon { --mdc-icon-size: 18px; }

        .btn, .seg button {
          display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--ed-line); background: var(--ed-pane);
          color: var(--primary-text-color); border-radius: 10px; padding: 7px 12px; font: inherit; font-size: 13px; cursor: pointer;
          transition: background .15s, border-color .15s, color .15s; white-space: nowrap;
        }
        .btn:hover, .seg button:hover { border-color: var(--ed-accent); }
        .btn:disabled { opacity: .4; cursor: default; border-color: var(--ed-line); }
        .btn.primary { background: var(--ed-accent); border-color: var(--ed-accent); color: var(--text-primary-color, #fff); font-weight: 600; }
        .btn.ghost { background: transparent; }
        .btn.danger { color: var(--error-color, #ef4444); }
        .btn.danger:hover { border-color: var(--error-color, #ef4444); }
        .btn.small { padding: 5px 10px; }
        .btn.on { border-color: var(--ed-accent); color: var(--ed-accent); }
        .seg { display: inline-flex; border-radius: 10px; overflow: hidden; border: 1px solid var(--ed-line); }
        .seg button { border: none; border-radius: 0; background: transparent; }
        .seg button + button { border-left: 1px solid var(--ed-line); }
        .seg button.on { background: color-mix(in srgb, var(--ed-accent) 18%, transparent); color: var(--ed-accent); font-weight: 600; }
        .seg.small { display: flex; }
        .seg.small button { padding: 6px 8px; flex: 1; justify-content: center; font-size: 12.5px; }
        .width-seg button { padding: 6px 9px; font-size: 12px; }
        .width-seg button span { font-variant-numeric: tabular-nums; }
        .zoom-seg button { padding: 6px 8px; font-size: 12px; }
        .zoom-seg .zv { min-width: 52px; justify-content: center; font-variant-numeric: tabular-nums; }

        .workspace { flex: 1; min-height: 0; display: grid; grid-template-columns: 250px 1fr 320px; }
        .palette, .props { background: var(--ed-pane); overflow-y: auto; padding: 14px; scrollbar-width: thin; }
        .palette { border-right: 1px solid var(--ed-line); }
        .props { border-left: 1px solid var(--ed-line); }
        .pane-title { font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; opacity: .75; margin-bottom: 12px; display: flex; flex-direction: column; gap: 2px; }
        .pane-title span { text-transform: none; letter-spacing: 0; font-weight: 400; font-size: 12px; opacity: .85; }
        .link { color: var(--ed-accent); cursor: pointer; }
        .search { display: flex; align-items: center; gap: 6px; border: 1px solid var(--ed-line); border-radius: 10px; padding: 0 10px; background: var(--ed-bg); margin-bottom: 10px; }
        .search input { flex: 1; border: none; background: transparent; color: inherit; font: inherit; font-size: 13px; padding: 8px 0; outline: none; min-width: 0; }
        .search ha-icon { color: var(--secondary-text-color); }
        .pal-group { font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: var(--secondary-text-color); margin: 14px 2px 6px; }
        .pal-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
        .pal-item { display: flex; align-items: center; gap: 10px; padding: 7px 9px; border-radius: 12px; border: 1px solid var(--ed-line);
          background: var(--ed-bg); cursor: grab; user-select: none; touch-action: none; font-size: 13px; transition: border-color .15s, transform .15s; min-width: 0; overflow: hidden; }
        .pal-item:hover { border-color: var(--ed-accent); transform: translateX(2px); }
        .pal-item:active { cursor: grabbing; }
        .pal-ic { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--ed-accent) 14%, transparent); color: var(--ed-accent); }
        .pal-txt { display: flex; flex-direction: column; min-width: 0; }
        .pal-txt b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pal-txt small { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .canvas { position: relative; overflow: auto; padding: 28px 24px 60px; background: var(--ed-canvas); outline: none;
          background-image: radial-gradient(color-mix(in srgb, var(--primary-text-color) 10%, transparent) 1px, transparent 1px); background-size: 18px 18px; }
        .stage { position: relative; margin: 0 auto; transition: width .25s; }
        .canvas { scrollbar-width: thin; }
        .stage flexible-weather-card { display: block; }
        .canvas-empty { position: absolute; left: 0; right: 0; top: 110px; text-align: center; color: var(--secondary-text-color); font-size: 14px; pointer-events: none;
          display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .canvas-empty ha-icon { --mdc-icon-size: 34px; color: var(--ed-accent); }

        .sub-box { margin-top: 12px; padding: 10px 12px 4px; border: 1px solid var(--ed-line); border-radius: 12px; background: var(--ed-bg); }
        .sub-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; opacity: .8; margin-bottom: 10px; }
        .sub-title ha-icon { --mdc-icon-size: 15px; color: var(--ed-accent); }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
        .field > span { display: flex; justify-content: space-between; }
        .field em { font-style: normal; color: var(--primary-text-color); }
        .field em.hint { color: var(--secondary-text-color); font-size: 11.5px; }
        .note { color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.4; margin: -4px 0 10px; }
        .field select, .field input[type="text"], .field textarea {
          font: inherit; font-size: 14px; color: var(--primary-text-color); background: var(--ed-bg); border: 1px solid var(--ed-line);
          border-radius: 10px; padding: 8px 10px; outline: none; width: 100%; box-sizing: border-box;
        }
        .field textarea { font-family: monospace; font-size: 12px; resize: vertical; }
        .field select:focus, .field input[type="text"]:focus { border-color: var(--ed-accent); }
        .field input[type="range"] { width: 100%; accent-color: var(--ed-accent); }
        .field ha-selector { display: block; }
        .two { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px; }
        .num { display: flex; align-items: center; border: 1px solid var(--ed-line); border-radius: 10px; background: var(--ed-bg); overflow: hidden; }
        .num input { flex: 1; min-width: 0; width: 100%; border: none; background: transparent; color: var(--primary-text-color); font: inherit; font-size: 14px; text-align: center; padding: 7px 0; outline: none; -moz-appearance: textfield; }
        .num input::-webkit-outer-spin-button, .num input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .num em { font-size: 11px; color: var(--secondary-text-color); padding-right: 4px; }
        .nb { border: none; background: transparent; color: var(--secondary-text-color); width: 30px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nb:hover:not(:disabled) { color: var(--ed-accent); background: color-mix(in srgb, var(--ed-accent) 10%, transparent); }
        .nb:disabled { opacity: .3; cursor: default; }
        .nb ha-icon { --mdc-icon-size: 16px; }
        .toggle { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; cursor: pointer; user-select: none; margin-bottom: 12px; }
        .toggle input { display: none; }
        .toggle .knob { width: 34px; height: 20px; border-radius: 10px; background: var(--ed-line); position: relative; transition: background .2s; flex-shrink: 0; }
        .toggle .knob::after { content: ""; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
        .toggle input:checked + .knob { background: var(--ed-accent); }
        .toggle input:checked + .knob::after { left: 17px; }
        .color-row { display: flex; gap: 8px; align-items: center; }
        .color-row > .field { flex: 1; margin-bottom: 0; }
        .color-row > .field > span:empty { display: none; }
        .field.inherited ha-selector, .field.inherited input { opacity: .7; }
        .field em.hint ha-icon { --mdc-icon-size: 13px; margin-right: 4px; vertical-align: -2px; color: var(--ed-accent); }
        .color-row input[type="color"] { width: 44px; height: 34px; border: 1px solid var(--ed-line); border-radius: 8px; background: none; padding: 2px; cursor: pointer; }
        .btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .btn-row.center { justify-content: center; }
        .muted { color: var(--secondary-text-color); }
        .small { font-size: 12px; }
        .props-head { display: flex; align-items: center; gap: 12px; }
        .chip { width: 46px; height: 46px; border-radius: 12px; background: color-mix(in srgb, var(--ed-accent) 14%, var(--ed-bg)); color: var(--ed-accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chip ha-icon { --mdc-icon-size: 24px; }
        .ph-title { font-weight: 600; font-size: 15px; }
        .src { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 7px 10px; border-radius: 10px; font-size: 12px; color: var(--secondary-text-color);
          background: color-mix(in srgb, var(--ed-accent) 8%, transparent); }
        .src b { color: var(--primary-text-color); font-weight: 500; }
        .src ha-icon { --mdc-icon-size: 16px; color: var(--ed-accent); }
        .src.src-none { background: color-mix(in srgb, var(--warning-color, #ffa600) 12%, transparent); }
        .src.src-none ha-icon { color: var(--warning-color, #ffa600); }
        .layers { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
        .layer { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .layer:hover { background: color-mix(in srgb, var(--ed-accent) 10%, transparent); }
        .layer ha-icon { color: var(--ed-accent); --mdc-icon-size: 16px; }
        .layer span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .layer em { font-style: normal; font-size: 11px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
        .icon-btn { border: none; background: transparent; color: var(--secondary-text-color); cursor: pointer; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { color: var(--error-color, #ef4444); background: color-mix(in srgb, var(--error-color, #ef4444) 10%, transparent); }
        .icon-btn ha-icon { --mdc-icon-size: 15px; color: inherit; }
        .key-list { display: grid; grid-template-columns: max-content 1fr; gap: 6px 10px; align-items: center; margin-bottom: 8px; font-size: 12px; color: var(--secondary-text-color); }
        .keys { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
        .keys .plus { opacity: .6; font-size: 11px; }
        kbd { font: 600 11px/1 var(--ha-font-family-body, Roboto, sans-serif); color: var(--primary-text-color); background: var(--ed-pane);
          border: 1px solid var(--ed-line); border-bottom-width: 2px; border-radius: 5px; padding: 3px 5px; min-width: 10px; text-align: center; }

        .hintbar { display: flex; align-items: center; gap: 8px; padding: 9px 18px; font-size: 12.5px; color: var(--secondary-text-color); border-top: 1px solid var(--ed-line); }
        .hintbar ha-icon { --mdc-icon-size: 16px; color: var(--ed-accent); flex-shrink: 0; }

        .tpl-step { flex: 1; overflow-y: auto; padding: 18px 28px 26px; text-align: center; background: var(--ed-canvas); }
        .tpl-step h2 { margin: 6px 0 6px; font-size: 22px; font-weight: 600; }
        .tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; max-width: 1400px; margin: 18px auto 0; align-items: start; }
        .tpl-card { border: 2px solid var(--ed-line); border-radius: 16px; background: var(--ed-pane); padding: 12px; cursor: pointer; color: inherit; font: inherit;
          transition: border-color .15s, transform .15s, box-shadow .15s; text-align: left; display: flex; flex-direction: column; gap: 10px; }
        .tpl-card.wide { grid-column: span 2; }
        @media (max-width: 700px) { .tpl-card.wide { grid-column: auto; } }
        .tpl-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--ed-accent) 60%, var(--ed-line)); }
        .tpl-card.on { border-color: var(--ed-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--ed-accent) 20%, transparent); }
        .tpl-prev { pointer-events: none; max-height: 420px; overflow: hidden; border-radius: 12px; position: relative;
          -webkit-mask-image: linear-gradient(to bottom, #000 82%, transparent); mask-image: linear-gradient(to bottom, #000 82%, transparent); }
        .tpl-empty { height: 200px; display: flex; align-items: center; justify-content: center; border: 2px dashed var(--ed-line); border-radius: 12px; color: var(--ed-accent); }
        .tpl-empty ha-icon { --mdc-icon-size: 48px; }
        .tpl-name { font-weight: 600; font-size: 15px; display: flex; flex-direction: column; gap: 2px; }
        .tpl-name span { font-weight: 400; font-size: 12.5px; color: var(--secondary-text-color); }

        .drag-ghost { position: fixed; z-index: 10; pointer-events: none; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 12px; background: var(--ed-accent); color: var(--text-primary-color, #fff); font-size: 13px; font-weight: 600;
          box-shadow: 0 10px 26px rgba(0, 0, 0, .35); opacity: .95; white-space: nowrap; }
        .drag-ghost.over { opacity: .55; transform: translate(-50%, -150%) scale(.9); }

        @media (max-width: 1100px) {
          .workspace { grid-template-columns: 210px 1fr 280px; }
          .head-actions .lbl { display: none; }
        }
        @media (max-width: 900px) {
          dialog { width: 100vw; height: 100vh; border-radius: 0; max-height: 100vh; }
          .workspace { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
          .palette { border-right: none; border-bottom: 1px solid var(--ed-line); padding: 8px 10px; display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden; }
          .palette .pane-title, .palette .search, .pal-group { display: none; }
          .pal-list { display: flex; gap: 6px; }
          .pal-item { flex-direction: column; gap: 4px; font-size: 11px; padding: 6px 8px; min-width: 78px; text-align: center; }
          .pal-txt small { display: none; }
          .props { border-left: none; border-top: 1px solid var(--ed-line); max-height: 40vh; }
          .canvas { padding: 16px 8px 40px; }
          .width-seg { display: none; }
          header { padding: 10px 12px; }
          .hintbar { display: none; }
        }
      `;
    }
  }

  if (!customElements.get('flexible-weather-card-designer')) customElements.define('flexible-weather-card-designer', FlexibleWeatherCardDesigner);
})();
