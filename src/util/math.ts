export function lerp(
    current: number,
    target: number,
    speed: number
) {
    return current + (target - current) * speed;
}

export function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

export function distance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(
        dx * dx + dy * dy
    );
}

export function normalize(
    value: number,
    min: number,
    max: number
) {
    if (max === min) {
        return 0;
    }

    return (value - min) / (max - min);
}