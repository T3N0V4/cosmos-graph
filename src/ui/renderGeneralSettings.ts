import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../settings/cosmosTypes";
import { createSettingSection } from "./createSettingSection";

export function renderGeneralSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
        containerEl,
        "General",
        "Main visual systems and global interaction mode."
    );

    new Setting(section)
        .setName("Particles")
        .setDesc("Enable or disable galaxy particles.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableParticles)
                .onChange(async value => {
                    plugin.settings.enableParticles = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Shooting stars")
        .setDesc("Enable or disable shooting stars.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableShootingStars)
                .onChange(async value => {
                    plugin.settings.enableShootingStars = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Mouse field")
        .setDesc("Enable or disable particle reaction around the mouse.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableMouseField)
                .onChange(async value => {
                    plugin.settings.enableMouseField = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
        .setName("Parallax")
        .setDesc("Enable or disable subtle background movement.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableParallax)
                .onChange(async value => {
                    plugin.settings.enableParallax = value;
                    await plugin.saveSettings();
                    plugin.renderer?.reloadSettings();
                })
        );

    new Setting(section)
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
                    plugin.renderer?.reloadSettings();
                })
        );
}