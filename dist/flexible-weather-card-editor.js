/* * Flexible Weather Card - EDITOR FILE
 * Dateiname: flexible-weather-card-editor.js
 * Version: 4.3
 * Features: 
 * - UI Cleanup: Überschrift "Zusätzliche Cards Liste" entfernt
 */

const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class FlexibleWeatherCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  static get styles() {
    return css`
      .card-config { display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px; }
      .section-header { 
        font-weight: bold; font-size: 1.1em; margin-top: 24px; margin-bottom: 8px; 
        display: block; border-bottom: 1px solid var(--divider-color); padding-bottom: 4px;
        color: var(--primary-text-color);
      }
      .sub-settings { margin-bottom: 16px; }
      .list-row {
        background: var(--secondary-background-color); padding: 12px; border-radius: 8px;
        border: 1px solid var(--divider-color); margin-bottom: 12px;
        display: flex; flex-direction: column; gap: 12px; position: relative;
      }
      .remove-icon-absolute { position: absolute; top: 4px; right: 4px; color: var(--error-color); }
      .entity-options-row { display: flex; gap: 8px; width: 100%; }
      .entity-options-row > * { flex: 1; }
      .iframe-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .iframe-row ha-textfield { flex-grow: 1; }
      .add-button { margin-top: 8px; width: 100%; }
    `;
  }

  setConfig(config) {
    this._config = config;
  }

  _fireConfigChanged(newConfig) {
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _genericConfigChanged(ev) {
    this._fireConfigChanged(ev.detail.value);
  }

  /* --- IFRAME LOGIK --- */
  _addIframe() {
    const newIframes = [...(this._config.iframes || [])];
    newIframes.push({ url: "" });
    this._fireConfigChanged({ ...this._config, iframes: newIframes });
  }
  _removeIframe(index) {
    const newIframes = [...(this._config.iframes || [])];
    newIframes.splice(index, 1);
    this._fireConfigChanged({ ...this._config, iframes: newIframes });
  }
  _editIframeUrl(index, value) {
    const newIframes = [...(this._config.iframes || [])];
    newIframes[index] = { ...newIframes[index], url: value };
    this._fireConfigChanged({ ...this._config, iframes: newIframes });
  }

  /* --- ENTITY LOGIK --- */
  _addEntity() {
    const newEntities = [...(this._config.entities || [])];
    newEntities.push({ entity: "", name: "", icon: "" });
    this._fireConfigChanged({ ...this._config, entities: newEntities });
  }
  _removeEntity(index) {
    const newEntities = [...(this._config.entities || [])];
    newEntities.splice(index, 1);
    this._fireConfigChanged({ ...this._config, entities: newEntities });
  }
  _editEntity(index, key, value) {
    const newEntities = [...(this._config.entities || [])];
    newEntities[index] = { ...newEntities[index], [key]: value };
    this._fireConfigChanged({ ...this._config, entities: newEntities });
  }

  /* --- CARD LOGIK --- */
  _addCard() {
    const newCards = [...(this._config.cards || [])];
    newCards.push({ card_config: {} }); 
    this._fireConfigChanged({ ...this._config, cards: newCards });
  }
  _removeCard(index) {
    const newCards = [...(this._config.cards || [])];
    newCards.splice(index, 1);
    this._fireConfigChanged({ ...this._config, cards: newCards });
  }
  _editCardConfig(index, value) {
    const newCards = [...(this._config.cards || [])];
    newCards[index] = { ...newCards[index], card_config: value };
    this._fireConfigChanged({ ...this._config, cards: newCards });
  }


  render() {
    if (!this.hass || !this._config) return html``;

    // --- SCHEMA 1: Allgemein & Wetter ---
    const schemaGeneral = [
      { name: "title", label: "Titel der Karte", selector: { text: {} } },
      
      {
        name: "weather_source",
        label: "Wetterdaten Quelle (Über iFrame)",
        selector: { select: { options: [
            { value: "none", label: "Keine Anzeige" },
            { value: "entity", label: "Wetter Entität (weather.*)" },
            { value: "manual", label: "Manuelle Sensoren" }
        ], mode: "dropdown" } }
      }
    ];

    if (this._config.weather_source === "entity") {
        schemaGeneral.push({ name: "weather_entity", label: "Wetter Integration wählen", selector: { entity: { domain: "weather" } } });
    } else if (this._config.weather_source === "manual") {
        schemaGeneral.push(
            { name: "temp_entity", label: "Temperatur Sensor", selector: { entity: {} } },
            { name: "hum_entity", label: "Luftfeuchte Sensor", selector: { entity: {} } },
            { name: "press_entity", label: "Beliebiger Sensor 1", selector: { entity: {} } },
            { name: "extra_sensor_1", label: "Beliebiger Sensor 2", selector: { entity: {} } },
            { name: "extra_sensor_2", label: "Beliebiger Sensor 3", selector: { entity: {} } },
            { name: "enable_temp_color", label: "Temperatur farblich hervorheben", selector: { boolean: {} } }
        );
    }

    // --- SCHEMA 2: iFrame Einstellungen ---
    const schemaIframeSettings = [
      { name: "disable_padding", label: "Kompaktansicht (Kein Rand bei Bildern)", selector: { boolean: {} } }
    ];
    if (this._config.disable_padding) {
        schemaIframeSettings.push({ name: "compact_gap", label: "Abstand im Kompaktmodus (z.B. 2px)", selector: { text: {} } });
    }
    schemaIframeSettings.push(
      { name: "iframe_height", label: "Höhe Standard (kleine Bilder)", selector: { text: {} } },
      { name: "hero_iframe_height", label: "Höhe Großes Bild (Spalten-Übergreifend)", selector: { text: {} } },
      { name: "iframe_cols", label: "Spalten Bilder / Frames", selector: { number: { min: 1, max: 4, mode: "box" } } }
    );


    // --- SCHEMA 3: Entity Einstellungen ---
    const schemaEntitySettings = [
      { name: "font_size", label: "Schriftgröße (z.B. 16px)", selector: { text: {} } },
      { name: "entity_cols", label: "Spalten Entitäten", selector: { number: { min: 1, max: 8, mode: "box" } } },
      {
        name: "layout_mode",
        label: "Layout Modus Entitäten",
        selector: { select: { options: [
            { value: "default", label: "Standard (Icon oben)" },
            { value: "swap", label: "Wert oben / Icon unten" },
            { value: "horizontal", label: "Nebeneinander (Schmal)" }
        ], mode: "dropdown" } }
      },
      {
        name: "entities_position",
        label: "Position der Entitäten",
        selector: { select: { options: [
            { value: "top", label: "Über den iFrames (Standard)" },
            { value: "bottom", label: "Unter den iFrames" }
        ], mode: "dropdown" } }
      }
    ];

    // --- SCHEMA 4: EXTRA CARDS SETTINGS ---
    const schemaCardsSettings = [
      { name: "cards_cols", label: "Spalten für Extra Cards", selector: { number: { min: 1, max: 4, mode: "box" } } },
      {
        name: "cards_position",
        label: "Position der Extra Cards",
        selector: { select: { options: [
            { value: "bottom", label: "Unten (Unter allem)" },
            { value: "middle", label: "Direkt unter Wetterdaten (Mitte)" },
            { value: "right", label: "Rechts (Nebeneinander)" }
        ], mode: "dropdown" } }
      },
      { name: "cards_compact", label: "Kompaktansicht Cards (Kein Rand)", selector: { boolean: {} } }
    ];
    if (this._config.cards_compact) {
        schemaCardsSettings.push({ name: "cards_gap", label: "Abstand Cards (z.B. 2px)", selector: { text: {} } });
    }

    const iframes = this._config.iframes || [];
    const entities = this._config.entities || [];
    const extraCards = this._config.cards || [];
    const entitySelector = { entity: {} };
    const cardSelector = { object: {} };

    return html`
      <div class="card-config">
        
        <ha-form .hass=${this.hass} .data=${this._config} .schema=${schemaGeneral} .computeLabel=${(s) => s.label} @value-changed=${this._genericConfigChanged}></ha-form>

        <div>
            <span class="section-header">iFrame Settings</span>
            <div class="sub-settings">
                <ha-form .hass=${this.hass} .data=${this._config} .schema=${schemaIframeSettings} .computeLabel=${(s) => s.label} @value-changed=${this._genericConfigChanged}></ha-form>
            </div>
            ${iframes.map((frame, index) => html`
              <div class="iframe-row">
                  <ha-textfield label="URL (Webseite oder Bild-Link)" .value="${frame.url || ''}" @input="${(e) => this._editIframeUrl(index, e.target.value)}"></ha-textfield>
                <ha-icon-button .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"} @click="${() => this._removeIframe(index)}"></ha-icon-button>
              </div>
            `)}
            <mwc-button class="add-button" outlined @click="${this._addIframe}">
              <ha-icon icon="mdi:plus" style="margin-right: 8px;"></ha-icon> iFrame / Bild / GIF hinzufügen
            </mwc-button>
        </div>

        <div>
            <span class="section-header">Entitäten Settings (Wetter, Schalter)</span>
            <div class="sub-settings">
                <ha-form .hass=${this.hass} .data=${this._config} .schema=${schemaEntitySettings} .computeLabel=${(s) => s.label} @value-changed=${this._genericConfigChanged}></ha-form>
            </div>
            ${entities.map((item, index) => html`
              <div class="list-row">
                <ha-icon-button class="remove-icon-absolute" .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"} @click="${() => this._removeEntity(index)}"></ha-icon-button>
                <ha-selector .hass=${this.hass} .selector=${entitySelector} .value=${item.entity} .label=${"Entität auswählen"} @value-changed="${(e) => this._editEntity(index, 'entity', e.detail.value)}"></ha-selector>
                <div class="entity-options-row">
                    <ha-textfield label="Name (optional)" .value=${item.name || ""} @input="${(e) => this._editEntity(index, 'name', e.target.value)}"></ha-textfield>
                    <ha-icon-picker .hass=${this.hass} .value=${item.icon || ""} label="Icon" @value-changed="${(e) => this._editEntity(index, 'icon', e.target.value)}"></ha-icon-picker>
                </div>
              </div>
            `)}
            <mwc-button class="add-button" outlined @click="${this._addEntity}">
              <ha-icon icon="mdi:plus" style="margin-right: 8px;"></ha-icon> Entität hinzufügen
            </mwc-button>
        </div>

        <div>
            <span class="section-header">Zusätzliche Cards Settings</span>
            <div class="sub-settings">
                <ha-form .hass=${this.hass} .data=${this._config} .schema=${schemaCardsSettings} .computeLabel=${(s) => s.label} @value-changed=${this._genericConfigChanged}></ha-form>
            </div>
            
            ${extraCards.map((cardItem, index) => html`
              <div class="list-row">
                <ha-icon-button class="remove-icon-absolute" .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"} @click="${() => this._removeCard(index)}"></ha-icon-button>
                <ha-selector .hass=${this.hass} .selector=${cardSelector} .value=${cardItem.card_config} .label=${"Card Konfiguration (YAML/Objekt)"} @value-changed="${(e) => this._editCardConfig(index, e.detail.value)}"></ha-selector>
              </div>
            `)}
            <mwc-button class="add-button" outlined @click="${this._addCard}">
              <ha-icon icon="mdi:plus" style="margin-right: 8px;"></ha-icon> Card hinzufügen
            </mwc-button>
        </div>

      </div>
    `;
  }
}

customElements.define("flexible-weather-card-editor", FlexibleWeatherCardEditor);
