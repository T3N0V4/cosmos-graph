import { App, PluginSettingTab } from "obsidian";
import { renderBackgroundSettings } from "../ui/renderBackgroundSettings";

import CosmosGraphPlugin from "../main";

import { renderGeneralSettings } from "../ui/renderGeneralSettings";
import { renderUniverseSettings } from "../ui/renderUniverseSettings";
import { renderConnectionSettings } from "../ui/renderConnectionSettings";
import { renderMouseSettings } from "../ui/renderMouseSettings";
import { renderBurstSettings } from "../ui/renderBurstSettings";

export class CosmosSettingTab extends PluginSettingTab {
    plugin: CosmosGraphPlugin;

    constructor(
        app: App,
        plugin: CosmosGraphPlugin
    ) {
        super(app, plugin);

        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", {
            text: "Cosmos Graph"
        });

        renderBackgroundSettings(
            containerEl,
            this.plugin
        );

        renderGeneralSettings(
            containerEl,
            this.plugin
        );

        renderUniverseSettings(
            containerEl,
            this.plugin
        );

        renderConnectionSettings(
            containerEl,
            this.plugin
        );

        renderMouseSettings(
            containerEl,
            this.plugin
        );

        renderBurstSettings(
            containerEl,
            this.plugin
        );
    }
}