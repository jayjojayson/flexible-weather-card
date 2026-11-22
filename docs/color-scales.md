# Color scales

The temperature and wind colors are used in the forecast curves, the thermometer, the wind row and the weather scene. They are the same everywhere, so a color always means the same thing.

## Temperature

The colors change **smoothly** between the points. Around 0 °C the steps are small, so a rise from below freezing to a few degrees above is clearly visible.

| °C | Color | |
| --- | --- | --- |
| −20 | `#8e24aa` | violet |
| −12 | `#5e35b1` | dark violet |
| −6 | `#3949ab` | indigo |
| −2 | `#1e88e5` | blue |
| 0 | `#039be5` | light blue |
| 2 | `#00acc1` | cyan |
| 4 | `#00897b` | teal |
| 6 | `#26a69a` | turquoise |
| 9 | `#43a047` | green |
| 13 | `#7cb342` | light green |
| 17 | `#c0ca33` | lime |
| 21 | `#fdd835` | yellow |
| 25 | `#ffb300` | amber |
| 28 | `#fb8c00` | orange |
| 31 | `#f4511e` | deep orange |
| 35 | `#e53935` | red |
| 40 | `#b71c1c` | dark red |

Fahrenheit values are converted to °C before the color is chosen.

**Where it is used:** curves in the *Daily forecast*, *Hourly forecast* and *Temperature & humidity trend* (the line changes color along its height), the `temp_colors` option of *Current weather*, *Temperature* and *Single value*, and the thermometer. The low-temperature line in the daily forecast is always gray.

## Wind

Green = light wind, yellow / orange = strong wind, red = storm, violet = hurricane force.

| m/s | Color | Meaning (Beaufort) |
| --- | --- | --- |
| 0 | `#81c784` | calm |
| 3.4 | `#4caf50` | gentle breeze (3) |
| 5.5 | `#7cb342` | moderate breeze (4) |
| 8 | `#c0ca33` | fresh breeze (5) |
| 10.8 | `#fdd835` | strong breeze (6) |
| 13.9 | `#ffb300` | near gale (7) |
| 17.2 | `#fb8c00` | gale (8) |
| 20.8 | `#f4511e` | strong gale (9) |
| 24.5 | `#e53935` | storm (10) |
| 28.5 | `#c62828` | violent storm (11) |
| 32.7 | `#8e24aa` | hurricane (12) |

**Where it is used:** wind arrow and speed in the wind row of the forecasts.

## Thermometer

The scale of the thermometer in the *Temperature* element runs from −15 °C to 40 °C. The fill level shows the current temperature, the fill color follows the temperature scale above.
