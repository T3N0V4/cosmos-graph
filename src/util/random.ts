export function randomFloat(
    min: number,
    max: number
) {
    return min + Math.random() * (max - min);
}

export function randomInt(
    min: number,
    max: number
) {
    return Math.floor(
        randomFloat(min, max + 1)
    );
}

export function randomChance(
    chance: number
) {
    return Math.random() < chance;
}

export function randomChoice<T>(
    values: T[]
) {
    if (values.length === 0) {
        return null;
    }

    return values[
        Math.floor(
            Math.random() * values.length
        )
    ];
}