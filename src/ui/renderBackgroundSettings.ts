import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderBackgroundSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
        containerEl,
        "Background Stars",
        "Configure the static starfield layers behind the graph."
    );

    new Setting(section)
        .setName("Far star count")
        .setDesc("Amount of small stars in the far background layer.")
        .addSlider((slider) => {
            slider
                .setLimits(0, 1000, 10)
                .setValue(plugin.settings.backgroundFarStarCount)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundFarStarCount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Near star count")
        .setDesc("Amount of brighter stars in the near background layer.")
        .addSlider((slider) => {
            slider
                .setLimits(0, 600, 10)
                .setValue(plugin.settings.backgroundNearStarCount)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundNearStarCount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Far star min size")
        .addSlider((slider) => {
            slider
                .setLimits(0.1, 2, 0.1)
                .setValue(plugin.settings.backgroundFarStarMinSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundFarStarMinSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Far star max size")
        .addSlider((slider) => {
            slider
                .setLimits(0.2, 4, 0.1)
                .setValue(plugin.settings.backgroundFarStarMaxSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundFarStarMaxSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Near star min size")
        .addSlider((slider) => {
            slider
                .setLimits(0.2, 4, 0.1)
                .setValue(plugin.settings.backgroundNearStarMinSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundNearStarMinSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Near star max size")
        .addSlider((slider) => {
            slider
                .setLimits(0.4, 6, 0.1)
                .setValue(plugin.settings.backgroundNearStarMaxSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundNearStarMaxSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Minimum brightness")
        .addSlider((slider) => {
            slider
                .setLimits(0.05, 1, 0.05)
                .setValue(plugin.settings.backgroundStarMinAlpha)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundStarMinAlpha = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Maximum brightness")
        .addSlider((slider) => {
            slider
                .setLimits(0.1, 1, 0.05)
                .setValue(plugin.settings.backgroundStarMaxAlpha)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundStarMaxAlpha = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Hue min")
        .setDesc("HSL hue value. 200 blue/cyan, 240 blue, 280 violet.")
        .addSlider((slider) => {
            slider
                .setLimits(0, 360, 1)
                .setValue(plugin.settings.backgroundStarHueMin)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundStarHueMin = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Hue max")
        .addSlider((slider) => {
            slider
                .setLimits(0, 360, 1)
                .setValue(plugin.settings.backgroundStarHueMax)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundStarHueMax = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Far parallax")
        .addSlider((slider) => {
            slider
                .setLimits(0, 30, 1)
                .setValue(plugin.settings.backgroundFarParallax)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundFarParallax = value;
                    await plugin.saveSettings();
                });
        });

    new Setting(section)
        .setName("Near parallax")
        .addSlider((slider) => {
            slider
                .setLimits(0, 50, 1)
                .setValue(plugin.settings.backgroundNearParallax)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundNearParallax = value;
                    await plugin.saveSettings();
                });
        });

    new Setting(section)
        .setName("Far drift duration")
        .setDesc("Higher value = slower movement.")
        .addSlider((slider) => {
            slider
                .setLimits(40, 300, 5)
                .setValue(plugin.settings.backgroundFarDriftSeconds)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundFarDriftSeconds = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Near drift duration")
        .setDesc("Higher value = slower movement.")
        .addSlider((slider) => {
            slider
                .setLimits(40, 240, 5)
                .setValue(plugin.settings.backgroundNearDriftSeconds)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundNearDriftSeconds = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });

    new Setting(section)
        .setName("Pulse chance")
        .setDesc("Percentage of stars that softly pulse.")
        .addSlider((slider) => {
            slider
                .setLimits(0, 0.4, 0.01)
                .setValue(plugin.settings.backgroundPulseChance)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    plugin.settings.backgroundPulseChance = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                });
        });
}