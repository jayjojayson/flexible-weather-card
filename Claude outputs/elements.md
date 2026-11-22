# Elements

Every piece of the card is an **element**. You place elements in the [layout designer](../README.md#the-layout-designer) (or in YAML under `elements:`). This page explains what each element shows, where its data comes from and which options it has.

- [Options every element has](#options-every-element-has)
- **Current:** [Title & date](#header--title--date) · [Current weather](#current--current-weather) · [3D weather](#weather3d--3d-weather) · [Weather warnings](#warnings--weather-warnings)
- **Measurements:** [Temperature](#temperature) · [Min / max today](#minmax--min--max-today) · [Humidity](#humidity) · [Air pressure](#pressure--air-pressure) · [Wind compass](#wind--wind-compass) · [Visibility](#visibility) · [Precipitation](#precipitation) · [UV index](#uv--uv-index) · [Solar radiation](#solar--solar-radiation) · [Pollen](#pollen) · [Weather report](#report--weather-report) · [Single value](#value--single-value)
- **Sun & moon:** [Sun position 3D](#sun--sun-position-3d) · [Sunrise & sunset](#sun_times--sunrise--sunset) · [Moon](#moon)
- **Forecast:** [Daily forecast](#forecast_daily--daily-forecast) · [Hourly forecast](#forecast_hourly--hourly-forecast) · [Temperature & humidity trend](#chart--temperature--humidity-trend) · [Rain radar](#radar--rain-radar)
- **Other:** [Any entity](#sensor--any-entity) · [Image / iFrame](#image--image--iframe) · [Any Lovelace card](#card--any-lovelace-card)

> **Where do the values come from?** Every element uses the first source that has a value: its own entity → the card's `sensors:` → your weather entity → Open-Meteo (online). Details in [Data sources](../README.md#data-sources).
>
> **Sizes** are given in grid cells (columns × rows). The elements adapt their content to the space they get, so you can make them smaller or larger as you like.

---

## Options every element has

| Option | Description |
| --- | --- |
| `id`, `type` | Unique id and element type (set by the designer) |
| `x`, `y`, `w`, `h` | Position and size in grid cells |
| `show_title` / `title` | Show the label of the element / use your own text |
| `style` | `tile` (filled tile), `outline`, `flat` (no background), `accent` (tinted with the accent color), `none` |
| `color` | Accent color of the element |
| `radius` | Corner radius in px (overrides the card's `element_radius`) |
| `tap_action` | Any Home Assistant action (more-info, navigate, call-service, …) |

---

## `header` – Title & date

A heading for the card: title plus date and time. Optionally shows the current weather icon and temperature on the right.

**Default size:** 6×1

| Option | Default | Description |
| --- | --- | --- |
| `text` | *(your HA location name)* | Own title |
| `show_date` | `true` | Show the date |
| `show_time` | `true` | Show the time |
| `show_condition` | `false` | Show the weather icon and temperature |
| `align` | `left` | `left` / `center` / `right` |

---

## `current` – Current weather

The big "now" element: temperature, condition, feels-like temperature, low / high of the day and a row of details (humidity, wind, rain probability).

**Default size:** 6×3 · **Data:** weather entity or `sensors.temperature`; low / high from `sensors.temperature_min` / `temperature_max`, from the entities of a `minmax` element, otherwise from the forecast.

| Option | Default | Description |
| --- | --- | --- |
| `display` | `icon` | `icon` = animated weather icon · `scene` = the whole element becomes an **animated weather scene** (see below) |
| `entity` | *(weather entity)* | Own temperature sensor |
| `show_condition` | `true` | Show the condition as text |
| `show_feels_like` | `true` | Show the feels-like temperature |
| `show_minmax` | `true` | Show low / high of the day |
| `show_details` | `true` | Show humidity, wind and rain probability |
| `temp_colors` | `false` | Color the temperature by its value |
| `animated` | `true` | Animate the icon |

**Weather scene** (`display: scene`): a sky that matches the current weather and time of day – realistic clouds (generated once and only moved afterwards, so it stays light on the browser), sun with rays, moon in its real phase, stars, rain, snow, hail, lightning, fog and wind. While the sun is close to the horizon (sunrise / sunset), the sky turns warm purple-pink-orange with a soft glow; the sun stays in its place. Clouds and weather effects are drawn *behind* the text.

```yaml
- type: current
  display: scene
  x: 0
  y: 0
  w: 6
  h: 3
```

---

## `weather3d` – 3D weather

An animated **3D diorama** of the current weather with all important values – the scene stays calm and flat, no tilting with mouse or finger.

What you see:

- **Sky** that matches the weather and the time of day (warm sunrise / sunset colors when the sun is close to the horizon), with sun (rays) or moon (real phase) and stars at night. Sky, stars and sun / moon stand still (the sun / moon always sits right of the wind turbine); only clouds, island and weather move in front of them. The weather scene in the background can be switched off (`show_scene`).
- **Clouds in several depths** (the same realistic clouds as the weather scene), a dark cloud deck for rain and storm. The scene is kept subtle and fades out softly towards the bottom (like in the *Temperature* element), so the island and the cards stay in focus.
- **Rain, hail and snow** fall *into* the 3D scene – drops close to you are bigger and faster than far ones. Ripples on the pond when it rains, lightning with flash for thunderstorms.
- **Fog** hangs over the lake and between the trees.
- **Floating island** with a natural lake (irregular shore, stones, reeds), pines, round trees, bushes and a prominent **wind turbine**. The rotor turns the faster the stronger the real wind blows and the turbine faces the wind direction. From a fresh breeze on, the **trees sway** back and forth – the stronger the wind, the wider.
- **More life on the island:** a **windsock** behind the hut, left of the wind turbine, that hangs down in calm air, stands out straight in a storm and points with the wind · a small **hut at the lake** whose windows glow after sunset, in thunderstorms and on fully overcast days (≥ 95 % cloud cover) and whose chimney smokes when it is cold (the smoke drifts with the wind) · a red **aviation light** blinking on the wind turbine at night · **puddles** with rain rings when it rains or the ground is still wet · a **snowman** when there is snow · **leaves** whirling across the island in a storm · **ground fog** over the meadow and the lake · a **lightning strike** next to the wind turbine that lights up the island · **ducks** on the lake and **birds** in the sky in nice weather, **butterflies** on warm days · a **rainbow** when the sun shines during or right after rain.
- **Seasons:** the deciduous trees blossom in spring, are green in summer (the lawn looks a bit drier then), turn yellow-red in autumn and are bare in winter (pines stay green). Set automatically from the date (southern hemisphere reversed) or fixed with `season`.
- **The lake freezes** at temperatures below 0 °C – light ice with cracks and snow drifts.
- **The ground shows the weather:** snow-covered when it snows or is freezing, wet and dark in rain, dry and yellowish in drought / heat, frozen soil in winter (ground frost) and darker at night.
- **Glass cards** with the values: the big temperature (colored by temperature), condition, feels like, low / high and one card per value. Each card is only tinted very lightly with its color (no colored border), and values and labels always shrink to stay inside their card.

**Default size:** 6×5 (minimum 3×3). In small elements fewer cards are shown, so nothing gets cramped. If you switch off the temperature field and all value cards, the island fills the whole element.

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(`sensors.temperature` of the card / weather entity)* | Own temperature sensor. The sensor from the card editor is used automatically if you leave this empty |
| `show_scene` | `true` | Weather scene (sky, clouds, sun / moon) in the background |
| `show_landscape` | `true` | Island with trees, lake and wind turbine (off = only sky, clouds and weather) |
| `show_values` | `false` | **Values in the graphic:** the temperature stands free at the top left (only if the temperature field is off) and *wind* (arrow in wind direction), *humidity* and *air pressure* in one free row below the island – no lines, no boxes, the island keeps its size and the sun / moon stays free. Values that are already shown as cards are not repeated. Ideal if you only use the island (switch off the temperature field and all cards) |
| `wind_object` | `both` | Wind turbine and / or windsock on the island: `both`, `turbine`, `windsock` |
| `season` | `auto` | Season of the trees: `auto` (from the date), `spring`, `summer`, `autumn`, `winter` |
| `show_temp` | `true` | Big temperature field (off = only the value cards) |
| `show_condition` | `true` | Show the condition as text |
| `show_feels_like` | `true` | Show the feels-like temperature |
| `show_minmax` | `true` | Show low / high of the day |
| `temp_colors` | `true` | Color the big temperature by its value |
| `show_wind` | `true` | Card *Wind* – arrow in wind direction, colored by strength, speed, gusts and direction |
| `show_humidity` | `true` | Card *Humidity* |
| `show_pressure` | `true` | Card *Air pressure* (always in hPa) |
| `show_precip` | `true` | Card *Precipitation* – probability and amount of today |
| `show_uv` | `true` | Card *UV index* with rating |
| `show_sun` | `true` | Card *Sunrise / sunset* |
| `show_visibility` | `false` | Card *Visibility* |
| `show_dew_point` | `false` | Card *Dew point* |
| `show_clouds` | `false` | Card *Cloud cover* |
| `animated` | `true` | Animations (drifting clouds, rain, swaying trees, rotor). Off = still image |

> **Tip:** with 7 or more cards they are shown in three columns. The cards use your own sensors (`sensors:` in the card editor) first, then the weather entity, then Open-Meteo – like every other element.

```yaml
- type: weather3d
  show_visibility: true
  show_dew_point: true
  x: 0
  y: 0
  w: 6
  h: 5
```

---

## `warnings` – Weather warnings

Shows the active weather warnings. A colored badge in the heading shows how many warnings are active (color = highest severity).

**Default size:** 6×2 · **Data:** DWD Weather Warnings or Meteoalarm entities (detected automatically). Without an entity the DWD warnings are loaded online via Bright Sky (Germany only).

| Option | Default | Description |
| --- | --- | --- |
| `entities` | *(automatic)* | Warning sensors / binary sensors |
| `online` | `true` | Load DWD warnings online if there is no entity |
| `max` | `3` | Maximum number of warnings shown |
| `expanded` | `false` | Show the full description of each warning |
| `hide_when_empty` | `false` | Hide the element while there is no warning |
| `show_region` | `true` | Show the region name |

---

## `temperature`

The temperature as a large value with an optional **thermometer**.

**Default size:** 2×2

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(weather entity / `sensors.temperature`)* | Own sensor |
| `metric` | `temperature` | `temperature` / `apparent_temperature` (feels like) / `dew_point` |
| `show_feels_like` | `true` | Show the feels-like temperature below |
| `temp_colors` | `true` | Color the value by its temperature |
| `show_thermometer` | `true` | Show the thermometer. Its fill level **and** color follow the temperature (scale −15 … 40 °C) |
| `decimals` | `1` | Decimal places (0–2) |
| `show_scene` | `false` | Fills the background with the animated **weather scene** (like in *Current weather*). The layout of the values stays the same |

---

## `minmax` – Min / max today

Today's lowest and highest temperature, optionally with the current temperature marked in between.

**Default size:** 3×1 · **Data:** `min_entity` / `max_entity` (e.g. your own min / max sensors), otherwise the forecast. From 2 rows on, the times of the low and the high are shown.

| Option | Default | Description |
| --- | --- | --- |
| `min_entity` | *(`sensors.temperature_min`)* | Sensor for today's low – any `sensor` / `input_number` is selectable |
| `max_entity` | *(`sensors.temperature_max`)* | Sensor for today's high |
| `entity` | *(weather entity)* | Sensor for the current temperature |
| `show_current` | `true` | Mark the current temperature |
| `show_label` | `true` | Show the label |
| `show_times` | `true` | Show the times of low and high (needs a larger element) |

> If you set `min_entity` / `max_entity` here (or `sensors.temperature_min` / `temperature_max` in the card editor), the *Current weather* element uses the same values.

---

## `humidity`

Relative humidity as a ring gauge with a rating (dry … humid) and the dew point.

**Default size:** 2×2

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own humidity sensor |
| `show_dew_point` | `true` | Show the dew point |
| `show_comfort` | `true` | Show a rating (dry … humid) |
| `view` | `ring` | `ring` = ring gauge · `column` = **column view like *Precipitation*** – gauge column, big value, humidity in % (dew point as extra value, comfort rating, hourly humidity bars). Put *Precipitation*, *Wind*, *Humidity* and *Air pressure* side by side and they all share the same look |
| `hours` | `12` | Column view: number of hours for the bars (3 – 24) |
| `show_bars` | `true` | Column view: show the hourly bars |
| `show_gauge` | `true` | Column view: show the gauge column |

---

## `pressure` – Air pressure

Air pressure on a ring gauge in the same style and size as *Humidity* – colored zones (low … high pressure), scale ticks and a pointer, the value in the middle. Next to it (wide) or below it (tall): the rating and the difference to normal pressure (1013 hPa). Humidity and air pressure side by side now look like a pair.

**Default size:** 2×2

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own pressure sensor |
| `min` / `max` | `960` / `1060` | Scale of the gauge in hPa |
| `show_label` | `true` | Show the text rating |
| `show_normal` | `true` | Show the difference to normal pressure, e.g. *Normal +3 hPa* |
| `view` | `ring` | `ring` = ring gauge · `column` = **column view like *Precipitation*** – gauge column, big value, air pressure (trend of the next 3 hours as extra value, weather rating and difference to normal pressure, hourly pressure bars). Put *Precipitation*, *Wind*, *Humidity* and *Air pressure* side by side and they all share the same look |
| `hours` | `12` | Column view: number of hours for the bars (3 – 24) |
| `show_bars` | `true` | Column view: show the hourly bars |
| `show_gauge` | `true` | Column view: show the gauge column |

---

## `wind` – Wind compass

A compass with the wind direction, speed in the middle, gusts and the Beaufort scale.

**Default size:** 3×3

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own wind speed sensor |
| `direction_entity` | *(automatic)* | Own wind direction sensor (degrees) |
| `gust_entity` | *(automatic)* | Own gust sensor |
| `show_gust` | `true` | Show gusts |
| `show_beaufort` | `true` | Show the Beaufort scale and description |
| `show_details` | `true` | Show the side details |

---

## `visibility`

Visibility in km / mi, drawn as a landscape that fades into haze the shorter the visibility is.

**Default size:** 3×2 · **Data:** weather entity, own sensor or Open-Meteo (many integrations don't provide it).

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own visibility sensor |
| `show_label` | `true` | Show the label |

---

## `precipitation`

Rain amount as a **rain gauge** with waves, the rain probability and little bars for the next hours.

**Default size:** 3×2

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own precipitation sensor (e.g. rain gauge) |
| `mode` | `today` | `today` = sum of today · `current` = current intensity |
| `hours` | `12` | Number of hours in the bar chart (3–24) |
| `show_bars` | `true` | Show the hourly bars (opacity = rain probability) |
| `show_gauge` | `true` | Show the rain gauge |

---

## `uv` – UV index

UV index with color scale, a hint ("Sun protection needed") and today's maximum.

**Default size:** 3×2

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own UV sensor |
| `show_hint` | `true` | Show the protection hint |
| `show_max` | `true` | Show the maximum of today |

---

## `solar` – Solar radiation

Current solar radiation in W/m², the curve of the day and the day total.

**Default size:** 3×2 · **Data:** your sensor (`sensors.solar_radiation`) or Open-Meteo.

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(automatic)* | Own radiation sensor |
| `show_curve` | `true` | Show the curve of the day |
| `show_sum` | `true` | Show the day total |
| `max` | `1000` | Top of the scale in W/m² |

---

## `pollen`

Pollen load per plant as a 4-step bar, sorted by load, with a rating text.

**Default size:** 3×3 · **Data:** your pollen sensors (e.g. DWD Pollenflug) or online via the Open-Meteo air quality API (CAMS, Europe only).

| Option | Default | Description |
| --- | --- | --- |
| `entities` | *(none)* | Your pollen sensors |
| `online` | `true` | Use online data if there are no sensors |
| `hide_zero` | `true` | Hide plants without load |
| `show_tomorrow` | `true` | Show the load for tomorrow (if available) |

---

## `report` – Weather report

A weather report as text, with tabs for today, tomorrow and the day after.

**Default size:** 6×4 · **Data:** a text sensor (e.g. the DWD weather report sensor, attribute `data`); without a sensor the text is **generated from the forecast**.

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(none)* | Text sensor |
| `attribute` | `data` | Attribute that contains the text |
| `range` | `today` | `today` / `tomorrow` / `day3` / `all` |
| `length` | `long` | `short` or `long` (5–7 sentences) |
| `show_tabs` | `true` | Show the day tabs |
| `show_headline` | `true` | Show the headline |
| `show_meta` | `true` | Show the info line below the text |

---

## `value` – Single value

One number with an icon – ideal for small extra values next to the big elements.

**Default size:** 2×1

| Option | Default | Description |
| --- | --- | --- |
| `metric` | `humidity` | Which value to show (temperature, humidity, pressure, wind speed, gusts, UV index, cloud cover, …) |
| `entity` | *(automatic)* | Own sensor |
| `icon` | *(automatic)* | Own icon, e.g. `mdi:water` |
| `decimals` | *(automatic)* | Decimal places (0–3) |
| `temp_colors` | `false` | Color the value by temperature (for temperature metrics) |

---

## `sun` – Sun position 3D

A 3D sky dome with the path of the sun (and the moon at night), based on my *Sun Position Card*. Clouds, rain, snow and lightning of the current weather can be shown inside the dome.

**Default size:** 6×4 · **Data:** `sun.sun` (or `sun_entity`), otherwise calculated from your HA location.

| Option | Default | Description |
| --- | --- | --- |
| `show_times` | `true` | Show sunrise / sunset times |
| `show_track` | `true` | Show the path of the sun |
| `show_moon` | `true` | Show the moon at night |
| `weather_overlay` | `true` | Show weather effects (clouds, rain, …) |
| `show_info` | `false` | Show elevation and azimuth |
| `show_island` | `false` | Fill the ground of the dome with the **3D island** from *3D weather* – green lawn (or snow, frost, drought) over the whole ground with trees, lake, house, wind turbine / windsock standing on it, with all its weather details (house, wind turbine / windsock, trees, seasons, snow, frost …). Clouds and rain are shown by the dome itself |
| `wind_object` | `both` | With island: wind turbine, windsock or both |
| `show_values` | `false` | Weather values in the free top corners next to the dome – temperature top left, air pressure, wind (arrow in wind direction) and humidity top right. The dome keeps its size |
| `season` | `auto` | With island: season of the trees |

---

## `sun_times` – Sunrise & sunset

A small sun arc with sunrise, sunset, day length and remaining daylight. At night a faint sun at the horizon shows where the sun will come up next (no moon here – the moon has its own element).

**Default size:** 3×2

| Option | Default | Description |
| --- | --- | --- |
| `show_day_length` | `true` | Show the length of the day |
| `show_remaining` | `true` | Show the remaining daylight |
| `sun_size` | `100` | Size of the sun on the arc in % (50 – 250) |
| `animate_sun` | `false` | Animate the sun (rotating rays, pulsing glow) |

---

## `moon`

The moon in its real phase with illumination, moonrise / moonset and the next full / new moon.

**Default size:** 3×2 · **Data:** `sensor.moon_phase` (or `moon_entity`) for the phase; illumination and times are calculated.

| Option | Default | Description |
| --- | --- | --- |
| `entity` | `sensor.moon_phase` | Moon phase sensor |
| `show_times` | `true` | Show moonrise and moonset |
| `show_next` | `true` | Show the next full / new moon |

---

## `forecast_daily` – Daily forecast

The forecast for the next days. Two views:

- **List** – one row per day: icon, rain probability, low, a temperature bar, high.
- **Columns** – one column per day with a **temperature curve**, optional humidity curve, rain bars, rain probability and a wind row. The curve changes color with the temperature (see [Color scales](color-scales.md)), so a rise from −1 °C to 4 °C is visible at once.

**Swipe:** the card loads up to **16 days**. `days` is the number of days that are visible at once – wipe left / right (or drag with the mouse) to see the following days. No scrollbars, nothing to switch on.

**Default size:** 6×4

| Option | Default | Description |
| --- | --- | --- |
| `days` | `5` | Days visible at once (2–16). More days are reached by swiping |
| `variant` | `auto` | `list` / `columns` / `auto` (list in compact elements, columns in wide, flat elements) |
| `show_precip` | `true` | Show the rain probability |
| `show_bars` | `true` | *List:* show the temperature bars |
| `show_temp_line` | `false` | *Columns:* show the temperature curve |
| `show_humidity_line` | `false` | *Columns:* show a humidity curve |
| `animate_low` | `false` | *Columns:* the dashed low-temperature line runs like a train (needs `show_temp_line`) |
| `show_rain_bars` | `true` | *Columns:* show the rain bars |
| `show_pop` | `true` | *Columns:* show the rain probability (needs `show_precip`) |
| `show_wind` | `false` | *Columns:* show a wind row – an arrow in the wind direction, colored by wind strength, with the speed |
| `animated` | `false` | Animate the weather icons |

> With many visible days (more than 10 / 13) the card automatically switches to a denser layout and hides the wind values.

```yaml
- type: forecast_daily
  variant: columns
  days: 7
  show_temp_line: true
  animate_low: true
  show_wind: true
  x: 0
  y: 4
  w: 6
  h: 5
```

---

## `forecast_hourly` – Hourly forecast

The next hours as a row of icons and temperatures. With `show_chart` it becomes a temperature chart like the daily forecast.

**Swipe:** up to **48 hours** are loaded, `hours` is the number of visible hours – wipe to see later hours.

**Default size:** 6×2

| Option | Default | Description |
| --- | --- | --- |
| `hours` | `12` | Hours visible at once (3–48) |
| `step` | `1` | Show every n-th hour (1–6) |
| `show_precip` | `true` | Show the rain probability |
| `show_chart` | `false` | Show the temperature curve (temperature-colored) |
| `show_humidity_line` | `false` | *With chart:* humidity curve |
| `show_rain_bars` | `true` | *With chart:* rain bars |
| `show_pop` | `true` | *With chart:* rain probability (needs `show_precip`) |
| `show_wind` | `false` | *With chart:* wind row |
| `animated` | `false` | Animate the weather icons |

---

## `chart` – Temperature & humidity trend

A line chart of the temperature (optionally with humidity) over the next hours or days, with rain bars and a "now" marker.

**Swipe:** the chart holds up to 48 hours (or 16 days); `range` is the visible window.

**Default size:** 6×3

| Option | Default | Description |
| --- | --- | --- |
| `series` | `temperature` | `temperature` or `temperature_humidity` |
| `range` | `24` | Visible window: `12` / `24` / `48` hours or `daily` (days) |
| `show_precip` | `true` | Show rain bars |
| `show_values` | `true` | Show the values in the chart |
| `show_now` | `true` | Mark "now" |

---

## `radar` – Rain radar

An animated radar loop over a map, centered on your location.

**Default size:** 6×5 · **Data:** DWD radar (Germany) or RainViewer (worldwide, max. zoom 7). Base map: Esri (no key needed), OpenStreetMap or CARTO (own free API key).

| Option | Default | Description |
| --- | --- | --- |
| `provider` | `auto` | `auto` / `dwd` / `rainviewer` |
| `zoom` | `7` | Map zoom (4–10) |
| `frames` | `7` | Number of radar images |
| `speed` | `600` | Time per image in ms |
| `map_style` | `auto` | `auto` (follows the HA theme) / `light` / `dark` |
| `map_source` | `esri` | `esri` / `osm` / `carto` |
| `map_key` | *(none)* | CARTO API key (only for `carto`, [request here](https://carto.com/basemaps/apikey/)) |
| `show_labels` | `true` | Place names above the radar |
| `show_marker` | `true` | Marker for your location |
| `show_time` | `true` | Time of the shown image |

---

## `sensor` – Any entity

A small tile for any Home Assistant entity (switch, light, sensor, …).

**Default size:** 2×1

| Option | Default | Description |
| --- | --- | --- |
| `entity` | *(none)* | The entity |
| `name` | *(entity name)* | Own name |
| `icon` | *(entity icon)* | Own icon |
| `tap` | `auto` | `auto` (toggle for switches / lights, otherwise more-info) / `more-info` / `toggle` / `none` |

---

## `image` – Image / iFrame

Shows a picture (updated regularly) or embeds a web page. Many weather pages are available as **presets**:

| Preset | What it shows |
| --- | --- |
| `windy` | Windy weather map – centered on your location, layer selectable with `overlay` |
| `wetteronline` | WetterOnline rain radar – centered on your location |
| `radarfilm_de` | Radar loop for Germany from wetterdienst.de (GIF, reloads every 5 minutes) |
| `dwd_warnings` | DWD warning map (`SchilderPD.jpg`) – replace the `PD` in the file name with the code of your region |
| `custom` | Your own `url` |

**Default size:** 6×4

| Option | Default | Description |
| --- | --- | --- |
| `preset` | `custom` | See table above |
| `overlay` | `temp` | *Windy:* `temp` / `rain` / `wind` / `clouds` / `pressure` |
| `zoom` | `6` (Windy) / `8` (WetterOnline) | *Windy / WetterOnline:* map zoom (3–12) |
| `url` | *(none)* | Image or page address (`custom` and the static presets) |
| `mode` | `auto` | `auto` (image files are shown as image, everything else as iFrame) / `image` / `iframe` |
| `fit` | `cover` | `cover` (fill) or `contain` (show completely) |
| `refresh` | `0` | Reload every n seconds (0 = never) |

> **Good to know:** some websites do not allow being embedded in an iFrame. In that case use the picture URL of the page instead.

```yaml
- type: image
  preset: windy
  overlay: rain
  zoom: 6
  x: 0
  y: 9
  w: 6
  h: 5
```

---

## `card` – Any Lovelace card

Embeds any other Lovelace card inside the layout (e.g. a graph, a button or a camera card).

**Default size:** 6×4

| Option | Description |
| --- | --- |
| `card` | The configuration of the embedded card (YAML) |

```yaml
- type: card
  card:
    type: history-graph
    entities:
      - sensor.balcony_temperature
  x: 0
  y: 14
  w: 6
  h: 4
```
