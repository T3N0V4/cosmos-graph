// src/render/particleSystem.ts

import type { CosmosSettings } from "../settings/settings";

export type GalaxyParticle = {
    x: number;
    y: number;

    size: number;
    density: number;
    hue: number;

    speedX: number;
    speedY: number;

    vx: number;
    vy: number;

    kind: "ambient" | "burst" | "deep";

    depth?: number;

    life?: number;
    maxLife?: number;

    gravityX?: number;
    gravityY?: number;

    bounceCount?: number;
    maxBounces?: number;

    gravityTime?: number;
    maxGravityTime?: number;
    affectedByGravity?: boolean;

    glow?: number;
};

export type MouseState = {
    x: number;
    y: number;
    radius: number;
};

export class ParticleSystem {
    private particles: GalaxyParticle[] = [];
    private spawnTimer = 0;
    private clusterPoints: { x: number; y: number }[] = [];

    hasParticles() {
        return this.particles.length > 0;
    }

    applyVisualSettings(settings: CosmosSettings) {
    for (const particle of this.particles) {
        if (particle.kind !== "ambient") {
            continue;
        }

        particle.size = Math.max(
            settings.starMinSize,
            Math.min(
                settings.starMaxSize,
                particle.size
            )
        );

        particle.hue = Math.max(
            settings.starHueMin,
            Math.min(
                settings.starHueMax,
                particle.hue
            )
        );

        const currentSpeed =
            Math.sqrt(
                particle.speedX * particle.speedX +
                particle.speedY * particle.speedY
            );

        if (
            currentSpeed > 0 &&
            settings.baseSpeed > 0
        ) {
            const speedRatio =
                settings.baseSpeed / currentSpeed;

            particle.speedX *= speedRatio;
            particle.speedY *= speedRatio;
        }

        particle.glow = Math.max(
            particle.glow ?? 0,
            0.04
        );
    }
}

