import type { CosmosSettings } from "../settings/settings";
import { ParallaxController } from "../Controller/parallaxController";
import { InteractionEffects } from "../effects/interactionEffects";
import { CosmicObjects } from "../render/cosmicObjects";

export type GraphMouseState = {
    x: number;
    y: number;
    radius: number;
    isInside: boolean;
};

type InteractionManagerOptions = {
    graphView: HTMLElement;
    canvas: HTMLCanvasElement;

    mouse: GraphMouseState;

    parallaxController: ParallaxController;
    interactionEffects: InteractionEffects;
    cosmicObjects: CosmicObjects;

    getSettings: () => CosmosSettings;
};

export class InteractionManager {
    private graphView: HTMLElement;
    private canvas: HTMLCanvasElement;

    private mouse: GraphMouseState;

    private parallaxController: ParallaxController;
    private interactionEffects: InteractionEffects;
    private cosmicObjects: CosmicObjects;

    private getSettings: () => CosmosSettings;

    private destroyed = false;

    constructor(options: InteractionManagerOptions) {
        this.graphView = options.graphView;
        this.canvas = options.canvas;

        this.mouse = options.mouse;

        this.parallaxController =
            options.parallaxController;

        this.interactionEffects =
            options.interactionEffects;

        this.cosmicObjects =
            options.cosmicObjects;

        this.getSettings = options.getSettings;
    }

    attach() {
        this.destroyed = false;

        this.graphView.addEventListener(
            "mousemove",
            this.handleMouseMove
        );

        this.graphView.addEventListener(
            "mouseleave",
            this.handleMouseLeave
        );

        this.graphView.addEventListener(
            "wheel",
            this.handleWheel,
            {
                passive: true
            }
        );

        this.graphView.addEventListener(
            "click",
            this.handleClick
        );
    }

    destroy() {
        this.destroyed = true;

        this.graphView.removeEventListener(
            "mousemove",
            this.handleMouseMove
        );

        this.graphView.removeEventListener(
            "mouseleave",
            this.handleMouseLeave
        );

        this.graphView.removeEventListener(
            "wheel",
            this.handleWheel
        );

        this.graphView.removeEventListener(
            "click",
            this.handleClick
        );
    }

    private handleMouseMove =
        (event: MouseEvent) => {
            if (this.destroyed) return;

            const rect =
                this.canvas.getBoundingClientRect();

            this.mouse.x =
                event.clientX - rect.left;

            this.mouse.y =
                event.clientY - rect.top;

            this.mouse.isInside = true;

            this.parallaxController.move(
                this.mouse.x,
                this.mouse.y
            );
        };

    private handleMouseLeave =
        () => {
            if (this.destroyed) return;

            this.mouse.isInside = false;

            this.parallaxController.leave();
        };

    private handleWheel =
        (event: WheelEvent) => {
            if (this.destroyed) return;

            this.cosmicObjects.handleWheel(
                event.deltaY
            );
        };

    private handleClick =
        (event: MouseEvent) => {
            if (this.destroyed) return;

            const settings =
                this.getSettings();

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

                settings.clickEffectMode,

                settings
            );
        };
}
