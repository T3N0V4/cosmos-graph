export type AmbientStarKind =
    | "ambient"
    | "deep";

export type AmbientStar = {
    x: number;
    y: number;

    size: number;
    density: number;
    hue: number;

    speedX: number;
    speedY: number;

    vx: number;
    vy: number;

    kind: AmbientStarKind;

    depth?: number;

    glow?: number;
    connectionAge?: number;
    connectionFadeDuration?: number;
};