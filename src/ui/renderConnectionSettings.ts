import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderConnectionSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
        containerEl,
        "Connections",
        "Control constellation lines, distance, thickness, opacity and color."
    );

    new Setting(section)
        .setName("Enable connections")
        .setDesc("Enable or disable constellation lines.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableConnections)
                .onChange(async value => {
                    plugin.settings.enableConnections = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Connection distance")
        .setDesc("Maximum distance between stars to create connections.")
        .addSlider(slider =>
            slider
                .setLimits(20, 400, 5)
                .setValue(plugin.settings.connectionDistance)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.connectionDistance = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Connection line width")
        .setDesc("Thickness of constellation lines.")
        .addSlider(slider =>
            slider
                .setLimits(0.05, 2, 0.05)
                .setValue(plugin.settings.connectionLineWidth)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.connectionLineWidth = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Connection opacity")
        .setDesc("Base opacity of constellation lines.")
        .addSlider(slider =>
            slider
                .setLimits(0.01, 1, 0.01)
                .setValue(plugin.settings.connectionBaseOpacity)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.connectionBaseOpacity = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Connection color")
        .setDesc("Pick the color used for constellation lines.")
        .addColorPicker(color =>
            color
                .setValue(rgbToHex(plugin.settings.connectionColor))
                .onChange(async value => {
                    plugin.settings.connectionColor = hexToRgb(value);
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );
}

function rgbToHex(rgb: string) {
    const parts = rgb
        .split(",")
        .map(value => Number(value.trim()));

    const r = getValidColorPart(parts[0], 120);
    const g = getValidColorPart(parts[1], 195);
    const b = getValidColorPart(parts[2], 255);

    return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex: string) {
    const cleanHex = hex.replace("#", "");

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
}

function getValidColorPart(
    value: number,
    fallback: number
) {
    if (isNaN(value)) {
        return fallback;
    }

    return Math.max(
        0,
        Math.min(255, Math.round(value))
    );
}

function toHex(value: number) {
    return ("0" + value.toString(16)).slice(-2);
}