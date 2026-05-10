export type ParallaxOffset = {
    x: number;
    y: number;
};

export function getParallaxOffset(
    mouseX: number,
    mouseY: number,
    width: number,
    height: number,
    strength: number
): ParallaxOffset {
    if (
        width <= 0 ||
        height <= 0
    ) {
        return { x: 0, y: 0 };
    }

    const centerX = width / 2;
    const centerY = height / 2;

    const offsetX =
        (mouseX - centerX) / centerX;

    const offsetY =
        (mouseY - centerY) / centerY;

    return {
        x: offsetX * strength,
        y: offsetY * strength
    };
}