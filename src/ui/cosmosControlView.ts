import {
    ItemView,
    WorkspaceLeaf
} from "obsidian";

import type { CosmosGraphPluginType } from "../types/cosmosTypes";

import { renderGeneralSettings } from "./renderGeneralSettings";
import { renderUniverseSettings } from "./renderUniverseSettings";
import { renderConnectionSettings } from "./renderConnectionSettings";
import { renderMouseSettings } from "./renderMouseSettings";
import { renderBurstSettings } from "./renderBurstSettings";
import { renderBackgroundSettings } from "./renderBackgroundSettings";

export const COSMOS_CONTROL_VIEW_TYPE =
    "cosmos-control-view";

export class CosmosControlView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private plugin: CosmosGraphPluginType
    ) {
        super(leaf);
    }

    getViewType() {
        return COSMOS_CONTROL_VIEW_TYPE;
    }

    getDisplayText() {
        return "Cosmos Control";
    }

    getIcon() {
        return "sparkles";
    }

    async onOpen() {
        window.addEventListener(
            "cosmos-settings-reset",
            this.handleSettingsReset
        );

        this.render();
    }

    async onClose() {
        window.removeEventListener(
            "cosmos-settings-reset",
            this.handleSettingsReset
        );
    }

    private handleSettingsReset = () => {
        this.render();
    };

    private render() {
        const container =
            this.containerEl.children[1] as HTMLElement;

        container.empty();

        container.addClass("cosmos-control-panel");

        const header =
            container.createDiv({
                cls: "cosmos-control-header"
            });

        header.createEl("h2", {
            text: "Cosmos Control"
        });

        const headerActions =
            header.createDiv({
                cls: "cosmos-control-header-actions"
            });

        const resetAllButton =
            headerActions.createEl("button", {
                text: "Reset all",
                cls: "cosmos-control-reset-all-button"
            });

        resetAllButton.onclick = async () => {
            await this.plugin.resetSettings();
            this.render();
        };

        const closeButton =
            headerActions.createEl("button", {
                text: "x",
                cls: "cosmos-control-close-button"
            });

        closeButton.onclick = async () => {
            await this.leaf.detach();
        };

        container.createEl("p", {
            text: "Live visual controls for Cosmos Graph."
        });

        renderGeneralSettings(
            container,
            this.plugin
        );

        renderUniverseSettings(
            container,
            this.plugin
        );

        renderConnectionSettings(
            container,
            this.plugin
        );

        renderMouseSettings(
            container,
            this.plugin
        );

        renderBurstSettings(
            container,
            this.plugin
        );

        renderBackgroundSettings(
            container,
            this.plugin
        );
    }
}
