import CosmosGraphPlugin from "../main";

import { ParticleSystem } from "./particleSystem";
import { ShootingStars } from "./shootingStars";
import { InteractionEffects } from "./interactionEffects";
import { BurstSystem } from "./burstSystem";
import { CosmicObjects } from "./cosmicObjects";
import { BackgroundRenderer } from "./backgroundRenderer";

export class CosmosRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private graphView: HTMLElement | null = null;
    private eventsBoundTo: HTMLElement | null = null;

    private resizeObserver: ResizeObserver | null = null;

    private animationFrame: number | null = null;

    private lastTime = 0;

    private particleSystem = new ParticleSystem();

    private burstSystem = new BurstSystem(
        this.particleSystem
    );

    private shootingStars = new ShootingStars();

    private cosmicObjects =
        new CosmicObjects();

    private backgroundRenderer =
        new BackgroundRenderer();

    private interactionEffects =
        new InteractionEffects(
            this.burstSystem
        );

    private mouse = {
        x: -9999,
        y: -9999,
        radius: 130
    };

    constructor(
        private plugin: CosmosGraphPlugin
    ) {}

    start() {
        this.injectLoop();
    }

    reloadSettings() {
        this.backgroundRenderer.applySettings(
            this.plugin.settings
        );

        this.particleSystem.limitParticles(
            this.plugin.settings.maxParticles
        );

        this.particleSystem.applyVisualSettings(
            this.plugin.settings
        );

        this.burstSystem.limitParticles(
            this.plugin.settings.burstParticleLimit
        );

        this.cosmicObjects.applySettings?.(
            this.plugin.settings
        );

        this.mouse.radius =
        this.plugin.settings.mouseFieldRadius;
}

    destroy() {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(
                this.animationFrame
            );
        }

        this.resizeObserver?.disconnect();

        this.canvas?.remove();

        this.canvas = null;
        this.ctx = null;
        this.graphView = null;
        this.eventsBoundTo = null;
    }

    private injectLoop() {
        window.setInterval(() => {
            this.injectCosmos();
        }, 1000);
    }

    private injectCosmos() {
        const graphView =
            document.querySelector(
                '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
            ) as HTMLElement | null;

        if (!graphView) return;

        const isNewGraphView =
            this.graphView !== graphView;

        if (
            !isNewGraphView &&
            this.canvas?.isConnected
        ) {
            return;
        }

        this.graphView = graphView;

        this.backgroundRenderer.setContainer(
            graphView,
            this.plugin.settings
        );

        let canvas =
            graphView.querySelector(
                ".cosmos-animation-canvas"
            ) as HTMLCanvasElement | null;

        if (!canvas) {
            canvas =
                document.createElement("canvas");

            canvas.className =
                "cosmos-animation-canvas";

            canvas.style.position = "absolute";
            canvas.style.inset = "0";

            canvas.style.width = "100%";
            canvas.style.height = "100%";

            canvas.style.pointerEvents = "none";

            canvas.style.zIndex = "5";

            canvas.style.opacity = "1";

            canvas.style.mixBlendMode =
                "screen";

            graphView.appendChild(canvas);
        }

        this.canvas = canvas;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;

        this.ctx = ctx;

        this.setupResizeObserver();

        this.resizeCanvas();

        this.setupEvents();

        if (
            this.canvas.clientWidth <= 0 ||
            this.canvas.clientHeight <= 0
        ) {
            return;
        }

        if (
            isNewGraphView ||
            !this.particleSystem.hasParticles()
        ) {
            this.burstSystem.clear();

            this.cosmicObjects.create(
                this.canvas.clientWidth,
                this.canvas.clientHeight
            );

            this.particleSystem.createParticles(
                this.canvas.clientWidth,
                this.canvas.clientHeight,
                this.plugin.settings.particleCount,
                this.plugin.settings
            );
        }

        this.shootingStars.scheduleNext(
            performance.now()
        );

        if (this.animationFrame === null) {
            this.lastTime =
                performance.now();

            this.animate(this.lastTime);
        }
    }

    private setupResizeObserver() {
        if (!this.graphView) return;

        this.resizeObserver?.disconnect();

        this.resizeObserver =
            new ResizeObserver(() => {
                this.resizeCanvas();
            });

        this.resizeObserver.observe(
            this.graphView
        );
    }

    private resizeCanvas() {
        if (
            !this.canvas ||
            !this.graphView ||
            !this.ctx
        ) {
            return;
        }

        const rect =
            this.graphView.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        const dpr =
            window.devicePixelRatio || 1;

        this.canvas.width = Math.floor(
            rect.width * dpr
        );

        this.canvas.height = Math.floor(
            rect.height * dpr
        );

        this.canvas.style.width =
            `${rect.width}px`;

        this.canvas.style.height =
            `${rect.height}px`;

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }

    private setupEvents() {
        if (!this.graphView) return;

        if (this.eventsBoundTo === this.graphView) {
            return;
        }

        this.eventsBoundTo = this.graphView;

        this.graphView.addEventListener(
            "mousemove",
            (event: MouseEvent) => {
                if (!this.canvas) return;

                const rect =
                    this.canvas.getBoundingClientRect();

                this.mouse.x =
                    event.clientX - rect.left;

                this.mouse.y =
                    event.clientY - rect.top;

                this.backgroundRenderer.updateMouse(
                    this.mouse.x,
                    this.mouse.y,
                    this.plugin.settings.enableParallax,
                    this.plugin.settings
                );
            }
        );

        this.graphView.addEventListener(
            "mouseleave",
            () => {
                this.mouse.x = -9999;
                this.mouse.y = -9999;

                this.backgroundRenderer.resetMouse();
            }
        );

        this.graphView.addEventListener(
            "wheel",
            (event: WheelEvent) => {
                this.cosmicObjects.handleWheel(
                    event.deltaY
                );
            },
            {
                passive: true
            }
        );

        this.graphView.addEventListener(
            "click",
            (event: MouseEvent) => {
                if (!this.canvas) return;

                const rect =
                    this.canvas.getBoundingClientRect();

                const x =
                    event.clientX - rect.left;

                const y =
                    event.clientY - rect.top;

                this.interactionEffects.handleClick(
                    x,
                    y,

                    this.canvas.clientWidth,
                    this.canvas.clientHeight,

                    this.plugin.settings.clickEffectMode,

                    this.plugin.settings
                        .burstParticleLimit
                );
            }
        );
    }

    private animate = (time: number) => {
        const delta = Math.min(
            time - this.lastTime,
            32
        );

        this.lastTime = time;

        this.update(delta, time);

        this.draw(time);

        this.animationFrame =
            requestAnimationFrame(
                this.animate
            );
    };

    private update(
        delta: number,
        time: number
    ) {
        if (!this.canvas) return;

        this.interactionEffects.update(
            delta,
            this.plugin.settings.gravityCooldownMs
        );

        this.backgroundRenderer.update(
            this.plugin.settings.enableParallax
        );

        this.cosmicObjects.update(
            delta
        );

        this.particleSystem.update(
            this.canvas.clientWidth,
            this.canvas.clientHeight,

            this.mouse,

            delta,

            this.plugin.settings
        );

        this.burstSystem.update(
            this.canvas.clientWidth,
            this.canvas.clientHeight,
            delta
        );

        this.shootingStars.update(
            delta,
            time,

            this.canvas.clientWidth,
            this.canvas.clientHeight,

            this.plugin.settings
                .enableShootingStars
        );
    }

    private draw(time: number) {
    if (
        !this.canvas ||
        !this.ctx
    ) {
        return;
    }

    this.ctx.clearRect(
        0,
        0,
        this.canvas.clientWidth,
        this.canvas.clientHeight
    );

    if (
        this.plugin.settings.enableParticles
    ) {
        this.cosmicObjects.draw(
            this.ctx,
            time,
            this.mouse,
            this.plugin.settings.enableParallax
        );

        this.particleSystem.draw(
            this.ctx,
            time,
            this.mouse,
            this.plugin.settings
        );

        this.burstSystem.draw(
            this.ctx,
            this.mouse
        );
    }

    this.shootingStars.draw(
        this.ctx
    );

    this.drawBurstCooldownHud(
        this.ctx
    );
}

    private drawBurstCooldownHud(
        ctx: CanvasRenderingContext2D
    ) {
        if (
            this.plugin.settings
                .clickEffectMode === "none" ||

            this.mouse.x < 0 ||
            this.mouse.y < 0
        ) {
            return;
        }

        const progress =
            this.interactionEffects.getBurstCooldownProgress(
                this.plugin.settings
                    .gravityCooldownMs
            );

        const ready =
            this.interactionEffects.canUseBurst();

        const x =
            this.mouse.x + 14;

        const y =
            this.mouse.y + 18;

        const radius = 6;

        ctx.save();

        ctx.beginPath();

        ctx.strokeStyle = ready
            ? "rgba(210, 235, 255, 0.9)"
            : "rgba(160, 190, 255, 0.35)";

        ctx.lineWidth = 1.4;

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.beginPath();

        ctx.strokeStyle =
            "rgba(120, 190, 255, 0.95)";

        ctx.lineWidth = 2;

        ctx.arc(
            x,
            y,
            radius,

            -Math.PI / 2,

            -Math.PI / 2 +
                Math.PI * 2 * progress
        );

        ctx.stroke();

        if (ready) {
            ctx.beginPath();

            ctx.fillStyle =
                "rgba(180, 220, 255, 0.75)";

            ctx.arc(
                x,
                y,
                2,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.restore();
    }
}