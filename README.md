
[![hacs_badge](https://img.shields.io/badge/HACS-Default%20✔-brightgreen.svg)](https://github.com/hacs/plugin)
[![HACS validation](https://img.shields.io/github/actions/workflow/status/jayjojayson/flexible-weather-card/validate.yml?label=HACS%20Validation)](https://github.com/jayjojayson/flexible-weather-card/actions?query=workflow%3Avalidate)
![Downloads](https://img.shields.io/github/downloads/jayjojayson/flexible-weather-card/total?label=Downloads&color=blue) 
[![GitHub release](https://img.shields.io/github/release/jayjojayson/flexible-weather-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/flexible-weather-card/releases/)
[![Support](https://img.shields.io/badge/%20-Support%20Me-steelblue?style=flat&logo=paypal&logoColor=white)](https://www.paypal.me/quadFlyerFW)
![stars](https://img.shields.io/github/stars/jayjojayson/flexible-weather-card)

---

> UNDER PROCESS; NOT YET FINISHED

---

# 🌤️ Flexible Weather Card

The **Flexible Weather Card** is a highly customizable Lovelace Card for Home Assistant that displays weather data, entities, embedded iFrames/images, and even other cards – all in a flexible grid layout.

The card supports three weather modes: HA weather entity, manual sensors, or no weather display at all. It is fully configurable via the built-in visual editor – no YAML required.

German translations for all weather states are included.

If you like the Card, I would appreciate a Star rating ⭐ from you. 🤗

## Features
- ### 🌡️ **Weather Display** – via HA weather entity or manual sensors
- ### 🖼️ **Embedded iFrames / Images / GIFs** – configurable grid
- ### 🔘 **Entity Grid** – toggle switches/lights, show sensor states
- ### 🃏 **Child Cards** – embed any HA card inside
- ### 📐 **Flexible Grid Layout** – adjustable columns & positions
- ### 🎨 **Temperature Color Coding** – automatic color by temperature range
- ### 🔄 **Multiple Layout Modes** – Default, Swap, Horizontal
- ### 🖥️ **Compact Mode** – borderless display option
- ### 🌐 **German Weather Translations** – automatic translation of weather states
- ### ⚙️ **Full Visual Editor** – complete GUI configuration

---

## Installation

### HACS (Recommended)

- Add this repository to HACS. To do so, use the following link.

 [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=flexible-weather-card&category=plugin)

- The "Flexible Weather Card" should now be available in HACS. Click "INSTALL".
- The resource will be added to your Lovelace configuration automatically.

<details>
  <summary> <b>Manual Installation via HACS</b></summary>  

1.  Open HACS in Home Assistant.
2.  Go to "Frontend" and click the three dots in the top right corner.
3.  Select "Custom repositories".
4.  Add the URL `https://github.com/jayjojayson/flexible-weather-card` and select "Lovelace" as the category.
5.  Click "ADD".
6.  The "Flexible Weather Card" should now be available in HACS. Click "INSTALL".
7.  The resource will be added to your Lovelace configuration automatically.
</details>

<details>
  <summary> <b>Manual Installation in HA</b></summary>  

### Manual Installation

1.  Download the `flexible-weather-card.js` from the [latest release](https://github.com/jayjojayson/flexible-weather-card/releases).
2.  Place the file in `config/www/community/flexible-weather-card/`.
3.  Add the resource to your Lovelace configuration through the Home Assistant UI:
    a. Go to "Settings" -> "Dashboards".
    b. Click on the three dots in the top right corner and select "Resources".
    c. Click on "+ ADD RESOURCE".
    d. Enter `/local/community/flexible-weather-card/flexible-weather-card.js` as the URL and select "JavaScript Module" as the Resource type.
    e. Click "CREATE".
4.  Restart Home Assistant.
</details>

---

## Configuration

The card is fully configurable via the visual editor. You can also configure it manually using the YAML editor:

### General & Weather Options

| Name                  | Type      | Required | Description                                                        | Default                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------ | ---------------------- |
| `type`                | `string`  | Yes      | `custom:flexible-weather-card`                                     |                        |
| `title`               | `string`  | No       | Card title                                                         | `"Wetter Übersicht"`   |
| `weather_source`      | `string`  | No       | Weather data source: `none`, `entity`, `manual`                    | `"none"`               |
| `weather_entity`      | `string`  | No       | Weather entity (when source = `entity`), e.g. `weather.home`       |                        |
| `temp_entity`         | `string`  | No       | Temperature sensor (when source = `manual`)                        |                        |
| `hum_entity`          | `string`  | No       | Humidity sensor (when source = `manual`)                           |                        |
| `press_entity`        | `string`  | No       | Custom sensor 1 (when source = `manual`)                           |                        |
| `extra_sensor_1`      | `string`  | No       | Custom sensor 2 (when source = `manual`)                           |                        |
| `extra_sensor_2`      | `string`  | No       | Custom sensor 3 (when source = `manual`)                           |                        |
| `enable_temp_color`   | `boolean` | No       | Color-code temperature by range (when source = `manual`)           | `true`                 |

### iFrame / Image Settings

| Name                  | Type      | Required | Description                                                        | Default                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------ | ---------------------- |
| `disable_padding`     | `boolean` | No       | Compact view (no padding for images)                               | `false`                |
| `compact_gap`         | `string`  | No       | Gap in compact mode                                                | `"2px"`                |
| `iframe_height`       | `string`  | No       | Default height for small images/iframes                            | `"200px"`              |
| `hero_iframe_height`  | `string`  | No       | Height for large spanning image                                    | `"300px"`              |
| `iframe_cols`         | `number`  | No       | Number of columns for images/iframes (1–4)                         | `1`                    |

### Entity Settings

| Name                  | Type      | Required | Description                                                        | Default                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------ | ---------------------- |
| `font_size`           | `string`  | No       | Font size for entity tiles                                         | `"14px"`               |
| `entity_cols`         | `number`  | No       | Number of columns for entity grid (1–8)                            | `3`                    |
| `layout_mode`         | `string`  | No       | Entity layout: `default`, `swap`, `horizontal`                     | `"default"`            |
| `entities_position`   | `string`  | No       | Entity position: `top`, `bottom`                                   | `"top"`                |

### Extra Cards Settings

| Name                  | Type      | Required | Description                                                        | Default                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------ | ---------------------- |
| `cards_cols`          | `number`  | No       | Columns for extra cards (1–4)                                      | `1`                    |
| `cards_position`      | `string`  | No       | Position: `bottom`, `middle`, `right`                              | `"bottom"`             |
| `cards_compact`       | `boolean` | No       | Compact view for cards (no border)                                 | `false`                |
| `cards_gap`           | `string`  | No       | Gap between cards in compact mode                                  | `"2px"`                |

### Lists (Arrays)

| Name       | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| `iframes`  | List of iFrame/image URLs: `[{ url: "..." }]`                                       |
| `entities` | List of entities: `[{ entity: "...", name: "...", icon: "..." }]`                    |
| `cards`    | List of embedded HA cards: `[{ card_config: { type: "...", ... } }]`                 |


### Simple Example

```yaml
type: custom:flexible-weather-card
title: Weather
weather_source: entity
weather_entity: weather.home
```

### Advanced Example

```yaml
type: custom:flexible-weather-card
title: Wetter Übersicht
weather_source: entity
weather_entity: weather.home
iframe_cols: 2
iframe_height: 200px
iframes:
  - url: "https://example.com/radar.gif"
  - url: "https://example.com/forecast.png"
entity_cols: 4
entities_position: top
layout_mode: default
entities:
  - entity: sensor.temperature
    name: Temperatur
    icon: mdi:thermometer
  - entity: light.living_room
    name: Licht
    icon: mdi:lightbulb
cards_cols: 1
cards_position: bottom
cards:
  - card_config:
      type: custom:mini-graph-card
      entities:
        - sensor.temperature
```

---

## CSS Elements You Can Target for Styling

| Selector                  | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `ha-card`                 | The entire card container                                         |
| `ha-card.compact`         | Card in compact mode                                              |
| `.content-wrapper`        | Main layout container                                             |
| `.weather-section`        | Weather area container                                            |
| `.card-header`            | Title row                                                         |
| `.current-weather-container` | Manual weather block (temp + details)                          |
| `.weather-main`           | Large temperature display                                         |
| `.weather-main.temp-very-cold` | Temperature < 0°C (steelblue)                               |
| `.weather-main.temp-cold` | Temperature 0–9°C (#2196F3)                                      |
| `.weather-main.temp-moderate` | Temperature 10–21°C (#4CAF50)                                |
| `.weather-main.temp-warm` | Temperature 22–27°C (orange)                                     |
| `.weather-main.temp-hot`  | Temperature ≥ 28°C (#F44336)                                     |
| `.weather-details`        | Container for humidity/pressure/extras                            |
| `.detail-item`            | Individual detail value                                           |
| `.weather-entity-view`    | HA weather entity block                                           |
| `.we-state`               | Weather status display                                            |
| `.we-temp-big`            | Large temperature value                                           |
| `.we-attributes`          | Weather attributes (pressure, wind, etc.)                         |
| `.iframe-grid`            | iFrame/image grid                                                 |
| `.iframe-wrapper`         | Individual iFrame/image container                                 |
| `.entity-grid`            | Entity tile grid                                                  |
| `.weather-item`           | Individual entity tile                                            |
| `.weather-item.active`    | Active switch/light tile                                          |
| `.weather-item .icon`     | Icon in entity tile                                               |
| `.weather-item .state`    | State text in entity tile                                         |
| `.weather-item .label`    | Label/name in entity tile                                         |
| `.extras-section`         | Child cards container                                             |
| `.extra-cards-grid`       | Grid for embedded cards                                           |


### Examples

Here are some examples of how you can use `card-mod` in the YAML configuration of your card.

#### Change Font Size and Color

```yaml
type: custom:flexible-weather-card
weather_source: entity
weather_entity: weather.home
card_mod:
  style: |
    .weather-main {
      font-size: 48px;
      color: dodgerblue;
    }
    .weather-item .state {
      font-size: 14px;
      color: #888;
    }
```

#### Change Background and Remove Shadows

```yaml
type: custom:flexible-weather-card
weather_source: entity
weather_entity: weather.home
card_mod:
  style: |
    ha-card {
      background: #FFFACD;
      box-shadow: none;
    }
```

