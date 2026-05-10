import type { CosmosSettings } from "../settings/settings";
import type { CosmosGraphPluginType } from "../types/cosmosTypes";

export async function updateSetting<K extends keyof CosmosSettings>(
    plugin: CosmosGraphPluginType,
    key: K,
    value: CosmosSettings[K]
) {
    plugin.settings[key] = value;

    await plugin.saveSettings();
}