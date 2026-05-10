import { clamp } from "../util/math";
import { randomFloat, randomChance } from "../util/random";
import { CanvasLayer } from "./canvasLayer";
import type { Galaxy } from "../entitites/Galaxy";
import type { Planet } from "../entitites/Planet";

import {
    createRadialGlow,
    drawFilledCircle
} from "../util/canvas";

type MouseState = {
    x: number;
    y: number;
    radius: number;
};

type PositionedCosmicEntity = {
    x: number;
    y: number;
    depth: number;
};

export class CosmicObjects {
    private galaxies: Galaxy[] = [];
    private planets: Planet[] = [];
    
    private zoom = 1;
    private targetZoom = 1;

    create(
        width: number,
        height: number
    ) {
        this.galaxies = [];
        this.planets = [];

        this.createGalaxies(width, height);
        this.createPlanets(width, height);
    }

    handleWheel(deltaY: number) {
        const direction = deltaY < 0 ? 1 : -1;

        this.targetZoom = clamp(
            this.targetZoom + direction * 0.06,
            0.78,
            1.45
        );
    }

    update(delta: number) {
        this.zoom +=
            (this.targetZoom - this.zoom) * 0.08;

        for (const galaxy of this.galaxies) {
            galaxy.rotation +=
                galaxy.rotationSpeed *
                delta;
        }

        for (const planet of this.planets) {
            planet.rotation +=
                planet.rotationSpeed *
                delta;
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        for (const galaxy of this.galaxies) {
            this.drawGalaxy(
                ctx,
                galaxy,
                mouse,
                enableParallax
            );
        }

        for (const planet of this.planets) {
            this.drawPlanet(
                ctx,
                planet,
                time,
                mouse,
                enableParallax
            );
        }
    }

    applySettings(_settings: unknown) {
        // Planetas configurables más adelante.
    }

    private createGalaxies(
        width: number,
        height: number
    ) {
        const amount = Math.floor(
            randomFloat(2, 4)
        );

        for (let i = 0; i < amount; i++) {
            this.galaxies.push({
                x: randomFloat(
                    width * 0.1,
                    width * 0.9
                ),

                y: randomFloat(
                    height * 0.1,
                    height * 0.9
                ),

                radius: randomFloat(120, 210),

                hue: randomFloat(205, 275),

                alpha: randomFloat(0.09, 0.16),

                depth: randomFloat(0.06, 0.22),

                rotation: randomFloat(
                    0,
                    Math.PI * 2
                ),

                rotationSpeed: randomFloat(
                    -0.000035,
                    0.000035
                )
            });
        }
    }

    private createPlanets(
        width: number,
        height: number
    ) {
        const amount = Math.floor(
            randomFloat(2, 5)
        );

        for (let i = 0; i < amount; i++) {
            this.planets.push({
                x: randomFloat(
                    width * 0.12,
                    width * 0.88
                ),

                y: randomFloat(
                    height * 0.12,
                    height * 0.88
                ),

                radius: randomFloat(20, 42),

                hue: randomFloat(185, 295),

                alpha: randomFloat(0.34, 0.52),

                depth: randomFloat(0.24, 0.52),

                rotation: randomFloat(
                    0,
                    Math.PI * 2
                ),

                rotationSpeed: randomFloat(
                    -0.00008,
                    0.00008
                ),

                hasRing: randomChance(0.5)
            });
        }
    }

    private drawGalaxy(
        ctx: CanvasRenderingContext2D,
        galaxy: Galaxy,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const position =
            this.getRenderPosition(
                ctx,
                galaxy,
                mouse,
                enableParallax
            );

        const scale =
            this.getZoomScale(galaxy);

        const radius =
            galaxy.radius * scale;

        ctx.save();

        ctx.translate(
            position.x,
            position.y
        );

        ctx.rotate(galaxy.rotation);

        ctx.scale(1, 0.34);

        const gradient = createRadialGlow(
            ctx,
            0,
            0,
            radius,
            `hsla(${galaxy.hue}, 85%, 76%, ${galaxy.alpha})`,
            `hsla(${galaxy.hue}, 80%, 50%, 0)`,
            {
                colorStops: [
                    {
                        offset: 0,
                        color: `hsla(${galaxy.hue}, 85%, 76%, ${galaxy.alpha})`
                    },
                    {
                        offset: 0.28,
                        color: `hsla(${galaxy.hue + 18}, 78%, 62%, ${galaxy.alpha * 0.62})`
                    },
                    {
                        offset: 0.65,
                        color: `hsla(${galaxy.hue - 20}, 70%, 45%, ${galaxy.alpha * 0.22})`
                    },
                    {
                        offset: 1,
                        color: `hsla(${galaxy.hue}, 80%, 50%, 0)`
                    }
                ]
            }
        );

        drawFilledCircle(
            ctx,
            0,
            0,
            radius,
            gradient
        );

        ctx.restore();
    }

    private drawPlanet(
        ctx: CanvasRenderingContext2D,
        planet: Planet,
        time: number,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const position =
            this.getRenderPosition(
                ctx,
                planet,
                mouse,
                enableParallax
            );

        const scale =
            this.getZoomScale(planet);

        const radius =
            planet.radius * scale;

        const pulse =
            0.9 +
            Math.sin(
                time * 0.00045 +
                planet.radius
            ) * 0.1;

        ctx.save();

        ctx.translate(
            position.x,
            position.y
        );

        ctx.rotate(planet.rotation);

        if (planet.hasRing) {
            ctx.save();

            ctx.rotate(-0.4);

            ctx.beginPath();

            ctx.strokeStyle =
                `hsla(${planet.hue}, 58%, 76%, ${planet.alpha * 0.9})`;

            ctx.lineWidth = 1.2;

            ctx.ellipse(
                0,
                0,
                radius * 1.9,
                radius * 0.55,
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            ctx.restore();
        }

        const glow = createRadialGlow(
            ctx,
            0,
            0,
            radius * 3.4,
            `hsla(${planet.hue}, 82%, 72%, ${planet.alpha * 0.32 * pulse})`,
            `hsla(${planet.hue}, 80%, 70%, 0)`,
            {
                innerRadius: radius * 0.2
            }
        );

        drawFilledCircle(
            ctx,
            0,
            0,
            radius * 3.4,
            glow
        );

        const body = createRadialGlow(
            ctx,
            0,
            0,
            radius,
            `hsla(${planet.hue + 14}, 72%, 78%, ${planet.alpha})`,
            `hsla(${planet.hue - 24}, 62%, 24%, ${planet.alpha * 0.8})`,
            {
                innerX: -radius * 0.35,
                innerY: -radius * 0.35,
                innerRadius: radius * 0.1,
                colorStops: [
                    {
                        offset: 0,
                        color: `hsla(${planet.hue + 14}, 72%, 78%, ${planet.alpha})`
                    },
                    {
                        offset: 0.55,
                        color: `hsla(${planet.hue}, 64%, 50%, ${planet.alpha * 0.95})`
                    },
                    {
                        offset: 1,
                        color: `hsla(${planet.hue - 24}, 62%, 24%, ${planet.alpha * 0.8})`
                    }
                ]
            }
        );

        drawFilledCircle(
            ctx,
            0,
            0,
            radius,
            body
        );

        drawFilledCircle(
            ctx,
            radius * 0.28,
            radius * 0.12,
            radius * 0.95,
            `rgba(0, 0, 0, ${planet.alpha * 0.42})`
        );

        ctx.restore();
    }

    private getRenderPosition(
        ctx: CanvasRenderingContext2D,
        entity: PositionedCosmicEntity,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const centerX =
            ctx.canvas.clientWidth / 2;

        const centerY =
            ctx.canvas.clientHeight / 2;

        const zoomInfluence =
            0.18 + entity.depth * 0.65;

        const zoomedX =
            centerX +
            (entity.x - centerX) *
            (
                1 +
                (this.zoom - 1) *
                zoomInfluence
            );

        const zoomedY =
            centerY +
            (entity.y - centerY) *
            (
                1 +
                (this.zoom - 1) *
                zoomInfluence
            );

        if (
            !enableParallax ||
            mouse.x < 0 ||
            mouse.y < 0
        ) {
            return {
                x: zoomedX,
                y: zoomedY
            };
        }

        const offsetX =
            (mouse.x - centerX) / centerX;

        const offsetY =
            (mouse.y - centerY) / centerY;

        const parallaxStrength =
            32 * (1 - entity.depth);

        return {
            x: zoomedX - offsetX * parallaxStrength,
            y: zoomedY - offsetY * parallaxStrength
        };
    }

    private getZoomScale(
        entity: PositionedCosmicEntity
    ) {
        const zoomInfluence =
            0.22 + entity.depth * 0.55;

        return (
            1 +
            (this.zoom - 1) *
            zoomInfluence
        );
    }
}