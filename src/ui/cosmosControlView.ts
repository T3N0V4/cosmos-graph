import {
    ItemView,
    WorkspaceLeaf
} from "obsidian";

import CosmosGraphPlugin from "../main";

import { renderGeneralSettings } from "./renderGeneralSettings";
import { renderUniverseSettings } from  "./renderUniverseSettings";
import { renderConnectionSettings } from    "./renderConnectionSettings";
import { renderMouseSettings } from             "./renderMouseSettings";
import { renderBurstSettings } from                 "./renderBurstSettings";
import { renderBackgroundSettings } from                "./renderBackgroundSettings";

export const COSMOS_CONTROL_VIEW_TYPE =
    "cosmos-control-view";

export class CosmosControlView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private plugin: CosmosGraphPlugin
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
        this.render();
    }

    async onClose() {}

    private render() {
        const container =
            this.containerEl.children[1] as HTMLElement;

        container.empty();

        container.addClass("cosmos-control-panel");

        container.createEl("h2", {
            text: "Cosmos Control"
        });

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