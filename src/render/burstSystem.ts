import {
    GalaxyParticle,
    MouseState,
    ParticleSystem
} from "./particleSystem";

export class BurstSystem {
    private particles: GalaxyParticle[] = [];

    constructor(
        private particleSystem: ParticleSystem
    ) {}

    createRadialBurst(x: number, y: number) {
        const burstAmount = 34;

        for (let i = 0; i < burstAmount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.random(45, 115);

            this.particles.push({
                x: x + Math.cos(angle) * this.random(2, 6),
                y: y + Math.sin(angle) * this.random(2, 6),

                size: this.random(0.6, 1.8),
                density: this.random(6, 18),
                hue: this.random(200, 265),

                speedX: Math.cos(angle) * this.random(0.6, 1.8),
                speedY: Math.sin(angle) * this.random(0.6, 1.8),

                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,

                kind: "burst",

                life: this.random(2800, 3800),
                maxLife: 3800,

                glow: 0.55
            });
        }

        const coreAmount = 8;

        for (let i = 0; i < coreAmount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.random(10, 32);

            this.particles.push({
                x: x + Math.cos(angle) * this.random(3, 12),
                y: y + Math.sin(angle) * this.random(3, 12),

                size: this.random(0.9, 2.1),
                density: this.random(5, 12),
                hue: this.random(205, 255),

                speedX: Math.cos(angle) * this.random(0.1, 0.5),
                speedY: Math.sin(angle) * this.random(0.1, 0.5),

                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,

                kind: "burst",

                life: this.random(2400, 3400),
                maxLife: 3400,

                glow: 0.5
            });
        }
    }

    createDirectionalBurst(
        x: number,
        y: number,
        baseAngle: number
    ) {
        const burstAmount = 26;

        for (let i = 0; i < burstAmount; i++) {
            const angle = baseAngle + this.random(-0.14, 0.14);
            const speed = this.random(65, 135);

            this.particles.push({
                x,
                y,

                size: this.random(0.6, 1.9),
                density: this.random(6, 18),
                hue: this.random(200, 265),

                speedX: Math.cos(angle) * this.random(1.1, 2.8),
                speedY: Math.sin(angle) * this.random(1.1, 2.8),

                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,

                kind: "burst",

                life: this.random(2200, 3200),
                maxLife: 3200,

                glow: 0.55
            });
        }
    }

    createGravityBurst(x: number, y: number) {
        const burstAmount = 22;

        for (let i = 0; i < burstAmount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.random(35, 85);

            this.particles.push({
                x,
                y,

                size: this.random(0.6, 1.8),
                density: this.random(6, 18),
                hue: this.random(200, 265),

                speedX: Math.cos(angle) * this.random(0.8, 2.2),
                speedY: Math.sin(angle) * this.random(0.8, 2.2),

                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,

                kind: "burst",

                gravityX: x,
                gravityY: y,
                bounceCount: 0,
                maxBounces: 2,
                gravityTime: 3600,
                maxGravityTime: 3600,
                affectedByGravity: true,

                glow: 0.6
            });
        }
    }

    update(
        width: number,
        height: number,
        delta: number
    ) {
        const finishedParticles: GalaxyParticle[] = [];

        for (const particle of this.particles) {
            if (
                particle.affectedByGravity &&
                particle.gravityX !== undefined &&
                particle.gravityY !== undefined &&
                particle.gravityTime !== undefined
            ) {
                this.updateGravityParticle(particle, delta);

                if (particle.gravityTime <= 0) {
                    finishedParticles.push(particle);
                }
            } else if (particle.life !== undefined) {
                particle.life -= delta;

                if (particle.life <= 0) {
                    finishedParticles.push(particle);
                }
            }

            particle.x += particle.speedX + particle.vx * 0.05;
            particle.y += particle.speedY + particle.vy * 0.05;

            particle.vx *= 0.95;
            particle.vy *= 0.95;

            particle.speedX *= 0.992;
            particle.speedY *= 0.992;

            if (particle.glow !== undefined && particle.glow > 0) {
                particle.glow -= delta * 0.00016;

                if (particle.glow < 0) {
                    particle.glow = 0;
                }
            }

            if (particle.x < -50) particle.x = width + 50;
            if (particle.x > width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = height + 50;
            if (particle.y > height + 50) particle.y = -50;
        }

        this.particles = this.particles.filter((particle) => {
            const normalAlive =
                particle.life === undefined || particle.life > 0;

            const gravityAlive =
                particle.gravityTime === undefined || particle.gravityTime > 0;

            return normalAlive && gravityAlive;
        });

        for (const particle of finishedParticles) {
            this.particleSystem.addAmbientParticle({
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
                glow: 0
            });
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        mouse?: MouseState
    ) {
        for (const particle of this.particles) {
            const fade = this.getParticleFade(particle);

            const alpha =
                0.04 + fade * 0.5;

            const size =
                particle.size +
                (particle.glow ?? 0) * 0.8;

            if ((particle.glow ?? 0) > 0.03) {
                const gradient = ctx.createRadialGradient(
                    particle.x,
                    particle.y,
                    0,
                    particle.x,
                    particle.y,
                    size * 4.2
                );

                gradient.addColorStop(
                    0,
                    `hsla(${particle.hue}, 85%, 72%, ${(particle.glow ?? 0) * 0.18})`
                );

                gradient.addColorStop(
                    1,
                    `hsla(${particle.hue}, 85%, 72%, 0)`
                );

                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(
                    particle.x,
                    particle.y,
                    size * 4.2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            ctx.beginPath();

            ctx.fillStyle =
                `hsla(${particle.hue}, 80%, 72%, ${alpha})`;

            ctx.arc(
                particle.x,
                particle.y,
                size,
                0,
                Math.PI * 2
            );

            ctx.fill();
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

    private updateGravityParticle(
        particle: GalaxyParticle,
        delta: number
    ) {
        particle.gravityTime! -= delta;

        const dx = particle.gravityX! - particle.x;
        const dy = particle.gravityY! - particle.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const gravityForce = 90 / Math.max(distance, 100);

            particle.vx += Math.cos(angle) * gravityForce;
            particle.vy += Math.sin(angle) * gravityForce;
        }

        if (distance < 14) {
            const outwardAngle = Math.atan2(
                particle.y - particle.gravityY!,
                particle.x - particle.gravityX!
            );

            particle.vx =
                Math.cos(outwardAngle) * this.random(45, 75);

            particle.vy =
                Math.sin(outwardAngle) * this.random(45, 75);

            particle.bounceCount =
                (particle.bounceCount ?? 0) + 1;
        }
    }

    private getParticleFade(particle: GalaxyParticle) {
        if (
            particle.affectedByGravity &&
            particle.gravityTime !== undefined &&
            particle.maxGravityTime !== undefined
        ) {
            const ratio =
                Math.max(particle.gravityTime / particle.maxGravityTime, 0);

            return ratio * ratio * (3 - 2 * ratio);
        }

        if (
            particle.life !== undefined &&
            particle.maxLife !== undefined
        ) {
            const ratio =
                Math.max(particle.life / particle.maxLife, 0);

            return ratio * ratio * (3 - 2 * ratio);
        }

        return 1;
    }

    private random(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}