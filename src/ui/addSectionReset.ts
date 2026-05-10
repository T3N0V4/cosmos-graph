import type { CosmosSettings } from "../settings/settings";
import { DEFAULT_SETTINGS } from "../settings/settings";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";
import type { SettingSection } from "./createSettingSection";

export function addSectionReset(
    section: SettingSection,
    plugin: CosmosGraphPluginType,
    keys: (keyof CosmosSettings)[]
) {
    const button =
        section.headerEl.createEl("button", {
            text: "Reset",
            cls: "cosmos-section-reset-button"
        });

    button.onclick = async (event) => {
        event.stopPropagation();
        event.preventDefault();

        for (const key of keys) {
            plugin.settings[key] =
                DEFAULT_SETTINGS[key] as never;
        }

        await plugin.saveSettings();

        window.dispatchEvent(
            new CustomEvent(
                "cosmos-settings-reset"
            )
        );
    };
}
