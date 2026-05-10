import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import type { PerformanceMode } from "../settings/sections/general";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderGeneralSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
    ) {
        const section = createSettingSection(
        containerEl,
        "General",
        {
            description: "Global systems and basic behavior."
        }
    );

    addSectionReset(
        section,
        plugin,
        [
            "enableBackground",
            "enableParticles",
            "enableShootingStars",
            "enableMouseField",
            "enableParallax",
            "clickEffectMode",
            "particleCount",
            "maxParticles",
            "enableAutoSpawn",
            "autoSpawnIntervalMs",
            "performanceMode"
        ]
    );

const sectionEl = section.contentEl;

    new Setting(sectionEl)
        .setName("Particles")
        .setDesc("Enable or disable ambient particles.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableParticles)
                .onChange(async value => {
                    plugin.settings.enableParticles = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Shooting stars")
        .setDesc("Enable or disable shooting stars.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableShootingStars)
                .onChange(async value => {
                    plugin.settings.enableShootingStars = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Click effect")
        .setDesc("Choose what happens when clicking on the graph.")
        .addDropdown(dropdown =>
            dropdown
                .addOption("none", "None")
                .addOption("radial", "Radial burst")
                .addOption("directional", "Directional burst")
                .addOption("gravity", "Gravity burst")
                .setValue(plugin.settings.clickEffectMode)
                .onChange(async value => {
                    plugin.settings.clickEffectMode = value as any;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Initial particles")
        .setDesc("Amount of particles created when the graph opens.")
        .addSlider(slider =>
            slider
                .setLimits(50, 10000, 10)
                .setValue(plugin.settings.particleCount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.particleCount = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Max particles")
        .setDesc("Maximum amount of particles allowed.")
        .addSlider(slider =>
            slider
                .setLimits(50, 10000, 50)
                .setValue(plugin.settings.maxParticles)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.maxParticles = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Auto spawn")
        .setDesc("Generate new particles progressively.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableAutoSpawn)
                .onChange(async value => {
                    plugin.settings.enableAutoSpawn = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Auto spawn rate")
        .setDesc("Time between automatic particle spawns, in milliseconds.")
        .addSlider(slider =>
            slider
                .setLimits(250, 5000, 250)
                .setValue(plugin.settings.autoSpawnIntervalMs)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.autoSpawnIntervalMs = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Parallax")
        .setDesc("Enable or disable parallax movement.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableParallax)
                .onChange(async value => {
                    plugin.settings.enableParallax = value;
                    await plugin.saveSettings();
                })
        );

    new Setting(sectionEl)
        .setName("Performance mode")
        .setDesc("Choose the global balance between visual quality and performance.")
        .addDropdown(dropdown =>
            dropdown
                .addOption("quality", "Quality")
                .addOption("balanced", "Balanced")
                .addOption("performance", "Performance")
                .setValue(plugin.settings.performanceMode)
                .onChange(async value => {
                    applyPerformanceModePreset(
                        plugin,
                        value as PerformanceMode
                    );

                    await plugin.saveSettings();
                })
        );
}

function applyPerformanceModePreset(
    plugin: CosmosGraphPluginType,
    mode: PerformanceMode
) {
    plugin.settings.performanceMode = mode;

    if (mode === "quality") {
        plugin.settings.particleCount = 1400;
        plugin.settings.maxParticles = 3000;
        plugin.settings.autoSpawnAmount = 4;
        plugin.settings.autoSpawnIntervalMs = 900;

        plugin.settings.enableConnections = true;
        plugin.settings.connectionDistance = 260;
        plugin.settings.maxConnectionsPerParticle = 8;

        plugin.settings.backgroundFarStarCount = 700;
        plugin.settings.backgroundNearStarCount = 320;
        plugin.settings.enableShootingStars = true;
        return;
    }

    if (mode === "balanced") {
        plugin.settings.particleCount = 650;
        plugin.settings.maxParticles = 1200;
        plugin.settings.autoSpawnAmount = 2;
        plugin.settings.autoSpawnIntervalMs = 1400;

        plugin.settings.enableConnections = true;
        plugin.settings.connectionDistance = 180;
        plugin.settings.maxConnectionsPerParticle = 4;

        plugin.settings.backgroundFarStarCount = 420;
        plugin.settings.backgroundNearStarCount = 180;
        plugin.settings.enableShootingStars = true;
        return;
    }

    plugin.settings.particleCount = 260;
    plugin.settings.maxParticles = 520;
    plugin.settings.autoSpawnAmount = 1;
    plugin.settings.autoSpawnIntervalMs = 2400;

    plugin.settings.enableConnections = true;
    plugin.settings.connectionDistance = 120;
    plugin.settings.maxConnectionsPerParticle = 2;

    plugin.settings.backgroundFarStarCount = 220;
    plugin.settings.backgroundNearStarCount = 80;
    plugin.settings.enableShootingStars = false;
}
