export const COSMOS_CANVAS_CLASS =
    "cosmos-graph-canvas";

export const LEGACY_CANVAS_CLASS =
    "cosmos-animation-canvas";

export class CanvasLayer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    attach(
        graphView: HTMLElement
    ) {
        this.removeLegacyCanvas(graphView);

        let canvas =
            graphView.querySelector(
                `.${COSMOS_CANVAS_CLASS}`
            ) as HTMLCanvasElement | null;

        if (!canvas) {
            canvas =
                document.createElement(
                    "canvas"
                );

            canvas.className =
                COSMOS_CANVAS_CLASS;

            graphView.appendChild(canvas);
        }

        this.applyCanvasStyles(canvas);

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            return false;
        }

        this.canvas = canvas;
        this.ctx = ctx;

        return true;
    }

    resize(
        graphView: HTMLElement
    ) {
        if (
            !this.canvas ||
            !this.ctx
        ) {
            return false;
        }

        const rect =
            graphView.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return false;
        }

        const dpr =
            window.devicePixelRatio || 1;

        this.canvas.width =
            Math.floor(rect.width * dpr);

        this.canvas.height =
            Math.floor(rect.height * dpr);

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

        return true;
    }

    clear() {
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
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    isConnected() {
        return this.canvas?.isConnected ?? false;
    }

    getWidth() {
        return this.canvas?.clientWidth ?? 0;
    }

    getHeight() {
        return this.canvas?.clientHeight ?? 0;
    }

    destroy() {
        this.canvas?.remove();

        this.canvas = null;
        this.ctx = null;
    }

    static cleanupAll() {
        document
            .querySelectorAll(
                [
                    `.${COSMOS_CANVAS_CLASS}`,
                    `.${LEGACY_CANVAS_CLASS}`
                ].join(", ")
            )
            .forEach((element) => {
                element.remove();
            });
    }

    private applyCanvasStyles(
        canvas: HTMLCanvasElement
    ) {
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
            "2";

        canvas.style.opacity =
            "1";

        canvas.style.mixBlendMode =
            "screen";

        canvas.style.overflow =
            "hidden";
    }

    private removeLegacyCanvas(
        graphView: HTMLElement
    ) {
        graphView
            .querySelectorAll(
                `.${LEGACY_CANVAS_CLASS}`
            )
            .forEach((element) => {
                element.remove();
            });
    }
}