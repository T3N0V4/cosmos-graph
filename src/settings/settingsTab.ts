import {
    App,
    PluginSettingTab,
    Setting
} from "obsidian";

import { CosmosGraphPluginType } from "../types/cosmosTypes";

export class CosmosSettingTab extends PluginSettingTab {
    constructor(
        app: App,
        private plugin: CosmosGraphPluginType
    ) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h1", {
            text: "Cosmos Graph"
        });

        containerEl.createEl("p", {
            text:
                "Most Cosmos Graph settings are now managed from the Cosmos Control panel."
        });

        new Setting(containerEl)
            .setName("Open Cosmos Control")
            .setDesc(
                "Open the dedicated Cosmos Graph control panel."
            )
            .addButton(button =>
                button
                    .setButtonText("Open")
                    .onClick(() => {
                        this.plugin.activateCosmosControlView();
                    })
            );

        new Setting(containerEl)
            .setName("Reset all settings")
            .setDesc(
                "Restore all Cosmos Graph settings to default values."
            )
            .addButton(button =>
                button
                    .setWarning()
                    .setButtonText("Reset")
                    .onClick(async () => {
                        await this.plugin.resetSettings();
                    })
            );
    }
}
