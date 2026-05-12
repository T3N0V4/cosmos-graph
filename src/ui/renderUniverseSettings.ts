import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderUniverseSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
        containerEl,
        "Universe",
        "Control star amount, size, color, speed and initial distribution."
    );

    new Setting(section)
        .setName("Initial particles")
        .setDesc("Amount of stars created when the graph opens.")
        .addSlider(slider =>
            slider
                .setLimits(50, 700, 10)
                .setValue(plugin.settings.particleCount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.particleCount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Max particles")
        .setDesc("Maximum amount of ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(50, 1000, 10)
                .setValue(plugin.settings.maxParticles)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.maxParticles = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Base speed")
        .setDesc("Base movement speed of ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(0.02, 1, 0.02)
                .setValue(plugin.settings.baseSpeed)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.baseSpeed = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Star min size")
        .setDesc("Minimum size of ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(0.1, 3, 0.05)
                .setValue(plugin.settings.starMinSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.starMinSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Star max size")
        .setDesc("Maximum size of ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(0.2, 5, 0.05)
                .setValue(plugin.settings.starMaxSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.starMaxSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Star hue min")
        .setDesc("Minimum hue value for ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(0, 360, 1)
                .setValue(plugin.settings.starHueMin)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.starHueMin = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Star hue max")
        .setDesc("Maximum hue value for ambient stars.")
        .addSlider(slider =>
            slider
                .setLimits(0, 360, 1)
                .setValue(plugin.settings.starHueMax)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.starHueMax = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Clean center radius")
        .setDesc("How empty the center starts.")
        .addSlider(slider =>
            slider
                .setLimits(0.05, 0.5, 0.01)
                .setValue(plugin.settings.initialCleanRadiusRatio)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.initialCleanRadiusRatio = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Periphery min radius")
        .setDesc("Minimum initial distance from the center.")
        .addSlider(slider =>
            slider
                .setLimits(0.05, 0.5, 0.01)
                .setValue(plugin.settings.initialMinRadiusRatio)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.initialMinRadiusRatio = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Periphery max radius")
        .setDesc("Maximum initial distance from the center.")
        .addSlider(slider =>
            slider
                .setLimits(0.1, 0.6, 0.01)
                .setValue(plugin.settings.initialMaxRadiusRatio)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.initialMaxRadiusRatio = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Constellation clustering")
        .setDesc("Chance of stars grouping into constellation-like arcs.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.initialClusterChance)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.initialClusterChance = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    const autoSpawnSection = createSettingSection(
        containerEl,
        "Auto Spawn",
        "Control progressive star generation after the universe has started."
    );

    new Setting(autoSpawnSection)
        .setName("Auto spawn")
        .setDesc("Generate new stars progressively.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableAutoSpawn)
                .onChange(async value => {
                    plugin.settings.enableAutoSpawn = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(autoSpawnSection)
        .setName("Auto spawn interval")
        .setDesc("Time between automatic star generation, in milliseconds.")
        .addSlider(slider =>
            slider
                .setLimits(250, 5000, 250)
                .setValue(plugin.settings.autoSpawnIntervalMs)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.autoSpawnIntervalMs = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(autoSpawnSection)
        .setName("Auto spawn amount")
        .setDesc("How many stars are generated per interval.")
        .addSlider(slider =>
            slider
                .setLimits(1, 10, 1)
                .setValue(plugin.settings.autoSpawnAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.autoSpawnAmount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );
}