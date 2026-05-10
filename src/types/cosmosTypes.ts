import type { App, Plugin } from "obsidian";
import type { CosmosSettings } from "../settings/settings";

export type CosmosGraphPluginType = Plugin & {
    app: App;

    settings: CosmosSettings;

    saveSettings(): Promise<void>;
    resetSettings(): Promise<void>;
    activateCosmosControlView(): Promise<void>;

    renderer: {
        reloadSettings(): void;
    } | null;
};