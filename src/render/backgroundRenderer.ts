import { CosmosSettings } from "../settings/settings";

import {
    clamp,
    lerp
} from "../util/math";

import {
    randomFloat
} from "../util/random";

interface BackgroundStar {
    x: number;
    y: number;
    sizeRatio: number;
    depth: number;
    opacityRatio: number;
    hueRatio: number;
    pulseRoll: number;
    twinkleOffset: number;
    twinkleSpeed: number;
}

export class BackgroundRenderer {
    private graphView: HTMLElement | null = null;
    private root: HTMLDivElement | null = null;

    private farCanvas: HTMLCanvasElement | null = null;
    private farCtx: CanvasRenderingContext2D | null = null;

    private nearCanvas: HTMLCanvasElement | null = null;
    private nearCtx: CanvasRenderingContext2D | null = null;

    private starsFar: BackgroundStar[] = [];
    private starsNear: BackgroundStar[] = [];

    private width = 0;
    private height = 0;
    private dpr = 1;

    private parallaxX = 0;
    private parallaxY = 0;
    private targetParallaxX = 0;
    private targetParallaxY = 0;

    private farVisibility = 0.45;
    private nearVisibility = 1;

    private farLayerDirty = true;
    private settings: CosmosSettings | null = null;

    private lastFarDrawTime = 0;
    private farFrameInterval = 1000 / 12;

    private lastNearDrawTime = 0;
    private nearFrameInterval = 1000 / 20;

    setContainer(
        container: HTMLElement,
        settings: CosmosSettings
    ) {
        const isNewContainer =
            this.graphView !== container;

        this.graphView = container;

        this.graphView.style.position =
            "relative";

        this.graphView.style.background =
            "#00020a";

        if (isNewContainer) {
            this.destroyCanvasOnly();
        }

        this.ensureRoot();
        this.ensureCanvasLayers();

        if (
            isNewContainer ||
            (
                this.starsFar.length === 0 &&
                this.starsNear.length === 0
            )
        ) {
            this.createStars(settings);
        }

        this.resize();
        this.applySettings(settings);
    }

    regenerate(
        settings: CosmosSettings
    ) {
        if (!this.graphView) {
            return;
        }

        this.createStars(settings);
        this.resize();

        this.farLayerDirty =
            true;
    }

    update(
        enabled: boolean,
        enableParallax: boolean
    ) {
        if (
            !this.graphView ||
            !this.graphView.isConnected ||
            !this.farCtx ||
            !this.nearCtx
        ) {
            return;
        }

        this.setVisible(enabled);

        if (!enabled) {
            return;
        }

        const rect =
            this.graphView.getBoundingClientRect();

        if (
            rect.width < 10 ||
            rect.height < 10
        ) {
            return;
        }

        this.resize();

        if (!enableParallax) {
            this.parallaxX = lerp(
                this.parallaxX,
                0,
                0.08
            );

            this.parallaxY = lerp(
                this.parallaxY,
                0,
                0.08
            );
        } else {
            this.parallaxX = lerp(
                this.parallaxX,
                this.targetParallaxX,
                0.04
            );

            this.parallaxY = lerp(
                this.parallaxY,
                this.targetParallaxY,
                0.04
            );
        }

        this.draw();
    }

    setVisible(enabled: boolean) {
        if (!this.root) {
            return;
        }

        this.root.style.display =
            enabled ? "" : "none";
    }

    setParallax(
        x: number,
        y: number
    ) {
        this.targetParallaxX = clamp(
            x,
            -50,
            50
        );

        this.targetParallaxY = clamp(
            y,
            -50,
            50
        );
    }

    applySettings(
        settings: CosmosSettings
    ) {
        const shouldRegenerate =
            (
                !this.settings &&
                this.starsFar.length === 0 &&
                this.starsNear.length === 0
            ) ||
            (
                this.settings !== null &&
                (
            this.settings.backgroundFarStarCount !==
                settings.backgroundFarStarCount ||
            this.settings.backgroundNearStarCount !==
                settings.backgroundNearStarCount
                )
            );

        this.settings = {
            ...settings
        };

        if (shouldRegenerate) {
            this.createStars(settings);
        }

        this.farVisibility =
            0.45;

        this.nearVisibility =
            1;

        this.farLayerDirty =
            true;
    }

