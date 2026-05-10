export type DebugHudMetrics = {
    fps: number;

    frameMs: number;
    updateMs: number;
    drawMs: number;

    particleDrawMs: number;
    connectionDrawMs: number;

    connectionGridMs: number;
    connectionScanMs: number;
    connectionStrokeMs: number;

    connectionSegments: number;
    connectionBuckets: number;
    connectionRenderPoints: number;

    particles: number;
    burstParticles: number;
    shootingStars: number;

    canvasWidth: number;
    canvasHeight: number;

    mouseInside: boolean;
    clickEffectMode: string;
};

export type DebugHudOptions = {
    showPerformance: boolean;
    showEntities: boolean;
    showCanvas: boolean;
    showMouse: boolean;
};

export function drawDebugHud(
    ctx: CanvasRenderingContext2D,
    metrics: DebugHudMetrics,
    options: DebugHudOptions
) {
    if (
        !options.showPerformance &&
        !options.showEntities &&
        !options.showCanvas &&
        !options.showMouse
    ) {
        return;
    }

    const lines: string[] = [];

    if (options.showPerformance) {
        lines.push(`FPS: ${metrics.fps}`);

        lines.push(
            `Frame: ${metrics.frameMs.toFixed(2)} ms`
        );

        lines.push(
            `Update: ${metrics.updateMs.toFixed(2)} ms`
        );

        lines.push(
            `Draw: ${metrics.drawMs.toFixed(2)} ms`
        );

        lines.push("");

        lines.push(
            `P.Draw: ${metrics.particleDrawMs.toFixed(2)} ms`
        );

        lines.push(
            `Conn: ${metrics.connectionDrawMs.toFixed(2)} ms`
        );

        lines.push(
            `C.Grid: ${metrics.connectionGridMs.toFixed(2)} ms`
        );

        lines.push(
            `C.Scan: ${metrics.connectionScanMs.toFixed(2)} ms`
        );

        lines.push(
            `C.Stroke: ${metrics.connectionStrokeMs.toFixed(2)} ms`
        );
    }

    if (options.showEntities) {
        lines.push("");

        lines.push(
            `Particles: ${metrics.particles}`
        );

        lines.push(
            `Burst: ${metrics.burstParticles}`
        );

        lines.push(
            `Shooting: ${metrics.shootingStars}`
        );

        lines.push("");

        lines.push(
            `C.Points: ${metrics.connectionRenderPoints}`
        );

        lines.push(
            `C.Segments: ${metrics.connectionSegments}`
        );

        lines.push(
            `C.Buckets: ${metrics.connectionBuckets}`
        );
    }

    if (options.showCanvas) {
        lines.push("");

        lines.push(
            `Canvas: ${metrics.canvasWidth}x${metrics.canvasHeight}`
        );
    }

    if (options.showMouse) {
        lines.push("");

        lines.push(
            `Mouse: ${
                metrics.mouseInside
                    ? "inside"
                    : "outside"
            }`
        );

        lines.push(
            `Click: ${metrics.clickEffectMode}`
        );
    }

    if (lines.length === 0) {
        return;
    }

    const x = 12;
    const y = 14;

    const lineHeight = 15;
    const padding = 9;

    const width = 205;

    const height =
        padding * 2 +
        lines.length * lineHeight;

    ctx.save();

    ctx.font = "12px monospace";
    ctx.textBaseline = "top";

    ctx.fillStyle =
        "rgba(3, 8, 20, 0.68)";

    ctx.strokeStyle =
        "rgba(130, 180, 255, 0.28)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        width,
        height,
        8
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
        "rgba(220, 235, 255, 0.88)";

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
            lines[i],
            x + padding,
            y + padding + i * lineHeight
        );
    }

    ctx.restore();
}