import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import { updateSetting } from "../util/updateSetting";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderBackgroundSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const farSection = createSettingSection(
        containerEl,
        "Far Stars",
        {
            description:
                "Subtle stars behind the graph."
        }
    );

    addSectionReset(
        farSection,
        plugin,
        [
            "backgroundFarStarCount",
            "backgroundFarStarMinSize",
            "backgroundFarStarMaxSize",
            "backgroundFarParallax",
            "backgroundFarDriftSeconds"
        ]
    );

    new Setting(farSection.contentEl)
        .setName("Amount")
        .setDesc("Amount of stars.")
        .addSlider(slider => {
            slider
                .setLimits(0, 1000, 10)
                .setValue(plugin.settings.backgroundFarStarCount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "backgroundFarStarCount",
                        value
                    );
                });
        });

    new Setting(farSection.contentEl)
        .setName("Size")
        .setDesc("Overall size of these stars.")
        .addSlider(slider => {
            slider
                .setLimits(0.2, 3, 0.1)
                .setValue(
                    getFarStarSize(
                        plugin
                    )
                )
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.backgroundFarStarMinSize =
                        value * 0.5;

                    plugin.settings.backgroundFarStarMaxSize =
                        value * 1.4;

                    await plugin.saveSettings();
                });
        });

    new Setting(farSection.contentEl)
        .setName("Mouse movement")
        .setDesc("How much these stars move with the mouse.")
        .addSlider(slider => {
            slider
                .setLimits(0, 30, 1)
                .setValue(plugin.settings.backgroundFarParallax)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "backgroundFarParallax",
                        value
                    );
                });
        });

    const nearSection = createSettingSection(
        containerEl,
        "Near Stars",
        {
            description:
                "Brighter stars that sit closer to the graph."
        }
    );

    addSectionReset(
        nearSection,
        plugin,
        [
            "backgroundNearStarCount",
            "backgroundNearStarMinSize",
            "backgroundNearStarMaxSize",
            "backgroundNearParallax",
            "backgroundNearDriftSeconds"
        ]
    );

    new Setting(nearSection.contentEl)
        .setName("Amount")
        .setDesc("Amount of stars.")
        .addSlider(slider => {
            slider
                .setLimits(0, 600, 10)
                .setValue(plugin.settings.backgroundNearStarCount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "backgroundNearStarCount",
                        value
                    );
                });
        });

    new Setting(nearSection.contentEl)
        .setName("Size")
        .setDesc("Overall size of these stars.")
        .addSlider(slider => {
            slider
                .setLimits(0.4, 5, 0.1)
                .setValue(
                    getNearStarSize(
                        plugin
                    )
                )
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.backgroundNearStarMinSize =
                        value * 0.5;

                    plugin.settings.backgroundNearStarMaxSize =
                        value * 1.4;

                    await plugin.saveSettings();
                });
        });

    new Setting(nearSection.contentEl)
        .setName("Mouse movement")
        .setDesc("How much these stars move with the mouse.")
        .addSlider(slider => {
            slider
                .setLimits(0, 50, 1)
                .setValue(plugin.settings.backgroundNearParallax)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "backgroundNearParallax",
                        value
                    );
                });
        });

    const styleSection = createSettingSection(
        containerEl,
        "Star Style",
        {
            description:
                "Shared brightness and color for background stars."
        }
    );

    addSectionReset(
        styleSection,
        plugin,
        [
            "backgroundStarMinAlpha",
            "backgroundStarMaxAlpha",
            "backgroundStarHueMin",
            "backgroundStarHueMax",
            "backgroundPulseChance"
        ]
    );

    new Setting(styleSection.contentEl)
        .setName("Brightness")
        .setDesc("Overall brightness of background stars.")
        .addSlider(slider => {
            slider
                .setLimits(0.1, 1, 0.05)
                .setValue(
                    getStarBrightness(
                        plugin
                    )
                )
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.backgroundStarMinAlpha =
                        value * 0.25;

                    plugin.settings.backgroundStarMaxAlpha =
                        value;

                    await plugin.saveSettings();
                });
        });

    new Setting(styleSection.contentEl)
        .setName("Color")
        .setDesc("Base color of background stars.")
        .addColorPicker(color => {
            color
                .setValue(
                    hueToHex(
                        getStarHue(plugin)
                    )
                )
                .onChange(async value => {
                    const hue =
                        hexToHue(value);

                    plugin.settings.backgroundStarHueMin =
                        hue - 12;

                    plugin.settings.backgroundStarHueMax =
                        hue + 12;

                    await plugin.saveSettings();
                });
        });
}

function getFarStarSize(
    plugin: CosmosGraphPluginType
) {
    return (
        plugin.settings.backgroundFarStarMinSize +
        plugin.settings.backgroundFarStarMaxSize
    ) / 2;
}

function getNearStarSize(
    plugin: CosmosGraphPluginType
) {
    return (
        plugin.settings.backgroundNearStarMinSize +
        plugin.settings.backgroundNearStarMaxSize
    ) / 2;
}

function getStarBrightness(
    plugin: CosmosGraphPluginType
) {
    return plugin.settings.backgroundStarMaxAlpha;
}

function getStarHue(
    plugin: CosmosGraphPluginType
) {
    return (
        plugin.settings.backgroundStarHueMin +
        plugin.settings.backgroundStarHueMax
    ) / 2;
}

function hueToHex(hue: number) {
    const normalizedHue =
        ((hue % 360) + 360) % 360;

    const chroma = 1;
    const x =
        chroma *
        (
            1 -
            Math.abs(
                (normalizedHue / 60) % 2 -
                    1
            )
        );

    let r = 0;
    let g = 0;
    let b = 0;

    if (normalizedHue < 60) {
        r = chroma;
        g = x;
    } else if (normalizedHue < 120) {
        r = x;
        g = chroma;
    } else if (normalizedHue < 180) {
        g = chroma;
        b = x;
    } else if (normalizedHue < 240) {
        g = x;
        b = chroma;
    } else if (normalizedHue < 300) {
        r = x;
        b = chroma;
    } else {
        r = chroma;
        b = x;
    }

    const match = 0.7;

    return (
        "#" +
        toHex((r + match) * 0.5 * 255) +
        toHex((g + match) * 0.5 * 255) +
        toHex((b + match) * 0.5 * 255)
    );
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

function toHex(value: number) {
    return (
        "0" +
        Math.max(
            0,
            Math.min(255, Math.round(value))
        ).toString(16)
    ).slice(-2);
}