    destroy() {
        this.destroyCanvasOnly();

        this.graphView =
            null;
    }

    private ensureRoot() {
        if (
            !this.graphView ||
            this.root
        ) {
            return;
        }

        const existing =
            this.graphView.querySelector(
                ".cosmos-background-root"
            ) as HTMLDivElement | null;

        if (existing) {
            this.root =
                existing;

            this.farCanvas =
                existing.querySelector(
                    ".cosmos-background-far-canvas"
                ) as HTMLCanvasElement | null;

            this.nearCanvas =
                existing.querySelector(
                    ".cosmos-background-near-canvas"
                ) as HTMLCanvasElement | null;

            this.farCtx =
                this.farCanvas?.getContext("2d") ?? null;

            this.nearCtx =
                this.nearCanvas?.getContext("2d") ?? null;

            return;
        }

        const root =
            document.createElement(
                "div"
            );

        root.className =
            "cosmos-background-root";

        root.style.position =
            "absolute";

        root.style.inset =
            "0";

        root.style.pointerEvents =
            "none";

        root.style.overflow =
            "hidden";

        root.style.zIndex =
            "1";

        this.graphView.prepend(
            root
        );

        this.root =
            root;
    }

    private ensureCanvasLayers() {
        if (!this.root) {
            return;
        }

        if (!this.farCanvas) {
            const farCanvas =
                this.createCanvas(
                    "cosmos-background-far-canvas",
                    "1"
                );

            this.root.appendChild(
                farCanvas
            );

            this.farCanvas =
                farCanvas;

            this.farCtx =
                farCanvas.getContext("2d");
        }

        if (!this.nearCanvas) {
            const nearCanvas =
                this.createCanvas(
                    "cosmos-background-near-canvas",
                    "2"
                );

            this.root.appendChild(
                nearCanvas
            );

            this.nearCanvas =
                nearCanvas;

            this.nearCtx =
                nearCanvas.getContext("2d");
        }
    }

    private createCanvas(
        className: string,
        zIndex: string
    ) {
        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.className =
            className;

        canvas.style.position =
            "absolute";

        canvas.style.inset =
            "0";

        canvas.style.width =
            "100%";

        canvas.style.height =
            "100%";

        canvas.style.pointerEvents =
            "none";

        canvas.style.zIndex =
            zIndex;

        return canvas;
    }

    private resize() {
        if (
            !this.graphView ||
            !this.farCanvas ||
            !this.nearCanvas
        ) {
            return;
        }

        const rect =
            this.graphView.getBoundingClientRect();

        const width =
            Math.max(
                1,
                Math.floor(rect.width)
            );

        const height =
            Math.max(
                1,
                Math.floor(rect.height)
            );

        const dpr =
            Math.max(
                1,
                window.devicePixelRatio || 1
            );

        if (
            width === this.width &&
            height === this.height &&
            dpr === this.dpr
        ) {
            return;
        }

        this.width =
            width;

        this.height =
            height;

        this.dpr =
            dpr;

        this.farLayerDirty =
            true;

        this.resizeCanvas(
            this.farCanvas,
            this.farCtx,
            width,
            height,
            dpr
        );

        this.resizeCanvas(
            this.nearCanvas,
            this.nearCtx,
            width,
            height,
            dpr
        );
    }

    private resizeCanvas(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D | null,
        width: number,
        height: number,
        dpr: number
    ) {
        canvas.width =
            Math.floor(width * dpr);

        canvas.height =
            Math.floor(height * dpr);

        canvas.style.width =
            `${width}px`;

        canvas.style.height =
            `${height}px`;

        ctx?.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }

