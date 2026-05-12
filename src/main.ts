import { Plugin } from "obsidian";

import { CosmosRenderer } from "./render/cosmosRenderer";
import { CosmosSettingTab } from "./settings/settingsTab";
import { CosmosSettings, DEFAULT_SETTINGS } from "./settings/settings";

import {
    CosmosControlView,
    COSMOS_CONTROL_VIEW_TYPE
} from "./ui/cosmosControlView";

export default class CosmosGraphPlugin extends Plugin {
    settings: CosmosSettings = DEFAULT_SETTINGS;

    renderer: CosmosRenderer | null = null;

    async onload() {
        await this.loadSettings();

        this.renderer = new CosmosRenderer(this);
        this.renderer.start();
        this.registerView(
        COSMOS_CONTROL_VIEW_TYPE,
        (leaf) => new CosmosControlView(leaf, this)
    );

    this.addRibbonIcon(
        "sparkles",
        "Open Cosmos Control",
        () => {
            this.activateCosmosControlView();
        }
    );

    this.addCommand({
        id: "open-cosmos-control",
        name: "Open Cosmos Control",
        callback: () => {
            this.activateCosmosControlView();
        }
    });

        this.addSettingTab(
            new CosmosSettingTab(this.app, this)
        );
    }

    onunload() {
        this.renderer?.destroy();
        this.renderer = null;
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.renderer?.reloadSettings();
    }

    async activateCosmosControlView() {
    const leaves =
        this.app.workspace.getLeavesOfType(
            COSMOS_CONTROL_VIEW_TYPE
        );

    if (leaves.length > 0) {
        this.app.workspace.revealLeaf(leaves[0]);
        return;
    }

    const leaf =
        this.app.workspace.getRightLeaf(false);

    if (!leaf) return;

    await leaf.setViewState({
        type: COSMOS_CONTROL_VIEW_TYPE,
        active: true
    });

    this.app.workspace.revealLeaf(leaf);
}

}