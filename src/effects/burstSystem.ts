import {
    GalaxyParticle,
    MouseState,
    ParticleSystem
} from "../render/particleSystem";
import type { CosmosSettings } from "../settings/settings";

import {
    randomFloat
} from "../util/random";

import {
    createRadialGlow,
    drawFilledCircle
} from "../util/canvas";

type BurstParticle = GalaxyParticle & {
    age: number;
    releaseAfter: number;
    burstGravityForce?: number;
    collapseDistance?: number;
};

export class BurstSystem {
    private particles: BurstParticle[] = [];

    constructor(
        private particleSystem: ParticleSystem
    ) {}

    createRadialBurst(
        x: number,
        y: number,
        settings: CosmosSettings
    ) {
        for (
            let i = 0;
            i < settings.radialBurstAmount;
            i++
        ) {
            const angle = randomFloat(
                0,
                Math.PI * 2
            );

            this.particles.push(
                this.createBurstStar(
                    x,
                    y,
                    angle,
                    randomFloat(38, 105),
                    randomFloat(1800, 5200)
                )
            );
        }

        for (
            let i = 0;
            i < settings.radialCoreAmount;
            i++
        ) {
            const angle = randomFloat(
                0,
                Math.PI * 2
            );

            this.particles.push(
                this.createBurstStar(
                    x,
                    y,
                    angle,
                    randomFloat(8, 34),
                    randomFloat(1400, 3600)
                )
            );
        }
    }
    getParticleCount() {
    return this.particles.length;
    }
    
    createDirectionalBurst(
        x: number,
        y: number,
        baseAngle: number,
        settings: CosmosSettings
    ) {
        for (
            let i = 0;
            i < settings.directionalBurstAmount;
            i++
        ) {
            const angle =
                baseAngle +
                randomFloat(
                    -settings.directionalSpread,
                    settings.directionalSpread
                );

            this.particles.push(
                this.createBurstStar(
                    x,
                    y,
                    angle,
                    randomFloat(45, 115),
                    randomFloat(1800, 5200)
                )
            );
        }
    }

    createGravityBurst(
        x: number,
        y: number,
        settings: CosmosSettings
    ) {
        for (
            let i = 0;
            i < settings.gravityBurstAmount;
            i++
        ) {
            const angle = randomFloat(
                0,
                Math.PI * 2
            );

            const spawnDistance =
                randomFloat(
                    settings.gravityBounceDistance,
                    settings.gravityBounceDistance * 2.4
                );

            const particle =
                this.createBurstStar(
                    x + Math.cos(angle) * spawnDistance,
                    y + Math.sin(angle) * spawnDistance,
                    angle,
                    settings.gravityForce,
                    settings.gravityDurationMs
                );

            particle.gravityX = x;
            particle.gravityY = y;
            particle.affectedByGravity = true;
            particle.burstGravityForce =
                settings.gravityForce;
            particle.collapseDistance =
                settings.gravityBounceDistance;

            this.particles.push(particle);
        }
    }
    

    update(
        width: number,
        height: number,
        delta: number,
        maxAmbientParticles: number
    ) {
        const releasedParticles: BurstParticle[] = [];

        for (const particle of this.particles) {
            particle.age += delta;

            if (
                particle.affectedByGravity &&
                particle.gravityX !== undefined &&
                particle.gravityY !== undefined
            ) {
                this.updateGravityParticle(particle);
            }

            particle.x +=
                particle.speedX +
                particle.vx * 0.05;

            particle.y +=
                particle.speedY +
                particle.vy * 0.05;

            particle.vx *= 0.95;
            particle.vy *= 0.95;

            particle.speedX *= 0.992;
            particle.speedY *= 0.992;

            if (particle.x < -50) particle.x = width + 50;
            if (particle.x > width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = height + 50;
            if (particle.y > height + 50) particle.y = -50;

            if (particle.age >= particle.releaseAfter) {
                releasedParticles.push(particle);
            }
        }

        this.particles =
            this.particles.filter(
                (particle) =>
                    particle.age < particle.releaseAfter
            );

        for (const particle of releasedParticles) {
            this.particleSystem.addAmbientParticle(
                {
                    ...particle,

                    kind: "ambient",

                    life: undefined,
                    maxLife: undefined,

                    gravityX: undefined,
                    gravityY: undefined,

                    bounceCount: undefined,
                    maxBounces: undefined,

                    gravityTime: undefined,
                    maxGravityTime: undefined,

                    affectedByGravity: undefined,

                    connectionAge: 0,
                    connectionFadeDuration: 200,

                    glow: 0.2
                } as GalaxyParticle
            );
        }

        this.limitParticles(maxAmbientParticles);
    }

    draw(
        ctx: CanvasRenderingContext2D,
        _mouse: MouseState | undefined,
        settings: CosmosSettings
    ) {
        for (const particle of this.particles) {
            const alpha = 0.86;

            const size =
                particle.size +
                (particle.glow ?? 0) * 0.8;

            const glow =
                createRadialGlow(
                    ctx,
                    particle.x,
                    particle.y,
                    size * settings.burstGlowSize,
                    `hsla(${particle.hue}, 90%, 76%, ${
                        (particle.glow ?? 0.45) *
                        settings.burstGlowIntensity
                    })`,
                    `hsla(${particle.hue}, 90%, 76%, 0)`
                );

            drawFilledCircle(
                ctx,
                particle.x,
                particle.y,
                size * settings.burstGlowSize,
                glow
            );

            drawFilledCircle(
                ctx,
                particle.x,
                particle.y,
                size,
                `hsla(${particle.hue}, 90%, 76%, ${alpha})`
            );
        }
    }

    limitParticles(maxParticles: number) {
        if (this.particles.length <= maxParticles) {
            return;
        }

        this.particles.splice(
            0,
            this.particles.length - maxParticles
        );
    }

    clear() {
        this.particles = [];
    }

    private createBurstStar(
        x: number,
        y: number,
        angle: number,
        force: number,
        releaseAfter: number
    ): BurstParticle {
        return {
            x,
            y,

            size: randomFloat(0.7, 1.9),
            density: randomFloat(6, 18),
            hue: randomFloat(200, 265),

            speedX:
                Math.cos(angle) *
                randomFloat(0.7, 1.8),

            speedY:
                Math.sin(angle) *
                randomFloat(0.7, 1.8),

            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,

            kind: "burst",

            depth: randomFloat(0.55, 1),

            age: 0,
            releaseAfter,

            glow: 0.55
        };
    }

    private updateGravityParticle(
        particle: BurstParticle
    ) {
        const dx =
            particle.gravityX! - particle.x;

        const dy =
            particle.gravityY! - particle.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance <= 0) {
            return;
        }

        const angle =
            Math.atan2(dy, dx);

        const gravityForce =
            (particle.burstGravityForce ?? 90) /
            Math.max(
                distance,
                particle.collapseDistance ?? 14
            );

        particle.vx +=
            Math.cos(angle) * gravityForce;

        particle.vy +=
            Math.sin(angle) * gravityForce;
    }
}