    private createStars(
        settings: CosmosSettings
    ) {
        this.starsFar =
            this.generateStars(
                settings.backgroundFarStarCount,
                {
                    minDepth: 0.15,
                    maxDepth: 0.45
                }
            );

        this.starsNear =
            this.generateStars(
                settings.backgroundNearStarCount,
                {
                    minDepth: 0.5,
                    maxDepth: 1
                }
            );

        this.farLayerDirty =
            true;
    }

    private generateStars(
        count: number,
        config: {
            minDepth: number;
            maxDepth: number;
        }
    ): BackgroundStar[] {
        const stars: BackgroundStar[] =
            [];

        for (
            let i = 0;
            i < count;
            i++
        ) {
            stars.push({
                x: randomFloat(
                    0,
                    1
                ),

                y: randomFloat(
                    0,
                    1
                ),

                sizeRatio: randomFloat(0, 1),

                depth: randomFloat(
                    config.minDepth,
                    config.maxDepth
                ),

                opacityRatio: randomFloat(0, 1),

                hueRatio: randomFloat(0, 1),

                pulseRoll: randomFloat(0, 1),

                twinkleOffset:
                    randomFloat(
                        0,
                        Math.PI * 2
                    ),

                twinkleSpeed:
                    randomFloat(
                        0.25,
                        0.8
                    )
            });
        }

        return stars;
    }

    private draw() {
        if (
            !this.farCtx ||
            !this.nearCtx
        ) {
            return;
        }

        const now =
            performance.now();

        const time =
            now * 0.001;

        const settings =
            this.settings;

        if (!settings) {
            return;
        }

        if (
            this.farLayerDirty ||
            now - this.lastFarDrawTime >=
                this.farFrameInterval
        ) {
            this.lastFarDrawTime =
                now;

            this.clearLayer(
                this.farCtx
            );

            this.drawStars(
                this.farCtx,
                this.starsFar,
                this.parallaxX *
                    settings.backgroundFarParallax,
                this.parallaxY *
                    settings.backgroundFarParallax,
                this.farVisibility,
                false,
                time,
                settings
            );

            this.farLayerDirty =
                false;
        }

        if (
            now - this.lastNearDrawTime <
            this.nearFrameInterval
        ) {
            return;
        }

        this.lastNearDrawTime =
            now;

        this.clearLayer(
            this.nearCtx
        );

        this.drawStars(
            this.nearCtx,
            this.starsNear,
            this.parallaxX *
                settings.backgroundNearParallax,
            this.parallaxY *
                settings.backgroundNearParallax,
            this.nearVisibility,
            true,
            time,
            settings
        );
    }

