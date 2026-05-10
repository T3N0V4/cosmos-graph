export type BurstCooldownHudMouse = {
    x: number;
    y: number;
    isInside: boolean;
};

export function drawBurstCooldownHud(
    ctx: CanvasRenderingContext2D,
    mouse: BurstCooldownHudMouse,
    clickEffectMode: string,
    cooldownProgress: number,
    ready: boolean
) {
    if (
        clickEffectMode === "none" ||
        !mouse.isInside
    ) {
        return;
    }

    const x = mouse.x + 14;
    const y = mouse.y + 18;

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
            Math.PI *
                2 *
                cooldownProgress
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