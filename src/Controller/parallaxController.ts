import {
    getParallaxOffset,
    type ParallaxOffset
} from "../effects/parallaxEffect";

export type VisualMouseState = {
    x: number;
    y: number;
    radius: number;
    isInside: boolean;
};

export class ParallaxController {
    private width = 0;
    private height = 0;

    private currentX = 0;
    private currentY = 0;

    private targetX = 0;
    private targetY = 0;

    private radius = 130;
    private isInside = false;
    private initialized = false;

    setSize(
        width: number,
        height: number
    ) {
        this.width = width;
        this.height = height;

        if (
            !this.initialized &&
            width > 0 &&
            height > 0
        ) {
            this.currentX = width / 2;
            this.currentY = height / 2;

            this.targetX = width / 2;
            this.targetY = height / 2;

            this.initialized = true;
        }
    }

    setRadius(radius: number) {
        this.radius = radius;
    }

    move(
        x: number,
        y: number
    ) {
        this.isInside = true;

        this.targetX = x;
        this.targetY = y;
    }

    leave() {
        this.isInside = false;

        this.targetX = this.width / 2;
        this.targetY = this.height / 2;
    }

    update(delta: number) {
        const smoothing =
            1 - Math.pow(
                0.001,
                delta / 1000
            );

        this.currentX +=
            (this.targetX - this.currentX) *
            smoothing;

        this.currentY +=
            (this.targetY - this.currentY) *
            smoothing;
    }

    getMouse(): VisualMouseState {
        return {
            x: this.currentX,
            y: this.currentY,
            radius: this.radius,
            isInside: this.isInside
        };
    }

    getOffset(strength: number): ParallaxOffset {
        return getParallaxOffset(
            this.currentX,
            this.currentY,
            this.width,
            this.height,
            strength
        );
    }

    reset() {
        this.isInside = false;

        this.currentX = this.width / 2;
        this.currentY = this.height / 2;

        this.targetX = this.width / 2;
        this.targetY = this.height / 2;
    }
}