    addAmbientParticle(particle: GalaxyParticle) {
        this.particles.push({
            ...particle,
            kind: "ambient",
            depth: particle.depth ?? this.randomDepth(),
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

    createParticles(
        width: number,
        height: number,
        amount: number,
        settings: CosmosSettings
    ) {
        if (width <= 0 || height <= 0) return;

        this.particles = [];
        this.generateClusterPoints(width, height);

        for (let i = 0; i < amount; i++) {
            this.particles.push(
                this.createInitialUniverseParticle(width, height, settings)
            );
        }
    }

    update(
        width: number,
        height: number,
        mouse: MouseState,
        delta: number,
        settings: CosmosSettings
    ) {
        this.generateProgressively(width, height, delta, settings);

        for (const particle of this.particles) {
            const depth = particle.depth ?? 1;

            const depthMotion =
                particle.kind === "deep"
                    ? 0.08
                    : 0.35 + depth * 0.65;

            particle.speedX += this.random(-0.006, 0.006) * depthMotion;
            particle.speedY += this.random(-0.006, 0.006) * depthMotion;

            particle.speedX *= 0.992;
            particle.speedY *= 0.992;

            const mouseDx = mouse.x - particle.x;
            const mouseDy = mouse.y - particle.y;

            const mouseDistance = Math.sqrt(
                mouseDx * mouseDx + mouseDy * mouseDy
            );

            if (
                settings.enableMouseField &&
                particle.kind === "ambient" &&
                mouseDistance < settings.mouseFieldRadius
            ) {
                const force =
                    (settings.mouseFieldRadius - mouseDistance) /
                    settings.mouseFieldRadius;

                const angle = Math.atan2(mouseDy, mouseDx);

                const depthForce =
                    force *
                    settings.mouseRepulseStrength *
                    depthMotion;

                const targetX =
                    particle.x -
                    Math.cos(angle) *
                    depthForce;

                const targetY =
                    particle.y -
                    Math.sin(angle) *
                    depthForce;

                particle.vx += (targetX - particle.x) / particle.density;
                particle.vy += (targetY - particle.y) / particle.density;
            }

            particle.x +=
                (particle.speedX + particle.vx * 0.05) *
                depthMotion;

            particle.y +=
                (particle.speedY + particle.vy * 0.05) *
                depthMotion;

            particle.vx *= 0.95;
            particle.vy *= 0.95;

            if (particle.x < -50) particle.x = width + 50;
            if (particle.x > width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = height + 50;
            if (particle.y > height + 50) particle.y = -50;
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        settings: CosmosSettings
    ) {
        const parallax = this.getParallaxOffset(ctx, mouse, settings);

        if (settings.enableConnections) {
            this.drawConnections(ctx, mouse, settings, parallax);
        }

        this.drawParticles(ctx, time, mouse, settings, parallax);
    }

    limitParticles(maxParticles: number) {
        if (this.particles.length <= maxParticles) return;

        const excess = this.particles.length - maxParticles;
        let removed = 0;

        this.particles = this.particles.filter((particle) => {
            if (
                removed < excess &&
                particle.kind === "ambient"
            ) {
                removed++;
                return false;
            }

            return true;
        });

        if (this.particles.length > maxParticles) {
            this.particles.splice(
                0,
                this.particles.length - maxParticles
            );
        }
    }

    private generateProgressively(
        width: number,
        height: number,
        delta: number,
        settings: CosmosSettings
    ) {
        if (
            !settings.enableAutoSpawn ||
            this.particles.length >= settings.maxParticles
        ) {
            return;
        }

        this.spawnTimer += delta;

        if (this.spawnTimer < settings.autoSpawnIntervalMs) return;

        this.spawnTimer = 0;

        for (let i = 0; i < settings.autoSpawnAmount; i++) {
            const particle = this.createAmbientParticle(
                width,
                height,
                true,
                settings
            );

            particle.glow = 0.16;

            this.particles.push(particle);
        }
    }

    private createInitialUniverseParticle(
        width: number,
        height: number,
        settings: CosmosSettings
    ): GalaxyParticle {
        const centerX = width / 2;
        const centerY = height / 2;

        const safeMargin = 45;

        const cleanRadius =
            Math.min(width, height) *
            settings.initialCleanRadiusRatio;

        const minRadiusX =
            width *
            settings.initialMinRadiusRatio;

        const minRadiusY =
            height *
            settings.initialMinRadiusRatio;

        const maxRadiusX =
            width *
            settings.initialMaxRadiusRatio;

        const maxRadiusY =
            height *
            settings.initialMaxRadiusRatio;

        let x = centerX;
        let y = centerY;

        let attempts = 0;

        do {
            const angle = Math.random() * Math.PI * 2;

            let radiusFactor: number;

            const zone = Math.random();

            if (zone < 0.78) {
                radiusFactor = this.random(0.78, 1);
            } else if (zone < 0.94) {
                radiusFactor = this.random(0.58, 0.78);
            } else {
                radiusFactor = this.random(0.42, 0.58);
            }

            const clusterSnap =
                Math.random() <
                settings.initialClusterChance;

            const finalAngle = clusterSnap
                ? Math.round(angle * 4) / 4
                : angle;

            x =
                centerX +
                Math.cos(finalAngle) *
                this.random(minRadiusX, maxRadiusX) *
                radiusFactor;

            y =
                centerY +
                Math.sin(finalAngle) *
                this.random(minRadiusY, maxRadiusY) *
                radiusFactor;

            x += this.random(-28, 28);
            y += this.random(-28, 28);

            const useCluster =
                this.clusterPoints.length > 0 &&
                Math.random() < 0.35;

            if (useCluster) {
                const cluster =
                    this.clusterPoints[
                        Math.floor(
                            Math.random() *
                            this.clusterPoints.length
                        )
                    ];

                x += (cluster.x - x) * this.random(0.18, 0.42);
                y += (cluster.y - y) * this.random(0.18, 0.42);
            }

            attempts++;
        } while (
            attempts < 40 &&
            (
                x < safeMargin ||
                x > width - safeMargin ||
                y < safeMargin ||
                y > height - safeMargin ||
                this.distance(x, y, centerX, centerY) < cleanRadius
            )
        );

        x = Math.max(safeMargin, Math.min(width - safeMargin, x));
        y = Math.max(safeMargin, Math.min(height - safeMargin, y));

        const isDeep = this.shouldCreateDeepParticle();

        return {
            x,
            y,

            depth: isDeep
                ? this.random(0.25, 0.45)
                : this.randomDepth(),

            size: isDeep
                ? this.random(
                    settings.starMinSize * 0.35,
                    settings.starMinSize * 0.75
                )
                : this.random(
                    settings.starMinSize,
                    settings.starMaxSize
                ),

            density: isDeep
                ? this.random(38, 70)
                : this.random(10, 36),

            hue: isDeep
                ? this.random(205, 245)
                : this.random(
                    settings.starHueMin,
                    settings.starHueMax
                ),

            speedX: isDeep
                ? this.random(
                    -settings.baseSpeed * 0.15,
                    settings.baseSpeed * 0.15
                )
                : this.random(
                    -settings.baseSpeed,
                    settings.baseSpeed
                ),

            speedY: isDeep
                ? this.random(
                    -settings.baseSpeed * 0.15,
                    settings.baseSpeed * 0.15
                )
                : this.random(
                    -settings.baseSpeed,
                    settings.baseSpeed
                ),

            vx: 0,
            vy: 0,

            kind: isDeep ? "deep" : "ambient",

            glow: 0
        };
    }

    private createAmbientParticle(
        width: number,
        height: number,
        preferPeriphery: boolean,
        settings: CosmosSettings
    ): GalaxyParticle {
        let x = Math.random() * width;
        let y = Math.random() * height;

        if (preferPeriphery) {
            const centerX = width / 2;
            const centerY = height / 2;

            const cleanRadius =
                Math.min(width, height) *
                settings.initialCleanRadiusRatio;

            const minRadiusX =
                width *
                settings.initialMinRadiusRatio;

            const minRadiusY =
                height *
                settings.initialMinRadiusRatio;

            const maxRadiusX =
                width *
                settings.initialMaxRadiusRatio;

            const maxRadiusY =
                height *
                settings.initialMaxRadiusRatio;

            let attempts = 0;

            do {
                const angle = Math.random() * Math.PI * 2;

                x =
                    centerX +
                    Math.cos(angle) *
                    this.random(minRadiusX, maxRadiusX);

                y =
                    centerY +
                    Math.sin(angle) *
                    this.random(minRadiusY, maxRadiusY);

                const useCluster =
                    this.clusterPoints.length > 0 &&
                    Math.random() < 0.25;

                if (useCluster) {
                    const cluster =
                        this.clusterPoints[
                            Math.floor(
                                Math.random() *
                                this.clusterPoints.length
                            )
                        ];

                    x += (cluster.x - x) * this.random(0.14, 0.32);
                    y += (cluster.y - y) * this.random(0.14, 0.32);
                }

                attempts++;
            } while (
                attempts < 30 &&
                this.distance(x, y, centerX, centerY) < cleanRadius
            );
        }

        return {
            x,
            y,

            depth: this.randomDepth(),

            size: this.random(settings.starMinSize, settings.starMaxSize),

            density: this.random(8, 32),

            hue: this.random(settings.starHueMin, settings.starHueMax),

            speedX: this.random(-settings.baseSpeed, settings.baseSpeed),
            speedY: this.random(-settings.baseSpeed, settings.baseSpeed),

            vx: 0,
            vy: 0,

            kind: "ambient",

            glow: 0
        };
    }

    private drawParticles(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        settings: CosmosSettings,
        parallax: { x: number; y: number }
    ) {
        for (const particle of this.particles) {
            const renderPosition = this.getRenderPosition(particle, parallax);

            const depth = particle.depth ?? 1;
            const isDeep = particle.kind === "deep";

            const depthSize = isDeep
                ? 0.22 + depth * 0.18
                : 0.45 + depth * 0.75;

            const depthAlpha = isDeep
                ? 0.12 + depth * 0.18
                : 0.32 + depth * 0.68;

            const mouseGlow = this.getMouseGlow(
                particle,
                mouse,
                settings,
                parallax
            );

            let alpha =
                (
                    0.24 +
                    Math.sin(time * 0.001 + particle.density) *
                    0.1
                ) *
                depthAlpha;

            if (isDeep) alpha *= 0.7;

            alpha +=
                mouseGlow *
                settings.mouseGlowParticleAlpha *
                depthAlpha;

            const size =
                particle.size *
                depthSize +
                mouseGlow *
                settings.mouseGlowParticleSize *
                depthSize +
                (particle.glow ?? 0) *
                0.8 *
                depthSize;

            let saturation = 82;
            let lightness = 72;

            let glowSaturation = 90;
            let glowLightness = 76;
            let glowMultiplier = 1;

            if (isDeep) {
                saturation = 28;
                lightness = 54;

                glowSaturation = 25;
                glowLightness = 52;
                glowMultiplier = 0.12;
            } else if (depth < 0.55) {
                saturation = 42;
                lightness = 62;

                glowSaturation = 38;
                glowLightness = 58;
                glowMultiplier = 0.35;
            } else if (depth < 0.8) {
                saturation = 68;
                lightness = 68;

                glowSaturation = 65;
                glowLightness = 68;
                glowMultiplier = 0.65;
            } else {
                saturation = 92;
                lightness = 78;

                glowSaturation = 96;
                glowLightness = 80;
                glowMultiplier = 1;
            }

            if (
                !isDeep &&
                (
                    mouseGlow > 0.05 ||
                    (particle.glow ?? 0) > 0.01
                )
            ) {
                const gradient = ctx.createRadialGradient(
                    renderPosition.x,
                    renderPosition.y,
                    0,
                    renderPosition.x,
                    renderPosition.y,
                    size * 4.2
                );

                gradient.addColorStop(
                    0,
                    `hsla(${particle.hue}, ${glowSaturation}%, ${glowLightness}%, ${
                        (
                            0.06 +
                            mouseGlow * 0.12 +
                            (particle.glow ?? 0) * 0.13
                        ) *
                        depthAlpha *
                        glowMultiplier
                    })`
                );

                gradient.addColorStop(
                    1,
                    `hsla(${particle.hue}, ${glowSaturation}%, ${glowLightness}%, 0)`
                );

                ctx.beginPath();
                ctx.fillStyle = gradient;

                ctx.arc(
                    renderPosition.x,
                    renderPosition.y,
                    size * 4.2,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.beginPath();

            ctx.fillStyle =
                `hsla(${particle.hue}, ${saturation}%, ${lightness}%, ${alpha})`;

            ctx.arc(
                renderPosition.x,
                renderPosition.y,
                size,
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (
                particle.glow !== undefined &&
                particle.glow > 0
            ) {
                particle.glow -= 0.002;

                if (particle.glow < 0) particle.glow = 0;
            }
        }
    }

    private drawConnections(
        ctx: CanvasRenderingContext2D,
        mouse: MouseState,
        settings: CosmosSettings,
        parallax: { x: number; y: number }
    ) {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const a = this.particles[i];
                const b = this.particles[j];

                if (a.kind === "deep" || b.kind === "deep") continue;

                const depthA = a.depth ?? 1;
                const depthB = b.depth ?? 1;

                const depthDifference = Math.abs(depthA - depthB);

                if (depthDifference > 0.42) continue;

                const depthAverage = (depthA + depthB) / 2;

                const renderA = this.getRenderPosition(a, parallax);
                const renderB = this.getRenderPosition(b, parallax);

                const dx = renderA.x - renderB.x;
                const dy = renderA.y - renderB.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                const depthConnectionDistance =
                    settings.connectionDistance *
                    (0.65 + depthAverage * 0.35);

                if (distance < depthConnectionDistance) {
                    const opacity =
                        1 -
                        distance /
                        depthConnectionDistance;

                    const midX = (renderA.x + renderB.x) / 2;
                    const midY = (renderA.y + renderB.y) / 2;

                    const mouseDx = mouse.x - midX;
                    const mouseDy = mouse.y - midY;

                    const mouseDistance = Math.sqrt(
                        mouseDx * mouseDx +
                        mouseDy * mouseDy
                    );

                    let mouseGlow = 0;

                    if (
                        settings.enableMouseGlow &&
                        mouse.x >= 0 &&
                        mouseDistance < settings.mouseGlowRadius
                    ) {
                        mouseGlow =
                            1 -
                            mouseDistance /
                            settings.mouseGlowRadius;
                    }

                    const depthOpacity =
                        0.25 + depthAverage * 0.75;

                    const finalOpacity =
                        opacity *
                        (
                            settings.connectionBaseOpacity +
                            mouseGlow *
                            settings.mouseGlowConnectionOpacity
                        ) *
                        depthOpacity;

                    ctx.strokeStyle =
                        `rgba(${settings.connectionColor}, ${finalOpacity})`;

                    ctx.lineWidth =
                        (
                            settings.connectionLineWidth +
                            mouseGlow *
                            settings.mouseGlowLineWidth
                        ) *
                        (0.45 + depthAverage * 0.55);

                    ctx.beginPath();
                    ctx.moveTo(renderA.x, renderA.y);
                    ctx.lineTo(renderB.x, renderB.y);
                    ctx.stroke();
                }
            }
        }
    }

    private getMouseGlow(
        particle: GalaxyParticle,
        mouse: MouseState,
        settings: CosmosSettings,
        parallax: { x: number; y: number }
    ) {
        if (
            !settings.enableMouseGlow ||
            mouse.x < 0 ||
            mouse.y < 0
        ) {
            return 0;
        }

        if (particle.kind === "deep") return 0;

        const depth = particle.depth ?? 1;

        const renderPosition = this.getRenderPosition(particle, parallax);

        const dx = mouse.x - renderPosition.x;
        const dy = mouse.y - renderPosition.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > settings.mouseGlowRadius) return 0;

        const glow =
            1 -
            distance /
            settings.mouseGlowRadius;

        return glow * glow * (0.35 + depth * 0.65);
    }

    private getParallaxOffset(
        ctx: CanvasRenderingContext2D,
        mouse: MouseState,
        settings: CosmosSettings
    ) {
        if (
            !settings.enableParallax ||
            mouse.x < 0 ||
            mouse.y < 0
        ) {
            return { x: 0, y: 0 };
        }

        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;

        if (centerX <= 0 || centerY <= 0) {
            return { x: 0, y: 0 };
        }

        const offsetX = (mouse.x - centerX) / centerX;
        const offsetY = (mouse.y - centerY) / centerY;

        const maxOffset = 30;

        return {
            x: offsetX * maxOffset,
            y: offsetY * maxOffset
        };
    }

    private getRenderPosition(
        particle: GalaxyParticle,
        parallax: { x: number; y: number }
    ) {
        const depth = particle.depth ?? 1;

        const parallaxStrength =
            particle.kind === "deep"
                ? 1.35
                : 1 - depth;

        return {
            x: particle.x - parallax.x * parallaxStrength,
            y: particle.y - parallax.y * parallaxStrength
        };
    }

    private generateClusterPoints(
        width: number,
        height: number
    ) {
        this.clusterPoints = [];

        const clusterCount = Math.floor(
            this.random(4, 8)
        );

        for (let i = 0; i < clusterCount; i++) {
            this.clusterPoints.push({
                x: this.random(
                    width * 0.12,
                    width * 0.88
                ),

                y: this.random(
                    height * 0.12,
                    height * 0.88
                )
            });
        }
    }

    private randomDepth() {
        const roll = Math.random();

        if (roll < 0.55) {
            return this.random(0.35, 0.55);
        }

        if (roll < 0.85) {
            return this.random(0.55, 0.8);
        }

        return this.random(0.8, 1);
    }

    private shouldCreateDeepParticle() {
        return Math.random() < 0.45;
    }

    private distance(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) {
        const dx = x1 - x2;
        const dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    private random(
        min: number,
        max: number
    ) {
        return min + Math.random() * (max - min);
    }
}