    private clearLayer(
        ctx: CanvasRenderingContext2D
    ) {
        ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );
    }

    private drawStars(
    ctx: CanvasRenderingContext2D,
    stars: BackgroundStar[],
    parallaxX: number,
    parallaxY: number,
    visibility: number,
    drawSoftGlow: boolean,
    time: number,
    settings: CosmosSettings
) {
    const baseMargin =
        drawSoftGlow
            ? 80
            : 24;

    for (const star of stars) {
        const size =
            this.getStarSize(
                star,
                drawSoftGlow,
                settings
            );

        const twinkle =
            star.pulseRoll <=
            settings.backgroundPulseChance
                ? Math.sin(
                    time *
                        star.twinkleSpeed +
                        star.twinkleOffset
                ) * 0.035
                : 0;

        const opacity =
            clamp(
                (
                    this.getStarOpacity(
                        star,
                        drawSoftGlow,
                        settings
                    ) +
                    twinkle
                ) *
                    visibility,
                0,
                1
            );

        if (opacity <= 0.01) {
            continue;
        }

        const x =
            star.x * this.width +
            parallaxX * star.depth +
            this.getStarDriftX(
                star,
                drawSoftGlow,
                time,
                settings
            );

        const y =
            star.y * this.height +
            parallaxY * star.depth +
            this.getStarDriftY(
                star,
                drawSoftGlow,
                time,
                settings
            );

        const visualRadius =
            drawSoftGlow
                ? size * 2.2
                : size;

        const margin =
            baseMargin + visualRadius;

        if (
            x + visualRadius < -margin ||
            x - visualRadius > this.width + margin ||
            y + visualRadius < -margin ||
            y - visualRadius > this.height + margin
        ) {
            continue;
        }

        this.drawStar(
            ctx,
            x,
            y,
            size,
            opacity,
            this.getStarColor(
                star,
                settings
            ),
            drawSoftGlow
        );
    }
}

    private getStarDriftX(
        star: BackgroundStar,
        isNearLayer: boolean,
        time: number,
        settings: CosmosSettings
    ) {
        const duration = isNearLayer
            ? settings.backgroundNearDriftSeconds
            : settings.backgroundFarDriftSeconds;

        const safeDuration =
            Math.max(1, duration);

        return (
            Math.cos(
                time /
                    safeDuration *
                    Math.PI *
                    2 +
                    star.twinkleOffset
            ) *
            12 *
            star.depth
        );
    }

    private getStarDriftY(
        star: BackgroundStar,
        isNearLayer: boolean,
        time: number,
        settings: CosmosSettings
    ) {
        const duration = isNearLayer
            ? settings.backgroundNearDriftSeconds
            : settings.backgroundFarDriftSeconds;

        const safeDuration =
            Math.max(1, duration);

        return (
            Math.sin(
                time /
                    safeDuration *
                    Math.PI *
                    2 +
                    star.twinkleOffset
            ) *
            7 *
            star.depth
        );
    }

    private getStarSize(
        star: BackgroundStar,
        isNearLayer: boolean,
        settings: CosmosSettings
    ) {
        const minSize = isNearLayer
            ? settings.backgroundNearStarMinSize
            : settings.backgroundFarStarMinSize;

        const maxSize = isNearLayer
            ? settings.backgroundNearStarMaxSize
            : settings.backgroundFarStarMaxSize;

        const safeMin =
            Math.max(0.05, Math.min(minSize, maxSize));

        const safeMax =
            Math.max(safeMin, Math.max(minSize, maxSize));

        return (
            safeMin +
            (safeMax - safeMin) *
                star.sizeRatio
        );
    }

    private getStarOpacity(
        star: BackgroundStar,
        isNearLayer: boolean,
        settings: CosmosSettings
    ) {
        const safeMin =
            clamp(
                Math.min(
                    settings.backgroundStarMinAlpha,
                    settings.backgroundStarMaxAlpha
                ),
                0,
                1
            );

        const safeMax =
            clamp(
                Math.max(
                    settings.backgroundStarMinAlpha,
                    settings.backgroundStarMaxAlpha
                ),
                safeMin,
                1
            );

        const layerMultiplier =
            isNearLayer
                ? 0.72
                : 0.32;

        return (
            (
                safeMin +
                (safeMax - safeMin) *
                    star.opacityRatio
            ) *
            layerMultiplier
        );
    }

    private getStarColor(
        star: BackgroundStar,
        settings: CosmosSettings
    ) {
        const hueMin =
            settings.backgroundStarHueMin;

        const hueMax =
            settings.backgroundStarHueMax;

        const hue =
            hueMin +
            (hueMax - hueMin) *
                star.hueRatio;

        return `hsl(${hue}, 85%, 86%)`;
    }

    private drawStar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        opacity: number,
        color: string,
        drawSoftGlow: boolean
    ) {
        ctx.globalAlpha =
            opacity;

        ctx.fillStyle =
            color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (drawSoftGlow) {
            ctx.globalAlpha =
                opacity * 0.16;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                size * 2.1,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }

    private destroyCanvasOnly() {
        this.farCanvas?.remove();
        this.nearCanvas?.remove();
        this.root?.remove();

        this.root =
            null;

        this.farCanvas =
            null;

        this.farCtx =
            null;

        this.nearCanvas =
            null;

        this.nearCtx =
            null;

        this.starsFar =
            [];

        this.starsNear =
            [];

        this.width =
            0;

        this.height =
            0;

        this.farLayerDirty =
            true;

        this.lastNearDrawTime =
            0;

        this.lastFarDrawTime =
            0;
    }
}
