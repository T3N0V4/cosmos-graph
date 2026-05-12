import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderMouseSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const glowSection = createSettingSection(
        containerEl,
        "Mouse Glow",
        "Control how stars and connections light up near the mouse."
    );

    new Setting(glowSection)
        .setName("Enable mouse glow")
        .setDesc("Enable constellation glow near the mouse.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableMouseGlow)
                .onChange(async value => {
                    plugin.settings.enableMouseGlow = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(glowSection)
        .setName("Mouse glow radius")
        .setDesc("Radius where constellations light up near the mouse.")
        .addSlider(slider =>
            slider
                .setLimits(50, 600, 10)
                .setValue(plugin.settings.mouseGlowRadius)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseGlowRadius = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(glowSection)
        .setName("Mouse connection glow")
        .setDesc("How much mouse proximity increases connection opacity.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.mouseGlowConnectionOpacity)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseGlowConnectionOpacity = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(glowSection)
        .setName("Mouse line width boost")
        .setDesc("How much mouse proximity thickens connection lines.")
        .addSlider(slider =>
            slider
                .setLimits(0, 3, 0.05)
                .setValue(plugin.settings.mouseGlowLineWidth)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseGlowLineWidth = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(glowSection)
        .setName("Mouse particle brightness")
        .setDesc("How much nearby stars brighten around the mouse.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.mouseGlowParticleAlpha)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseGlowParticleAlpha = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(glowSection)
        .setName("Mouse particle size boost")
        .setDesc("How much nearby stars grow around the mouse.")
        .addSlider(slider =>
            slider
                .setLimits(0, 3, 0.05)
                .setValue(plugin.settings.mouseGlowParticleSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseGlowParticleSize = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    const fieldSection = createSettingSection(
        containerEl,
        "Mouse Field",
        "Control the physical repulsion effect around the mouse."
    );

    new Setting(fieldSection)
        .setName("Mouse field radius")
        .setDesc("Radius of particle repulsion around the mouse.")
        .addSlider(slider =>
            slider
                .setLimits(20, 400, 5)
                .setValue(plugin.settings.mouseFieldRadius)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseFieldRadius = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(fieldSection)
        .setName("Mouse repulse strength")
        .setDesc("Strength of mouse particle repulsion.")
        .addSlider(slider =>
            slider
                .setLimits(0, 500, 10)
                .setValue(plugin.settings.mouseRepulseStrength)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.mouseRepulseStrength = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );
}