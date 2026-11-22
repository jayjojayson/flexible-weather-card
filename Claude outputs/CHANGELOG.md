# Changelog

## v2.2

### Current weather
- New display **Weather scene** (`display: scene`): animated sky with realistic, self-shaded clouds, sun with rays, moon in its real phase, stars, rain, snow, hail, lightning, fog and wind.
- Low / high now use your own sensors when you set them (`sensors.temperature_min` / `temperature_max` in the card editor or `min_entity` / `max_entity` of a *Min / max today* element). Without sensors the forecast is used as before.

### 3D and scenes
- New element **3D weather** (`weather3d`, group *Current*): animated 3D diorama – clouds in several depths, rain / hail / snow falling into the scene, lightning, fog at the lake, and a floating island with lake, trees and a wind turbine (rotor speed and direction follow the real wind, trees sway in strong wind). The ground shows rain, drought, snow and ground frost. Glass cards with a light tint show all values (wind, humidity, pressure, precipitation, UV, sunrise / sunset, visibility, dew point, cloud cover) and always keep their text inside. Weather scene, island and temperature field can be switched on / off; with only the island left it fills the whole element. Uses the temperature sensor from the card editor.
- New option **Weather scene** (`show_scene`) for the *Temperature* element: fills the background with the animated weather scene.
- Designer: removed the unused *Close gaps* menu entry and its code.
- 3D weather: new switch **Values in the graphic** (`show_values`) – temperature free at the top left and wind, humidity and air pressure in one free row below the island, without lines or boxes. The island keeps its size and the sun / moon stays free – so the island alone makes a nice dashboard graphic.
- Card: on screens wider than the designer preview (e.g. *Full width* in HA) the card now grows **proportionally** (rows, gaps, text) and looks like in the designer instead of being stretched (`design_width`, `keep_proportions`).
- Designer: new preview widths 1280 and 1600 px, **zoom** (− / + / Fit, Ctrl + mouse wheel, Ctrl + / − / 0), the chosen preview width is remembered by the card; up to 24 columns.
- *Air pressure*: new ring gauge in the style of *Humidity* (colored zones, ticks, pointer, value in the middle) that uses the space better; rating and difference to normal pressure next to / below it (`show_normal`). Both elements now match side by side.
- Designer: dragging and resizing no longer flicker at the edge between two rows / columns – a new cell is only taken once you drag clearly past its middle, so elements can be placed right next to each other without jumping.
- 3D weather: a natural lake with an irregular shore, shallow edge, deeper middle, stones and reeds (reeds sway in the wind, the lake shrinks in drought and freezes in winter); with the weather scene the clouds float higher above the island.
- 3D weather island: windsock (droops in calm air, straight in a storm, points with the wind), hut at the lake with glowing windows and smoking chimney, blinking aviation light at night, puddles, snowman, whirling leaves in a storm, ground fog, lightning strike with flash, ducks / birds / butterflies in nice weather, rainbow after rain, trees change with the seasons (`season`, slightly drier lawn in summer) and the lake freezes below 0 °C. Wind turbine, windsock or both selectable (`wind_object`). The island stands still (no more floating / swaying).
- Performance: animations pause while the card is outside the visible area; the 3D weather renders rain / snow / hail as a few layers instead of many single drops, trees as one plane, smoke, leaves, birds and butterflies run on the GPU, and the sun rays of the weather scenes no longer rotate – much smoother on tablets. Animations respect the device setting *reduce motion* (`respect_reduced_motion`).
- *Humidity* and *Air pressure*: second view **Column** (`view: column`) in the style of *Precipitation* – gauge column, big value, extra value (dew point / 3-hour pressure trend), rating and hourly bars. Hourly pressure comes from the weather integration or Open-Meteo.
- 3D weather: wind turbine and windsock now use map directions (north = up, like the wind arrow) – wind from the lower left makes the windsock point to the upper right.
- Fixes: the wind turbine has a real nacelle (long body with hub) – with wind from east or west you see it from the side and can tell where the wind comes from; column view of *Humidity* / *Air pressure* (and *Precipitation*) keeps its bars in 2-row elements and fits narrow elements; *Moon* no longer overflows on small screens (tablet); *Sunrise / sunset* shows the day length above the arc so the times have room.
- *Sunrise / sunset*: adjustable sun size (`sun_size`) and optional sun animation (`animate_sun`).
- Current weather (scene display) and temperature scene: the same sunrise / sunset atmosphere – warm sky and glow, slightly orange sun.
- 3D weather: sunrise / sunset atmosphere – warm sky, glow at the horizon and evening light while the sun is close to the horizon.
- *Sun position 3D*: optional **3D island** filling the ground of the dome (`show_island`, with wind turbine / windsock choice and season) and optional weather values in the top corners (`show_values`: temperature, air pressure, wind, humidity).
- Rain, hail and snow fall calmer and slower in all animations (weather scene, 3D weather, icons).
- Sensors: an element's own sensor (e.g. in *Humidity*) is used by the whole card if no card sensor is set – order per value: card sensor > element sensor > HA weather integration > Open-Meteo.
- Phones: cards with more than 6 columns are automatically rearranged into at most two columns below 600 px (`mobile_layout`, `mobile_breakpoint`).
- Designer: two new templates – **3D weather detailed** (3D diorama with weather scene, all values and forecasts) and **Dashboard page** (a complete page for the full width, 12 columns – weather map, warning map, 3D island, forecast, weather report, chart, rain radar and all values).
- 3D weather: fixed the layout of 7–9 value cards in narrow elements (under about 330 px), where the cards ran out at the bottom.
- *Temperature*: the weather scene can be used as background (`show_scene`), the layout of the values stays unchanged.

