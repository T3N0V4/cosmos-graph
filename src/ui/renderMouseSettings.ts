import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import { updateSetting } from "../util/updateSetting";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderMouseSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const glowSection = createSettingSection(
        containerEl,
        "Mouse Glow",
        {
            description:
                "Control the light effect around the mouse."
        }
    );

    addSectionReset(
        glowSection,
        plugin,
        [
            "enableMouseGlow",
            "mouseGlowRadius",
            "mouseGlowConnectionOpacity",
            "mouseGlowLineWidth",
            "mouseGlowParticleAlpha",
            "mouseGlowParticleSize"
        ]
    );

    new Setting(glowSection.contentEl)
        .setName("Enable")
        .setDesc("Enable glow near the mouse.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableMouseGlow)
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "enableMouseGlow",
                        value
                    );
                })
        );

    new Setting(glowSection.contentEl)
        .setName("Size")
        .setDesc("How far the glow reaches.")
        .addSlider(slider =>
            slider
                .setLimits(50, 600, 10)
                .setValue(plugin.settings.mouseGlowRadius)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseGlowRadius",
                        value
                    );
                })
        );

    new Setting(glowSection.contentEl)
        .setName("Connection Glow")
        .setDesc("How much nearby connections light up.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.mouseGlowConnectionOpacity)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseGlowConnectionOpacity",
                        value
                    );
                })
        );

    new Setting(glowSection.contentEl)
        .setName("Particle Glow")
        .setDesc("How much nearby particles light up.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.mouseGlowParticleAlpha)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseGlowParticleAlpha",
                        value
                    );
                })
        );

    new Setting(glowSection.contentEl)
        .setName("Particle Size")
        .setDesc("How much nearby particles grow.")
        .addSlider(slider =>
            slider
                .setLimits(0, 3, 0.05)
                .setValue(plugin.settings.mouseGlowParticleSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseGlowParticleSize",
                        value
                    );
                })
        );

    const fieldSection = createSettingSection(
        containerEl,
        "Mouse Force",
        {
            description:
                "Control how the mouse pushes particles away."
        }
    );

    addSectionReset(
        fieldSection,
        plugin,
        [
            "mouseFieldRadius",
            "mouseRepulseStrength"
        ]
    );

    new Setting(fieldSection.contentEl)
        .setName("Range")
        .setDesc("How far the mouse force reaches.")
        .addSlider(slider =>
            slider
                .setLimits(20, 400, 5)
                .setValue(plugin.settings.mouseFieldRadius)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseFieldRadius",
                        value
                    );
                })
        );

    new Setting(fieldSection.contentEl)
        .setName("Strength")
        .setDesc("How strongly the mouse pushes particles.")
        .addSlider(slider =>
            slider
                .setLimits(0, 500, 10)
                .setValue(plugin.settings.mouseRepulseStrength)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "mouseRepulseStrength",
                        value
                    );
                })
        );
}
