import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderBurstSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const burstSection = createSettingSection(
        containerEl,
        "Bursts",
        "Control global burst behavior, cooldown and glow."
    );

    new Setting(burstSection)
        .setName("Cooldown Burst")
        .setDesc("Global cooldown for all burst effects, in seconds.")
        .addSlider(slider =>
            slider
                .setLimits(0.5, 8, 0.5)
                .setValue(plugin.settings.gravityCooldownMs / 1000)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.gravityCooldownMs = value * 1000;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(burstSection)
        .setName("Burst particle limit")
        .setDesc("Maximum amount of temporary burst particles.")
        .addSlider(slider =>
            slider
                .setLimits(20, 800, 10)
                .setValue(plugin.settings.burstParticleLimit)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.burstParticleLimit = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(burstSection)
        .setName("Burst glow intensity")
        .setDesc("Brightness of burst particle glow.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.burstGlowIntensity)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.burstGlowIntensity = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(burstSection)
        .setName("Burst glow size")
        .setDesc("Size of burst glow aura.")
        .addSlider(slider =>
            slider
                .setLimits(1, 10, 0.1)
                .setValue(plugin.settings.burstGlowSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.burstGlowSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    const radialSection = createSettingSection(
        containerEl,
        "Radial Burst",
        "Control circular click explosions."
    );

    new Setting(radialSection)
        .setName("Radial particles")
        .setDesc("Amount of particles in radial burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.radialBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.radialBurstAmount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(radialSection)
        .setName("Radial core particles")
        .setDesc("Amount of slower particles near the center of radial burst.")
        .addSlider(slider =>
            slider
                .setLimits(0, 60, 1)
                .setValue(plugin.settings.radialCoreAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.radialCoreAmount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    const directionalSection = createSettingSection(
        containerEl,
        "Directional Burst",
        "Control cone-shaped bursts fired away from the graph center."
    );

    new Setting(directionalSection)
        .setName("Directional particles")
        .setDesc("Amount of particles in directional burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.directionalBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.directionalBurstAmount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(directionalSection)
        .setName("Directional spread")
        .setDesc("Opening angle of directional burst.")
        .addSlider(slider =>
            slider
                .setLimits(0.01, 1, 0.01)
                .setValue(plugin.settings.directionalSpread)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.directionalSpread = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    const gravitySection = createSettingSection(
        containerEl,
        "Gravity Burst",
        "Control click bursts that pull particles back toward the click point."
    );

    new Setting(gravitySection)
        .setName("Gravity particles")
        .setDesc("Amount of particles in gravity burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.gravityBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.gravityBurstAmount = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(gravitySection)
        .setName("Gravity force")
        .setDesc("Strength of attraction in gravity burst.")
        .addSlider(slider =>
            slider
                .setLimits(10, 300, 5)
                .setValue(plugin.settings.gravityForce)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.gravityForce = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(gravitySection)
        .setName("Gravity duration")
        .setDesc("Duration of gravity burst in milliseconds.")
        .addSlider(slider =>
            slider
                .setLimits(500, 8000, 100)
                .setValue(plugin.settings.gravityDurationMs)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.gravityDurationMs = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(gravitySection)
        .setName("Gravity bounce distance")
        .setDesc("Distance from center where particles bounce outward.")
        .addSlider(slider =>
            slider
                .setLimits(2, 80, 1)
                .setValue(plugin.settings.gravityBounceDistance)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.gravityBounceDistance = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );
}