### Forecasts and charts
- **Swipe**: *Daily forecast* (up to 16 days), *Hourly forecast* (up to 48 hours) and *Temperature & humidity trend* can be swiped sideways with the finger or dragged with the mouse. Nothing to switch on, no scrollbars.
- **Temperature-colored curves** in *Daily forecast*, *Hourly forecast* and the trend chart. Finer color steps around 0 °C. See [Color scales](docs/color-scales.md).
- *Daily forecast*: animated low line (`animate_low`), wind row with arrow and speed colored by wind strength (`show_wind`), rain probability can be hidden (`show_pop`), low line in gray.
- *Hourly forecast*: optional temperature chart (`show_chart`) with humidity curve, rain bars, rain probability and wind row.
- Temperature labels in the column view are never drawn inside the curve any more.

### Elements
- *Temperature*: **thermometer** whose fill level and color follow the temperature (`show_thermometer`).
- *Image / iFrame*: **presets** for Windy, WetterOnline, the radar loop of wetterdienst.de and the DWD warning map. Windy and WetterOnline are centered on your location.
- *Sunrise & sunset*: at night a faint sun at the horizon instead of the moon.
- *Min / max today*: the sensor fields show all sensors (no more filtering by device class).

### Documentation
- New [element reference](docs/elements.md) and [color scales](docs/color-scales.md).

## v2.1

- Rain radar: Esri base map as the default (no key needed), place names as separate layer above the radar; OpenStreetMap and CARTO (with your own API key) as alternatives.
- Font scale (`font_scale`) works for all elements.
- Designer: *Close gaps* fixed.
- Several smaller fixes in the designer and elements.

## v2.0

Complete rebuild: the card is now a **freely designable layout**.

- Layout designer with drag & drop, resizing, undo, templates and keyboard shortcuts.
- 25 elements, data from your Home Assistant integrations with an **Open-Meteo** fallback (DWD warnings via Bright Sky).
- Rain radar, weather report, 3D sun dome, animated weather icons, pollen, solar radiation.
- Old v1 configurations are converted automatically.
