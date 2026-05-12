import type { CosmosSettings } from "../settings/settings";

export class BackgroundRenderer {
    private graphView: HTMLElement | null = null;

    private layerFar: HTMLDivElement | null = null;
    private layerNear: HTMLDivElement | null = null;

    setContainer(
        container: HTMLElement,
        settings: CosmosSettings
    ) {
        this.graphView = container;

        this.graphView.style.position = "relative";
        this.graphView.style.overflow = "hidden";
        this.graphView.style.background = "#00020a";

        this.applySettings(settings);
    }

    applySettings(settings: CosmosSettings) {
        if (!this.graphView) return;

        if (!this.layerFar || !this.layerNear) {
            this.clearLayers();
            this.createLayers(settings);
            return;
        }

        this.syncLayer(
            this.layerFar,
            settings.backgroundFarStarCount,
            settings.backgroundFarStarMinSize,
            settings.backgroundFarStarMaxSize,
            settings
        );

        this.syncLayer(
            this.layerNear,
            settings.backgroundNearStarCount,
            settings.backgroundNearStarMinSize,
            settings.backgroundNearStarMaxSize,
            settings
        );

        this.applyStarVisuals(
            this.layerFar,
            settings.backgroundFarStarMinSize,
            settings.backgroundFarStarMaxSize,
            settings
        );

        this.applyStarVisuals(
            this.layerNear,
            settings.backgroundNearStarMinSize,
            settings.backgroundNearStarMaxSize,
            settings
        );

        this.applyAnimationSettings(settings);
    }

    regenerate(settings: CosmosSettings) {
        if (!this.graphView) return;

        this.clearLayers();
        this.createLayers(settings);
    }

    updateMouse(
        mouseX: number,
        mouseY: number,
        enabled: boolean,
        settings: CosmosSettings
    ) {
        if (
            !enabled ||
            !this.graphView ||
            !this.layerFar ||
            !this.layerNear
        ) {
            return;
        }

        const rect = this.graphView.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const offsetX = (mouseX - centerX) / centerX;
        const offsetY = (mouseY - centerY) / centerY;

        this.layerFar.style.transform =
            `translate(${offsetX * -settings.backgroundFarParallax}px, ${offsetY * -settings.backgroundFarParallax}px)`;

        this.layerNear.style.transform =
            `translate(${offsetX * -settings.backgroundNearParallax}px, ${offsetY * -settings.backgroundNearParallax}px)`;
    }

    resetMouse() {
        if (this.layerFar) {
            this.layerFar.style.transform = "translate(0px, 0px)";
        }

        if (this.layerNear) {
            this.layerNear.style.transform = "translate(0px, 0px)";
        }
    }

    update(_enabled: boolean) {
        // Movimiento por CSS + parallax del mouse.
    }

    private createLayers(settings: CosmosSettings) {
        if (!this.graphView) return;

        this.layerFar = this.createLayer(
            "cosmos-stars-far",
            settings.backgroundFarStarCount,
            settings.backgroundFarStarMinSize,
            settings.backgroundFarStarMaxSize,
            settings
        );

        this.layerNear = this.createLayer(
            "cosmos-stars-near",
            settings.backgroundNearStarCount,
            settings.backgroundNearStarMinSize,
            settings.backgroundNearStarMaxSize,
            settings
        );

        this.graphView.prepend(this.layerFar);
        this.graphView.prepend(this.layerNear);

        this.applyAnimationSettings(settings);
    }

    private createLayer(
        className: string,
        amount: number,
        minSize: number,
        maxSize: number,
        settings: CosmosSettings
    ) {
        const layer = document.createElement("div");

        layer.className = className;

        layer.style.position = "absolute";
        layer.style.inset = "0";
        layer.style.width = "100%";
        layer.style.height = "100%";
        layer.style.pointerEvents = "none";
        layer.style.zIndex = "0";
        layer.style.transition = "transform 220ms ease-out";

        for (let i = 0; i < amount; i++) {
            layer.appendChild(
                this.createStar(minSize, maxSize, settings)
            );
        }

        return layer;
    }

    private syncLayer(
        layer: HTMLDivElement,
        targetAmount: number,
        minSize: number,
        maxSize: number,
        settings: CosmosSettings
    ) {
        const currentAmount = layer.children.length;

        if (currentAmount < targetAmount) {
            const missing = targetAmount - currentAmount;

            for (let i = 0; i < missing; i++) {
                layer.appendChild(
                    this.createStar(minSize, maxSize, settings)
                );
            }

            return;
        }

        if (currentAmount > targetAmount) {
            const excess = currentAmount - targetAmount;

            for (let i = 0; i < excess; i++) {
                layer.lastElementChild?.remove();
            }
        }
    }

    private applyStarVisuals(
        layer: HTMLDivElement,
        minSize: number,
        maxSize: number,
        settings: CosmosSettings
    ) {
        for (const child of Array.from(layer.children)) {
            const star = child as HTMLElement;

            const currentSize =
                parseFloat(star.dataset.size ?? "1");

            const size = Math.max(
                minSize,
                Math.min(maxSize, currentSize)
            );

            const alpha = Math.max(
                settings.backgroundStarMinAlpha,
                Math.min(
                    settings.backgroundStarMaxAlpha,
                    parseFloat(star.dataset.alpha ?? "0.6")
                )
            );

            const hue = Math.max(
                settings.backgroundStarHueMin,
                Math.min(
                    settings.backgroundStarHueMax,
                    parseFloat(star.dataset.hue ?? "220")
                )
            );

            star.dataset.size = `${size}`;
            star.dataset.alpha = `${alpha}`;
            star.dataset.hue = `${hue}`;

            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.opacity = `${alpha}`;
            star.style.background =
                `hsla(${hue}, 80%, 88%, 1)`;

            star.style.boxShadow =
                `0 0 ${size * 4}px hsla(${hue}, 90%, 78%, ${alpha * 0.7})`;
        }
    }

    private createStar(
        minSize: number,
        maxSize: number,
        settings: CosmosSettings
    ) {
        const star = document.createElement("div");

        const size = this.random(minSize, maxSize);

        const alpha = this.random(
            settings.backgroundStarMinAlpha,
            settings.backgroundStarMaxAlpha
        );

        const hue = this.random(
            settings.backgroundStarHueMin,
            settings.backgroundStarHueMax
        );

        star.dataset.size = `${size}`;
        star.dataset.alpha = `${alpha}`;
        star.dataset.hue = `${hue}`;

        star.style.position = "absolute";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;

        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        star.style.borderRadius = "50%";
        star.style.opacity = `${alpha}`;

        star.style.background =
            `hsla(${hue}, 80%, 88%, 1)`;

        star.style.boxShadow =
            `0 0 ${size * 4}px hsla(${hue}, 90%, 78%, ${alpha * 0.7})`;

        if (Math.random() < settings.backgroundPulseChance) {
            star.style.animation =
                `cosmosPulse ${this.random(4, 10)}s ease-in-out infinite`;
        }

        return star;
    }

    private applyAnimationSettings(settings: CosmosSettings) {
        if (this.layerFar) {
            this.layerFar.style.animation =
                `cosmosDriftFar ${settings.backgroundFarDriftSeconds}s linear infinite`;
        }

        if (this.layerNear) {
            this.layerNear.style.animation =
                `cosmosDriftNear ${settings.backgroundNearDriftSeconds}s linear infinite`;
        }
    }

    private clearLayers() {
        this.layerFar?.remove();
        this.layerNear?.remove();

        this.layerFar = null;
        this.layerNear = null;
    }

    private random(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}