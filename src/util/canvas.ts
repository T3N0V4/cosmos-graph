export type RadialGlowColorStop = {
    offset: number;
    color: string;
};

export type RadialGlowOptions = {
    innerX?: number;
    innerY?: number;
    innerRadius?: number;

    outerX?: number;
    outerY?: number;

    colorStops?: RadialGlowColorStop[];
};

export function createRadialGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    innerColor: string,
    outerColor: string,
    options?: RadialGlowOptions
) {
    const innerX = options?.innerX ?? x;
    const innerY = options?.innerY ?? y;
    const innerRadius = options?.innerRadius ?? 0;

    const outerX = options?.outerX ?? x;
    const outerY = options?.outerY ?? y;

    const gradient = ctx.createRadialGradient(
        innerX,
        innerY,
        innerRadius,
        outerX,
        outerY,
        radius
    );

    if (options?.colorStops !== undefined) {
        for (const stop of options.colorStops) {
            gradient.addColorStop(
                stop.offset,
                stop.color
            );
        }

        return gradient;
    }

    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(1, outerColor);

    return gradient;
}

export function createLinearFade(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startColor: string,
    endColor: string
) {
    const gradient = ctx.createLinearGradient(
        startX,
        startY,
        endX,
        endY
    );

    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);

    return gradient;
}

export function drawFilledCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillStyle: string | CanvasGradient
) {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}