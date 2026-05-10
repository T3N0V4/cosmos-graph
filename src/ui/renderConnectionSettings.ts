import { Setting } from "obsidian";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import { updateSetting } from "../util/updateSetting";
import { addSectionReset } from "./addSectionReset";
import { createSettingSection } from "./createSettingSection";

export function renderConnectionSettings(
    containerEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const section = createSettingSection(
        containerEl,
        "Constellations",
        {
            description:
                "Control constellation lines, distance, thickness, opacity and color."
        }
    );

    addSectionReset(
        section,
        plugin,
        [
            "enableConnections",
            "connectionDistance",
            "connectionLineWidth",
            "connectionColor",
            "connectionBaseOpacity",
            "maxConnectionsPerParticle"
        ]
    );

    const performanceWarning =
        createPerformanceWarning(section.contentEl);

    const updatePerformanceWarning = () => {
        updateConnectionPerformanceWarning(
            performanceWarning,
            plugin
        );
    };

    updatePerformanceWarning();

    new Setting(section.contentEl)
    .setName("Max connections per particle")
    .setDesc("Maximum amount of constellation lines each particle can create.")
    .addSlider(slider =>
        slider
            .setLimits(1, 12, 1)
            .setValue(plugin.settings.maxConnectionsPerParticle)
            .setDynamicTooltip()
            .onChange(async value => {
                plugin.settings.maxConnectionsPerParticle = value;
                updatePerformanceWarning();
                await plugin.saveSettings();
                plugin.renderer?.reloadSettings();
            })
    );

    new Setting(section.contentEl)
        .setName("Enable connections")
        .setDesc("Enable or disable constellation lines.")
        .addToggle(toggle =>
            toggle
                .setValue(plugin.settings.enableConnections)
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "enableConnections",
                        value
                    );
                })
        );

    new Setting(section.contentEl)
        .setName("Connection distance")
        .setDesc("Maximum distance between stars to create connections.")
        .addSlider(slider =>
            slider
                .setLimits(20, 400, 5)
                .setValue(plugin.settings.connectionDistance)
                .setDynamicTooltip()
                .onChange(async value => {
                    plugin.settings.connectionDistance = value;
                    updatePerformanceWarning();
                    await updateSetting(
                        plugin,
                        "connectionDistance",
                        value
                    );
                })
        );

    new Setting(section.contentEl)
        .setName("Connection line width")
        .setDesc("Thickness of constellation lines.")
        .addSlider(slider =>
            slider
                .setLimits(0.05, 2, 0.05)
                .setValue(plugin.settings.connectionLineWidth)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "connectionLineWidth",
                        value
                    );
                })
        );

    new Setting(section.contentEl)
        .setName("Connection opacity")
        .setDesc("Base opacity of constellation lines.")
        .addSlider(slider =>
            slider
                .setLimits(0.01, 1, 0.01)
                .setValue(plugin.settings.connectionBaseOpacity)
                .setDynamicTooltip()
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "connectionBaseOpacity",
                        value
                    );
                })
        );

    new Setting(section.contentEl)
        .setName("Connection color")
        .setDesc("Pick the color used for constellation lines.")
        .addColorPicker(color =>
            color
                .setValue(rgbToHex(plugin.settings.connectionColor))
                .onChange(async value => {
                    await updateSetting(
                        plugin,
                        "connectionColor",
                        hexToRgb(value)
                    );
                })
        );
}

function createPerformanceWarning(
    containerEl: HTMLElement
) {
    return containerEl.createDiv({
        cls: "cosmos-performance-warning"
    });
}

function updateConnectionPerformanceWarning(
    warningEl: HTMLElement,
    plugin: CosmosGraphPluginType
) {
    const warnings: string[] = [];

    if (plugin.settings.connectionDistance >= 280) {
        warnings.push("Connection distance is very high.");
    }

    if (plugin.settings.maxConnectionsPerParticle >= 8) {
        warnings.push("Max connections per particle is very high.");
    }

    updateWarningElement(
        warningEl,
        warnings
    );
}

function updateWarningElement(
    warningEl: HTMLElement,
    warnings: string[]
) {
    warningEl.setText(
        warnings.length > 0
            ? `Performance warning: ${warnings.join(" ")}`
            : ""
    );

    warningEl.toggleClass(
        "is-visible",
        warnings.length > 0
    );
}

function rgbToHex(rgb: string) {
    const parts = rgb
        .split(",")
        .map(value => Number(value.trim()));

    const r = getValidColorPart(parts[0], 120);
    const g = getValidColorPart(parts[1], 195);
    const b = getValidColorPart(parts[2], 255);

    return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex: string) {
    const cleanHex = hex.replace("#", "");

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
}

function getValidColorPart(
    value: number,
    fallback: number
) {
    if (isNaN(value)) {
        return fallback;
    }

    return Math.max(
        0,
        Math.min(255, Math.round(value))
    );
}

function toHex(value: number) {
    return ("0" + value.toString(16)).slice(-2);
}
