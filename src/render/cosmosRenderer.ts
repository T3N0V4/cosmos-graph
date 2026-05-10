import CosmosGraphPlugin from "../main";
import type { CosmosSettings } from "../settings/settings";

import { ParallaxController } from "src/Controller/parallaxController";
import { ParticleSystem } from "./particleSystem";
import { CosmicObjects } from "./cosmicObjects";
import { BackgroundRenderer } from "./backgroundRenderer";
import { CanvasLayer } from "./canvasLayer";
import { ShootingStars } from "../effects/shootingStars";
import { InteractionEffects } from "src/effects/interactionEffects";
import { BurstSystem } from "../effects/burstSystem";
import { InteractionManager } from "src/interaction/InteractionManager";
import { drawBurstCooldownHud } from "./burstCooldownHud";
import { PerformanceProfiler } from "src/util/performanceProfiler";

import {
    DebugHudMetrics,
    DebugHudOptions
} from "./debugHud";

const RESET_BUTTON_CLASS =
    "cosmos-reset-stars-button";

const SYSTEM_STATS_CLASS =
    "cosmos-system-stats";

const SYSTEM_STATS_TOGGLE_CLASS =
    "cosmos-system-stats-toggle";

type ParticleSettingsSnapshot = Pick<
    CosmosSettings,
    | "maxParticles"
    | "starMinSize"
    | "starMaxSize"
    | "starHueMin"
    | "starHueMax"
    | "particleColor"
    | "baseSpeed"
>;

export class CosmosRenderer {
    private canvasLayer =
        new CanvasLayer();

    private graphView: HTMLElement | null = null;

    private resizeObserver: ResizeObserver | null = null;

    private animationFrame: number | null = null;
    private injectInterval: number | null = null;

    private destroyed = false;

    private resetButton: HTMLButtonElement | null = null;
    private statsPanel: HTMLDivElement | null = null;
    private statsBody: HTMLDivElement | null = null;
    private statsToggleButton: HTMLButtonElement | null = null;
    private statsCollapsed = false;
    private statsPinned = true;
    private statsClosed = false;
    private statsDragStart:
        {
            mouseX: number;
            mouseY: number;
            left: number;
            top: number;
        } | null = null;

    private lastTime = 0;

    /*
        DEBUG HUD BASE

        Luego estos valores deberían venir desde settings.
    */
    private debugHudEnabled = false;

    private debugHudOptions: DebugHudOptions = {
        showPerformance: true,
        showEntities: true,
        showCanvas: true,
        showMouse: true
    };

    private fps = 0;
    private fpsFrameCount = 0;
    private fpsTimer = 0;

    private frameMs = 0;
    private updateMs = 0;
    private drawMs = 0;

    private profiler =
        new PerformanceProfiler();

    private particleSystem =
        new ParticleSystem();

    private parallaxController =
        new ParallaxController();

    private burstSystem =
        new BurstSystem(
            this.particleSystem
        );

    private shootingStars =
        new ShootingStars();

    private cosmicObjects =
        new CosmicObjects();

    private backgroundRenderer =
        new BackgroundRenderer();

    private interactionEffects =
        new InteractionEffects(
            this.burstSystem
        );

    private interactionManager:
        InteractionManager | null = null;

    private mouse = {
        x: 0,
        y: 0,
        radius: 130,
        isInside: false
    };

    constructor(
        private plugin: CosmosGraphPlugin
    ) {
        this.particleSettingsSnapshot =
            this.getParticleSettingsSnapshot(
                this.plugin.settings
            );
    }

    private particleSettingsSnapshot:
        ParticleSettingsSnapshot;

    start() {
        if (this.injectInterval !== null) {
            return;
        }

        this.destroyed = false;

        this.injectCosmos();

        this.injectInterval =
            window.setInterval(() => {
                if (this.destroyed) {
                    return;
                }

                this.injectCosmos();
            }, 1000);
    }

