export type ShootingStar = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
};

export class ShootingStars {
    private stars: ShootingStar[] = [];
    private nextShootingStar = 0;

    scheduleNext(time: number) {
        this.nextShootingStar = time + this.random(2500, 6500);
    }

    update(
        delta: number,
        time: number,
        width: number,
        height: number,
        enabled: boolean
    ) {
        if (enabled && time > this.nextShootingStar) {
            this.create(width, height);
            this.nextShootingStar = time + this.random(3500, 9000);
        }

        this.stars = this.stars.filter((star) => {
            star.x += star.vx * (delta / 1000);
            star.y += star.vy * (delta / 1000);
            star.life -= delta;

            return star.life > 0;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (const star of this.stars) {
            const alpha = Math.max(star.life / star.maxLife, 0);

            const endX = star.x - star.vx * 0.08;
            const endY = star.y - star.vy * 0.08;

            const gradient = ctx.createLinearGradient(
                star.x,
                star.y,
                endX,
                endY
            );

            gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    clear() {
        this.stars = [];
    }

    private create(width: number, height: number) {
        const fromLeft = Math.random() > 0.5;

        this.stars.push({
            x: fromLeft ? -100 : width + 100,
            y: Math.random() * height * 0.55,
            vx: fromLeft
                ? this.random(550, 950)
                : -this.random(550, 950),
            vy: this.random(160, 360),
            life: this.random(700, 1300),
            maxLife: 1300
        });
    }

    private random(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}