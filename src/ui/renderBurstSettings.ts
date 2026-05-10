import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import { updateSetting } from "../util/updateSetting";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderBurstSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const burstSection = createSettingSection(
        containerEl,
        "Burst",
        {
            description:
                "Shared behavior for click burst effects."
        }
    );

    addSectionReset(
        burstSection,
        plugin,
        [
            "gravityCooldownMs",
            "burstParticleLimit",
            "burstGlowIntensity",
            "burstGlowSize"
        ]
    );

    new Setting(burstSection.contentEl)
        .setName("Cooldown")
        .setDesc("Time before another burst can be used.")
        .addSlider(slider =>
            slider
                .setLimits(0.5, 8, 0.5)
                .setValue(plugin.settings.gravityCooldownMs / 1000)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "gravityCooldownMs",
                        value * 1000
                    );
                })
        );

    new Setting(burstSection.contentEl)
        .setName("Particle Limit")
        .setDesc("Maximum amount of temporary burst particles.")
        .addSlider(slider =>
            slider
                .setLimits(20, 800, 10)
                .setValue(plugin.settings.burstParticleLimit)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "burstParticleLimit",
                        value
                    );
                })
        );

    new Setting(burstSection.contentEl)
        .setName("Glow")
        .setDesc("Brightness of burst particle glow.")
        .addSlider(slider =>
            slider
                .setLimits(0, 1, 0.01)
                .setValue(plugin.settings.burstGlowIntensity)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "burstGlowIntensity",
                        value
                    );
                })
        );

    new Setting(burstSection.contentEl)
        .setName("Glow Size")
        .setDesc("Size of burst glow aura.")
        .addSlider(slider =>
            slider
                .setLimits(1, 10, 0.1)
                .setValue(plugin.settings.burstGlowSize)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "burstGlowSize",
                        value
                    );
                })
        );

    const radialSection = createSettingSection(
        containerEl,
        "Radial Burst",
        {
            description:
                "Control circular click explosions."
        }
    );

    addSectionReset(
        radialSection,
        plugin,
        [
            "radialBurstAmount",
            "radialCoreAmount"
        ]
    );

    new Setting(radialSection.contentEl)
        .setName("Amount")
        .setDesc("Amount of particles in radial burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.radialBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "radialBurstAmount",
                        value
                    );
                })
        );

    new Setting(radialSection.contentEl)
        .setName("Core Density")
        .setDesc("Amount of slower particles near the center of radial burst.")
        .addSlider(slider =>
            slider
                .setLimits(0, 60, 1)
                .setValue(plugin.settings.radialCoreAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "radialCoreAmount",
                        value
                    );
                })
        );

    const directionalSection = createSettingSection(
        containerEl,
        "Directional Burst",
        {
            description:
                "Control cone-shaped bursts fired away from the graph center."
        }
    );

    addSectionReset(
        directionalSection,
        plugin,
        [
            "directionalBurstAmount",
            "directionalAngle",
            "directionalSpread"
        ]
    );

    new Setting(directionalSection.contentEl)
        .setName("Amount")
        .setDesc("Amount of particles in directional burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.directionalBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "directionalBurstAmount",
                        value
                    );
                })
        );

    createDirectionControl(
        directionalSection.contentEl,
        plugin
    );

    new Setting(directionalSection.contentEl)
        .setName("Cone Width")
        .setDesc("How wide the particle cone becomes.")
        .addSlider(slider =>
            slider
                .setLimits(0.01, 1, 0.01)
                .setValue(plugin.settings.directionalSpread)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "directionalSpread",
                        value
                    );
                })
        );

    const gravitySection = createSettingSection(
        containerEl,
        "Gravity Burst",
        {
            description:
                "Control click bursts that pull particles back toward the click point."
        }
    );

    addSectionReset(
        gravitySection,
        plugin,
        [
            "gravityBurstAmount",
            "gravityForce",
            "gravityDurationMs",
            "gravityBounceDistance"
        ]
    );

    new Setting(gravitySection.contentEl)
        .setName("Amount")
        .setDesc("Amount of particles in gravity burst.")
        .addSlider(slider =>
            slider
                .setLimits(5, 120, 1)
                .setValue(plugin.settings.gravityBurstAmount)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "gravityBurstAmount",
                        value
                    );
                })
        );

    new Setting(gravitySection.contentEl)
        .setName("Gravity Strength")
        .setDesc("Strength of attraction in this burst.")
        .addSlider(slider =>
            slider
                .setLimits(10, 300, 5)
                .setValue(plugin.settings.gravityForce)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "gravityForce",
                        value
                    );
                })
        );

    new Setting(gravitySection.contentEl)
        .setName("Gravity Duration")
        .setDesc("How long burst particles stay temporary.")
        .addSlider(slider =>
            slider
                .setLimits(500, 8000, 100)
                .setValue(plugin.settings.gravityDurationMs)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "gravityDurationMs",
                        value
                    );
                })
        );

    new Setting(gravitySection.contentEl)
        .setName("Collapse Distance")
        .setDesc("Distance from the center where the pull tightens.")
        .addSlider(slider =>
            slider
                .setLimits(2, 80, 1)
                .setValue(plugin.settings.gravityBounceDistance)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "gravityBounceDistance",
                        value
                    );
                })
        );
}

function createDirectionControl(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const setting =
        new Setting(containerEl)
            .setName("Shooting Direction")
            .setDesc("Direction used by directional bursts.");

    const padEl =
        setting.controlEl.createDiv({
            cls: "cosmos-direction-control"
        });

    const lineEl =
        padEl.createDiv({
            cls: "cosmos-direction-control-line"
        });

    const handleEl =
        padEl.createDiv({
            cls: "cosmos-direction-control-handle"
        });

    const updateVisual = () => {
        const angle =
            plugin.settings.directionalAngle;

        const radius = 34;
        const center = 44;

        const x =
            center +
            Math.cos(angle) * radius;

        const y =
            center +
            Math.sin(angle) * radius;

        handleEl.style.left =
            `${x}px`;

        handleEl.style.top =
            `${y}px`;

        lineEl.style.transform =
            `rotate(${angle}rad)`;
    };

    const updateValue = async (
        event: MouseEvent
    ) => {
        const rect =
            padEl.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        const angle =
            Math.atan2(
                event.clientY - centerY,
                event.clientX - centerX
            );

        plugin.settings.directionalAngle =
            angle;

        updateVisual();

        await plugin.saveSettings();
    };

    let isDragging = false;

    const handleMouseMove = (
        event: MouseEvent
    ) => {
        if (!isDragging) {
            return;
        }

        void updateValue(event);
    };

    const handleMouseUp = () => {
        isDragging = false;

        document.removeEventListener(
            "mousemove",
            handleMouseMove
        );

        document.removeEventListener(
            "mouseup",
            handleMouseUp
        );
    };

    padEl.addEventListener(
        "mousedown",
        (event) => {
            isDragging = true;

            void updateValue(event);

            document.addEventListener(
                "mousemove",
                handleMouseMove
            );

            document.addEventListener(
                "mouseup",
                handleMouseUp
            );
        }
    );

    updateVisual();
}