    reloadSettings() {
        if (this.destroyed) return;

        const currentParticleSettings =
            this.getParticleSettingsSnapshot(
                this.plugin.settings
            );

        const didMaxParticlesChange =
            this.particleSettingsSnapshot
                .maxParticles !==
            currentParticleSettings.maxParticles;

        const didParticleVisualSettingsChange =
            this.didParticleVisualSettingsChange(
                this.particleSettingsSnapshot,
                currentParticleSettings
            );

        this.backgroundRenderer.applySettings(
            this.plugin.settings
        );

        this.particleSystem.invalidateConnections();

        if (didMaxParticlesChange) {
            this.particleSystem.limitParticles(
                this.plugin.settings.maxParticles
            );
        }

        if (didParticleVisualSettingsChange) {
            this.particleSystem.applyVisualSettings(
                this.plugin.settings
            );
        }

        this.particleSettingsSnapshot =
            currentParticleSettings;

        this.burstSystem.limitParticles(
            this.plugin.settings
                .burstParticleLimit
        );

        this.cosmicObjects.applySettings?.(
            this.plugin.settings
        );

        this.mouse.radius =
            this.plugin.settings
                .mouseFieldRadius;

        this.parallaxController.setRadius(
            this.plugin.settings
                .mouseFieldRadius
        );
    }

    private getParticleSettingsSnapshot(
        settings: CosmosSettings
    ): ParticleSettingsSnapshot {
        return {
            maxParticles: settings.maxParticles,
            starMinSize: settings.starMinSize,
            starMaxSize: settings.starMaxSize,
            starHueMin: settings.starHueMin,
            starHueMax: settings.starHueMax,
            particleColor: settings.particleColor,
            baseSpeed: settings.baseSpeed
        };
    }

    private didParticleVisualSettingsChange(
        previous: ParticleSettingsSnapshot,
        current: ParticleSettingsSnapshot
    ) {
        return (
            previous.starMinSize !==
                current.starMinSize ||
            previous.starMaxSize !==
                current.starMaxSize ||
            previous.starHueMin !==
                current.starHueMin ||
            previous.starHueMax !==
                current.starHueMax ||
            previous.particleColor !==
                current.particleColor ||
            previous.baseSpeed !==
                current.baseSpeed
        );
    }

    destroy() {
        this.destroyed = true;

        if (this.injectInterval !== null) {
            window.clearInterval(
                this.injectInterval
            );

            this.injectInterval = null;
        }

        this.teardownGraphInstance();

        this.cleanupCosmosElements();

        this.cleanupGraphViewStyles();
    }

    private injectCosmos() {
        if (this.destroyed) return;

        const graphView =
            document.querySelector(
                '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
            ) as HTMLElement | null;

        if (!graphView) return;

        const isNewGraphView =
            this.graphView !== graphView;

        if (
            !isNewGraphView &&
            this.canvasLayer.isConnected()
        ) {
            return;
        }

        if (
            isNewGraphView &&
            this.graphView !== null
        ) {
            this.teardownGraphInstance();
        }

        this.graphView = graphView;

        this.backgroundRenderer.setContainer(
            graphView,
            this.plugin.settings
        );

        this.ensureResetButton(graphView);

        if (this.debugHudEnabled) {
            this.ensureSystemStatsPanel(graphView);
        }

        const attached =
            this.canvasLayer.attach(graphView);

        if (!attached) return;

        this.setupResizeObserver();

        this.resizeCanvas();

        const canvas =
            this.canvasLayer.getCanvas();

        if (!canvas) return;

        this.parallaxController.setSize(
            canvas.clientWidth,
            canvas.clientHeight
        );

        this.setupInteractionManager();

        if (
            canvas.clientWidth <= 0 ||
            canvas.clientHeight <= 0
        ) {
            return;
        }

        if (
            isNewGraphView ||
            !this.particleSystem.hasParticles()
        ) {
            this.burstSystem.clear();

            this.cosmicObjects.create(
                canvas.clientWidth,
                canvas.clientHeight
            );

            this.particleSystem.createParticles(
                canvas.clientWidth,
                canvas.clientHeight,
                this.plugin.settings
                    .particleCount,
                this.plugin.settings
            );
        }

        this.shootingStars.scheduleNext(
            performance.now()
        );

        if (this.animationFrame === null) {
            this.lastTime =
                performance.now();

            this.animate(
                this.lastTime
            );
        }
    }

    private isGraphDetached() {
        return (
            !this.graphView ||
            !this.graphView.isConnected
        );
    }

    private teardownGraphInstance() {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame = null;
        }

        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        this.interactionManager?.destroy();
        this.interactionManager = null;

        this.removeResetButton();
        this.removeSystemStatsPanel();

        this.canvasLayer.destroy();

