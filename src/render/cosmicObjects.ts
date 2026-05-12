export type CosmicObjectKind =
    | "planet"
    | "galaxy";

type CosmicObject = {
    kind: CosmicObjectKind;

    x: number;
    y: number;

    radius: number;
    hue: number;
    alpha: number;

    depth: number;

    rotation: number;
    rotationSpeed: number;

    hasRing?: boolean;
};

type MouseState = {
    x: number;
    y: number;
    radius: number;
};

export class CosmicObjects {
    private objects: CosmicObject[] = [];

    private zoom = 1;
    private targetZoom = 1;

    create(
        width: number,
        height: number
    ) {
        this.objects = [];

        this.createGalaxies(width, height);
        this.createPlanets(width, height);
    }

    handleWheel(deltaY: number) {
        const direction = deltaY < 0 ? 1 : -1;

        this.targetZoom = this.clamp(
            this.targetZoom + direction * 0.06,
            0.78,
            1.45
        );
    }

    update(delta: number) {
        this.zoom +=
            (this.targetZoom - this.zoom) * 0.08;

        for (const object of this.objects) {
            object.rotation +=
                object.rotationSpeed *
                delta;
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        for (const object of this.objects) {
            if (object.kind === "galaxy") {
                this.drawGalaxy(
                    ctx,
                    object,
                    mouse,
                    enableParallax
                );
            }
        }

        for (const object of this.objects) {
            if (object.kind === "planet") {
                this.drawPlanet(
                    ctx,
                    object,
                    time,
                    mouse,
                    enableParallax
                );
            }
        }
    }

    private createGalaxies(
        width: number,
        height: number
    ) {
        const amount = Math.floor(
            this.random(2, 4)
        );

        for (let i = 0; i < amount; i++) {
            this.objects.push({
                kind: "galaxy",

                x: this.random(
                    width * 0.1,
                    width * 0.9
                ),

                y: this.random(
                    height * 0.1,
                    height * 0.9
                ),

                radius: this.random(120, 210),

                hue: this.random(205, 275),

                alpha: this.random(0.09, 0.16),

                depth: this.random(0.06, 0.22),

                rotation: this.random(
                    0,
                    Math.PI * 2
                ),

                rotationSpeed: this.random(
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
            this.random(2, 5)
        );

        for (let i = 0; i < amount; i++) {
            this.objects.push({
                kind: "planet",

                x: this.random(
                    width * 0.12,
                    width * 0.88
                ),

                y: this.random(
                    height * 0.12,
                    height * 0.88
                ),

                radius: this.random(20, 42),

                hue: this.random(185, 295),

                alpha: this.random(0.34, 0.52),

                depth: this.random(0.24, 0.52),

                rotation: this.random(
                    0,
                    Math.PI * 2
                ),

                rotationSpeed: this.random(
                    -0.00008,
                    0.00008
                ),

                hasRing: Math.random() < 0.5
            });
        }
    }

    private drawGalaxy(
        ctx: CanvasRenderingContext2D,
        object: CosmicObject,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const position =
            this.getRenderPosition(
                ctx,
                object,
                mouse,
                enableParallax
            );

        const scale =
            this.getZoomScale(object);

        const radius =
            object.radius * scale;

        ctx.save();

        ctx.translate(
            position.x,
            position.y
        );

        ctx.rotate(object.rotation);

        ctx.scale(1, 0.34);

        const gradient =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                radius
            );

        gradient.addColorStop(
            0,
            `hsla(${object.hue}, 85%, 76%, ${object.alpha})`
        );

        gradient.addColorStop(
            0.28,
            `hsla(${object.hue + 18}, 78%, 62%, ${object.alpha * 0.62})`
        );

        gradient.addColorStop(
            0.65,
            `hsla(${object.hue - 20}, 70%, 45%, ${object.alpha * 0.22})`
        );

        gradient.addColorStop(
            1,
            `hsla(${object.hue}, 80%, 50%, 0)`
        );

        ctx.beginPath();
        ctx.fillStyle = gradient;

        ctx.arc(
            0,
            0,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    private drawPlanet(
        ctx: CanvasRenderingContext2D,
        object: CosmicObject,
        time: number,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const position =
            this.getRenderPosition(
                ctx,
                object,
                mouse,
                enableParallax
            );

        const scale =
            this.getZoomScale(object);

        const radius =
            object.radius * scale;

        const pulse =
            0.9 +
            Math.sin(
                time * 0.00045 +
                object.radius
            ) * 0.1;

        ctx.save();

        ctx.translate(
            position.x,
            position.y
        );

        ctx.rotate(object.rotation);

        if (object.hasRing) {
            ctx.save();

            ctx.rotate(-0.4);

            ctx.beginPath();

            ctx.strokeStyle =
                `hsla(${object.hue}, 58%, 76%, ${object.alpha * 0.9})`;

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

        const glow =
            ctx.createRadialGradient(
                0,
                0,
                radius * 0.2,
                0,
                0,
                radius * 3.4
            );

        glow.addColorStop(
            0,
            `hsla(${object.hue}, 82%, 72%, ${object.alpha * 0.32 * pulse})`
        );

        glow.addColorStop(
            1,
            `hsla(${object.hue}, 80%, 70%, 0)`
        );

        ctx.beginPath();
        ctx.fillStyle = glow;

        ctx.arc(
            0,
            0,
            radius * 3.4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        const body =
            ctx.createRadialGradient(
                -radius * 0.35,
                -radius * 0.35,
                radius * 0.1,
                0,
                0,
                radius
            );

        body.addColorStop(
            0,
            `hsla(${object.hue + 14}, 72%, 78%, ${object.alpha})`
        );

        body.addColorStop(
            0.55,
            `hsla(${object.hue}, 64%, 50%, ${object.alpha * 0.95})`
        );

        body.addColorStop(
            1,
            `hsla(${object.hue - 24}, 62%, 24%, ${object.alpha * 0.8})`
        );

        ctx.beginPath();
        ctx.fillStyle = body;

        ctx.arc(
            0,
            0,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.fillStyle =
            `rgba(0, 0, 0, ${object.alpha * 0.42})`;

        ctx.arc(
            radius * 0.28,
            radius * 0.12,
            radius * 0.95,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    private getRenderPosition(
        ctx: CanvasRenderingContext2D,
        object: CosmicObject,
        mouse: MouseState,
        enableParallax: boolean
    ) {
        const centerX =
            ctx.canvas.clientWidth / 2;

        const centerY =
            ctx.canvas.clientHeight / 2;

        const zoomInfluence =
            0.18 + object.depth * 0.65;

        const zoomedX =
            centerX +
            (object.x - centerX) *
            (
                1 +
                (this.zoom - 1) *
                zoomInfluence
            );

        const zoomedY =
            centerY +
            (object.y - centerY) *
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

        const parallaxStrength = 32 * (1 - object.depth);

        return {
            x: zoomedX - offsetX * parallaxStrength,
            y: zoomedY - offsetY * parallaxStrength
        };
    }

    private getZoomScale(
        object: CosmicObject
    ) {
        const zoomInfluence =
            0.22 + object.depth * 0.55;

        return (
            1 +
            (this.zoom - 1) *
            zoomInfluence
        );
    }

    private random(
        min: number,
        max: number
    ) {
        return min + Math.random() * (max - min);
    }

    private clamp(
        value: number,
        min: number,
        max: number
    ) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }
    applySettings(_settings: unknown) {
    // Planetas configurables más adelante.
}
}