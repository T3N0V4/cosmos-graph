import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderUniverseSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
    containerEl,
    "Particles",
        {
            description: "Base appearance of ambient particles."
        }
    );

    addSectionReset(
        section,
        plugin,
        [
            "autoSpawnAmount",
            "initialCleanRadiusRatio",
            "initialMinRadiusRatio",
            "initialMaxRadiusRatio",
            "initialClusterChance",
            "starMinSize",
            "starMaxSize",
            "starHueMin",
            "starHueMax",
            "particleColor",
            "baseSpeed",
            "particleGlow",
            "particleBrightness"
        ]
    );

const sectionEl = section.contentEl;

    new Setting(sectionEl)
        .setName("Particle base speed")
        .setDesc("Base movement speed of ambient particles.")
        .addSlider(slider =>
            slider
                .setLimits(0.02, 1, 0.02)
                .setValue(plugin.settings.baseSpeed)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.baseSpeed = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Particle color")
        .setDesc("Base color used by ambient particles.")
        .addColorPicker(color =>
            color
                .setValue(
                    getValidHexColor(
                        plugin.settings.particleColor
                    )
                )
                .onChange(async value => {
                    const hue = hexToHue(value);

                    plugin.settings.particleColor = value;
                    plugin.settings.starHueMin = hue;
                    plugin.settings.starHueMax = hue;

                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Particle glow")
        .setDesc("Base glow intensity of ambient particles.")
        .addSlider(slider =>
            slider
                .setLimits(0, 0.4, 0.01)
                .setValue(plugin.settings.particleGlow)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.particleGlow = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Particle brightness")
        .setDesc("Brightness multiplier for ambient particles.")
        .addSlider(slider =>
            slider
                .setLimits(0.2, 2, 0.05)
                .setValue(plugin.settings.particleBrightness)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.particleBrightness = value;
                    await plugin.saveSettings();
                })
        );
}

function getValidHexColor(value: string) {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        return value;
    }

    return "#7db7ff";
}

function hexToHue(hex: string) {
    const cleanHex = hex.replace("#", "");

    const r =
        parseInt(cleanHex.substring(0, 2), 16) / 255;

    const g =
        parseInt(cleanHex.substring(2, 4), 16) / 255;

    const b =
        parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) {
        return 0;
    }

    let hue = 0;

    if (max === r) {
        hue = ((g - b) / delta) % 6;
    } else if (max === g) {
        hue = (b - r) / delta + 2;
    } else {
        hue = (r - g) / delta + 4;
    }

    return Math.round((hue * 60 + 360) % 360);
}