        this.graphView = null;
    }

    private ensureResetButton(
        graphView: HTMLElement
    ) {
        let button =
            graphView.querySelector(
                `.${RESET_BUTTON_CLASS}`
            ) as HTMLButtonElement | null;

        if (!button) {
            button =
                document.createElement(
                    "button"
                );

            button.className =
                RESET_BUTTON_CLASS;

            button.textContent =
                "Reset stars";

            button.title =
                "Reset Cosmos stars";

            button.addEventListener(
                "click",
                this.handleResetStars
            );

            graphView.appendChild(button);
        }

        this.resetButton = button;
    }

    private handleResetStars = (
        event: MouseEvent
    ) => {
        event.stopPropagation();
        event.preventDefault();

        this.resetStars();
    };

    private resetStars() {
        const width =
            this.canvasLayer.getWidth();

        const height =
            this.canvasLayer.getHeight();

        if (width <= 0 || height <= 0) {
            return;
        }

        this.burstSystem.clear();

        this.backgroundRenderer.regenerate(
            this.plugin.settings
        );

        this.cosmicObjects.create(
            width,
            height
        );

        this.particleSystem.createParticles(
            width,
            height,
            this.plugin.settings.particleCount,
            this.plugin.settings
        );
    }

    private removeResetButton() {
        this.resetButton?.removeEventListener(
            "click",
            this.handleResetStars
        );

        this.resetButton?.remove();
        this.resetButton = null;

        document.removeEventListener(
            "mousemove",
            this.handleStatsDragMove
        );

        document.removeEventListener(
            "mouseup",
            this.handleStatsDragEnd
        );
    }

    private setupInteractionManager() {
        if (!this.graphView) return;

        const canvas =
            this.canvasLayer.getCanvas();

        if (!canvas) return;

        this.interactionManager?.destroy();

        this.interactionManager =
            new InteractionManager({
                graphView:
                    this.graphView,

                canvas,

                mouse:
                    this.mouse,

                parallaxController:
                    this.parallaxController,

                interactionEffects:
                    this.interactionEffects,

                cosmicObjects:
                    this.cosmicObjects,

                getSettings: () =>
                    this.plugin.settings
            });

        this.interactionManager.attach();
    }

    private cleanupCosmosElements() {
    CanvasLayer.cleanupAll();

    document
        .querySelectorAll(
            [
                ".cosmos-background-root",
                ".cosmos-background-canvas",
                ".cosmos-background-layer",
                ".cosmos-stars-far",
                ".cosmos-stars-near",
                `.${SYSTEM_STATS_CLASS}`,
                `.${RESET_BUTTON_CLASS}`
            ].join(", ")
        )
        .forEach((element) => {
            element.remove();
        });
}

    private setupResizeObserver() {
        if (!this.graphView) return;

        this.resizeObserver?.disconnect();

        this.resizeObserver =
            new ResizeObserver(() => {
                if (this.destroyed) {
                    return;
                }

                if (this.isGraphDetached()) {
                    this.teardownGraphInstance();
                    return;
                }

                this.resizeCanvas();
            });

        this.resizeObserver.observe(
            this.graphView
        );
    }

    private resizeCanvas() {
        if (
            this.destroyed ||
            !this.graphView
        ) {
            return;
        }

        const resized =
            this.canvasLayer.resize(
                this.graphView
            );

        if (!resized) return;

        this.parallaxController.setSize(
            this.canvasLayer.getWidth(),
            this.canvasLayer.getHeight()
        );
    }

    private animate = (
        time: number
    ) => {
        if (this.destroyed) {
            return;
        }

        if (this.isGraphDetached()) {
            this.teardownGraphInstance();
            return;
        }

        const canvas =
            this.canvasLayer.getCanvas();

        const ctx =
            this.canvasLayer.getContext();

        if (
            !canvas ||
            !ctx
        ) {
            this.animationFrame = null;
            return;
        }

        if (
            canvas.clientWidth <= 0 ||
            canvas.clientHeight <= 0
        ) {
            this.animationFrame =
                requestAnimationFrame(
                    this.animate
                );

            return;
        }

        const frameStart =
            performance.now();

        const rawDelta =
        time - this.lastTime;

        const delta = Math.min(
            rawDelta,
            32
        );

this.lastTime = time;

this.updateFps(rawDelta);

        const updateStart =
            performance.now();

        this.update(
            delta,
            time
        );

        this.updateMs =
            performance.now() - updateStart;

        const drawStart =
            performance.now();

        this.draw(time);

        this.drawMs =
            performance.now() - drawStart;

        this.frameMs =
            performance.now() - frameStart;

        if (this.destroyed) {
            return;
        }

        this.animationFrame =
            requestAnimationFrame(
                this.animate
            );
    };

    private updateFps(delta: number) {
        this.fpsFrameCount++;
        this.fpsTimer += delta;

        if (this.fpsTimer < 500) {
            return;
        }

        this.fps =
            Math.round(
                this.fpsFrameCount *
                    1000 /
                    this.fpsTimer
            );

        this.fpsFrameCount = 0;
        this.fpsTimer = 0;
    }

    private update(
        delta: number,
        time: number
    ) {
        if (this.destroyed) {
            return;
        }

        const canvas =
            this.canvasLayer.getCanvas();

        if (!canvas) return;

        this.parallaxController.setSize(
            canvas.clientWidth,
            canvas.clientHeight
        );

        this.profiler.measure(
            "parallaxController.update",
            () => {
                this.parallaxController.update(
                    delta
                );
            }
        );

        this.profiler.measure(
            "interactionEffects.update",
            () => {
                this.interactionEffects.update(
                    delta,
                    this.plugin.settings
                        .gravityCooldownMs
                );
            }
        );

        this.profiler.measure(
            "backgroundRenderer.update",
            () => {
                const backgroundParallax =
                    this.parallaxController.getOffset(
                        1
                    );

                this.backgroundRenderer.setParallax(
                    backgroundParallax.x,
                    backgroundParallax.y
                );

                this.backgroundRenderer.update(
                    this.plugin.settings
                        .enableBackground,
                    this.plugin.settings
                        .enableParallax
                );
            }
        );

        this.profiler.measure(
            "cosmicObjects.update",
            () => {
                this.cosmicObjects.update(
                    delta
                );
            }
        );

        this.profiler.measure(
            "particleSystem.update",
            () => {
                this.particleSystem.update(
                    canvas.clientWidth,
                    canvas.clientHeight,

                    this.mouse,

                    delta,

                    this.plugin.settings
                );
            }
        );

        this.profiler.measure(
            "burstSystem.update",
            () => {
                this.burstSystem.update(
                    canvas.clientWidth,
                    canvas.clientHeight,
                    delta,
                    this.plugin.settings.maxParticles
                );
            }
        );

        this.profiler.measure(
            "shootingStars.update",
            () => {
                this.shootingStars.update(
                    delta,
                    time,

                    canvas.clientWidth,
                    canvas.clientHeight,

                    this.plugin.settings
                        .enableShootingStars
                );
            }
        );
    }

    private draw(
    time: number
) {
    if (this.destroyed) {
        return;
    }

    const ctx =
        this.canvasLayer.getContext();

    if (!ctx) {
        return;
    }

    const visualMouse =
        this.parallaxController.getMouse();

    this.profiler.measure(
        "canvasLayer.clear",
        () => {
            this.canvasLayer.clear();
        }
    );

    if (this.plugin.settings.enableParticles) {
        this.profiler.measure(
            "cosmicObjects.draw",
            () => {
                this.cosmicObjects.draw(
                    ctx,
                    time,
                    visualMouse,
                    this.plugin.settings.enableParallax
                );
            }
        );

        this.profiler.measure(
            "particleSystem.draw",
            () => {
                this.particleSystem.draw(
                    ctx,
                    time,
                    visualMouse,
                    this.plugin.settings
                );
            }
        );

        this.profiler.measure(
            "burstSystem.draw",
            () => {
                this.burstSystem.draw(
                    ctx,
                    this.mouse,
                    this.plugin.settings
                );
            }
        );
    }

    this.profiler.measure(
        "shootingStars.draw",
        () => {
            this.shootingStars.draw(
                ctx
            );
        }
    );

    this.profiler.measure(
        "burstCooldownHud.draw",
        () => {
            drawBurstCooldownHud(
                ctx,
                this.mouse,
                this.plugin.settings.clickEffectMode,
                this.interactionEffects.getBurstCooldownProgress(
                    this.plugin.settings.gravityCooldownMs
                ),
                this.interactionEffects.canUseBurst()
            );
        }
    );

    this.updateSystemStatsPanel();

    this.profiler.reportEvery(
        1000
    );
}

    private updateSystemStatsPanel() {
        if (!this.debugHudEnabled) {
            return;
        }

        if (this.statsClosed) {
            return;
        }

        if (!this.statsBody) {
            return;
        }

        const metrics =
            this.getDebugHudMetrics();

        this.statsBody.empty();

        if (this.statsCollapsed) {
            return;
        }

        this.addStatsRow(
            "FPS",
            `${metrics.fps}`
        );

        this.addStatsRow(
            "Frame time",
            `${metrics.frameMs.toFixed(2)} ms`
        );

        this.addStatsRow(
            "Update",
            `${metrics.updateMs.toFixed(2)} ms`
        );

        this.addStatsRow(
            "Draw",
            `${metrics.drawMs.toFixed(2)} ms`
        );

        this.addStatsDivider();

        this.addStatsRow(
            "Particles",
            `${metrics.particles}`
        );

        this.addStatsRow(
            "Burst particles",
            `${metrics.burstParticles}`
        );

        this.addStatsRow(
            "Shooting stars",
            `${metrics.shootingStars}`
        );

        this.addStatsDivider();

        this.addStatsRow(
            "Connections",
            `${metrics.connectionSegments}`
        );

        this.addStatsRow(
            "Connection time",
            `${metrics.connectionDrawMs.toFixed(2)} ms`
        );

        this.addStatsRow(
            "Canvas",
            `${metrics.canvasWidth} x ${metrics.canvasHeight}`
        );

        this.addStatsRow(
            "Mouse",
            metrics.mouseInside
                ? "Inside"
                : "Outside"
        );
    }

    private ensureSystemStatsPanel(
        graphView: HTMLElement
    ) {
        if (!this.debugHudEnabled) {
            return;
        }

        this.ensureSystemStatsToggle(
            graphView
        );

        if (this.statsClosed) {
            return;
        }

        if (this.statsPanel?.isConnected) {
            return;
        }

        const panel =
            document.createElement("div");

        panel.className =
            SYSTEM_STATS_CLASS;

        const header =
            panel.createDiv({
                cls: "cosmos-system-stats-header"
            });

        header.createEl("span", {
            text: "System"
        });

        const actions =
            header.createDiv({
                cls: "cosmos-system-stats-actions"
            });

        const collapseButton =
            actions.createEl("button", {
                text: "−",
                cls: "cosmos-system-stats-button"
            });

        const pinButton =
            actions.createEl("button", {
                text: "Pin",
                cls: "cosmos-system-stats-button"
            });

        const closeButton =
            actions.createEl("button", {
                text: "x",
                cls: "cosmos-system-stats-button"
            });

        const body =
            panel.createDiv({
                cls: "cosmos-system-stats-body"
            });

        header.addEventListener(
            "mousedown",
            this.handleStatsDragStart
        );

        collapseButton.onclick = () => {
            this.statsCollapsed =
                !this.statsCollapsed;

            collapseButton.textContent =
                this.statsCollapsed
                    ? "+"
                    : "−";

            panel.toggleClass(
                "is-collapsed",
                this.statsCollapsed
            );
        };

        pinButton.onclick = () => {
            this.statsPinned =
                !this.statsPinned;

            pinButton.textContent =
                this.statsPinned
                    ? "Pin"
                    : "Float";

            panel.toggleClass(
                "is-floating",
                !this.statsPinned
            );
        };

        closeButton.onclick = () => {
            this.statsClosed = true;
            this.statsPanel?.remove();
            this.statsPanel = null;
            this.statsBody = null;
            this.statsToggleButton?.show();
        };

        graphView.appendChild(panel);

        this.statsPanel = panel;
        this.statsBody = body;
        this.statsToggleButton?.hide();
    }

    private ensureSystemStatsToggle(
        graphView: HTMLElement
    ) {
        if (!this.debugHudEnabled) {
            return;
        }

        if (this.statsToggleButton?.isConnected) {
            return;
        }

        const button =
            document.createElement("button");

        button.className =
            SYSTEM_STATS_TOGGLE_CLASS;

        button.textContent =
            "System";

        button.title =
            "Open system stats";

        button.onclick = () => {
            this.statsClosed = false;
            button.hide();
            this.ensureSystemStatsPanel(
                graphView
            );
        };

        graphView.appendChild(button);

        this.statsToggleButton = button;

        if (!this.statsClosed) {
            button.hide();
        }
    }

    private handleStatsDragStart = (
        event: MouseEvent
    ) => {
        if (
            !this.statsPanel ||
            (
                event.target instanceof HTMLElement &&
                event.target.closest("button")
            )
        ) {
            return;
        }

        event.preventDefault();

        const panelRect =
            this.statsPanel.getBoundingClientRect();

        const parentRect =
            this.statsPanel.offsetParent instanceof HTMLElement
                ? this.statsPanel.offsetParent.getBoundingClientRect()
                : { left: 0, top: 0 };

        this.statsDragStart = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            left: panelRect.left - parentRect.left,
            top: panelRect.top - parentRect.top
        };

        document.addEventListener(
            "mousemove",
            this.handleStatsDragMove
        );

        document.addEventListener(
            "mouseup",
            this.handleStatsDragEnd
        );
    };

    private handleStatsDragMove = (
        event: MouseEvent
    ) => {
        if (
            !this.statsPanel ||
            !this.statsDragStart
        ) {
            return;
        }

        const nextLeft =
            this.statsDragStart.left +
            event.clientX -
            this.statsDragStart.mouseX;

        const nextTop =
            this.statsDragStart.top +
            event.clientY -
            this.statsDragStart.mouseY;

        this.statsPanel.style.left =
            `${Math.max(0, nextLeft)}px`;

        this.statsPanel.style.top =
            `${Math.max(0, nextTop)}px`;

        this.statsPanel.style.right =
            "auto";
    };

    private handleStatsDragEnd = () => {
        this.statsDragStart = null;

        document.removeEventListener(
            "mousemove",
            this.handleStatsDragMove
        );

        document.removeEventListener(
            "mouseup",
            this.handleStatsDragEnd
        );
    };

    private removeSystemStatsPanel() {
        this.statsPanel?.remove();
        this.statsToggleButton?.remove();

        this.statsPanel = null;
        this.statsBody = null;
        this.statsToggleButton = null;
    }

    private addStatsRow(
        label: string,
        value: string
    ) {
        if (!this.statsBody) {
            return;
        }

        const row =
            this.statsBody.createDiv({
                cls: "cosmos-system-stats-row"
            });

        row.createSpan({
            text: label
        });

        row.createSpan({
            text: value
        });
    }

    private addStatsDivider() {
        this.statsBody?.createDiv({
            cls: "cosmos-system-stats-divider"
        });
    }

    private getDebugHudMetrics(): DebugHudMetrics {
    const particleMetrics =
        this.particleSystem.getDebugMetrics();

    return {
        fps: this.fps,

        frameMs: this.frameMs,
        updateMs: this.updateMs,
        drawMs: this.drawMs,

        particleDrawMs:
            particleMetrics.drawParticlesMs,

        connectionDrawMs:
            particleMetrics.drawConnectionsMs,

        connectionGridMs:
            particleMetrics.connectionGridMs,

        connectionScanMs:
            particleMetrics.connectionScanMs,

        connectionStrokeMs:
            particleMetrics.connectionStrokeMs,

        connectionSegments:
            particleMetrics.connectionSegments,

        connectionBuckets:
            particleMetrics.connectionBuckets,

        connectionRenderPoints:
            particleMetrics.connectionRenderPoints,

        particles:
            this.particleSystem.getParticleCount(),

        burstParticles:
            this.burstSystem.getParticleCount(),

        shootingStars:
            this.shootingStars.getStarCount(),

        canvasWidth:
            this.canvasLayer.getWidth(),

        canvasHeight:
            this.canvasLayer.getHeight(),

        mouseInside:
            this.mouse.isInside,

        clickEffectMode:
            this.plugin.settings
                .clickEffectMode
    };
}

    private cleanupGraphViewStyles() {
        const graphViews =
            document.querySelectorAll<HTMLElement>(
                '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
            );

        graphViews.forEach(
            (graphView) => {
                graphView.style.removeProperty(
                    "background"
                );

                graphView.style.removeProperty(
                    "background-color"
                );

                graphView.style.removeProperty(
                    "position"
                );

                graphView.style.removeProperty(
                    "overflow"
                );
            }
        );
    }
}
