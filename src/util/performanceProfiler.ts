export class PerformanceProfiler { // esto es para medir el rendimiento de diferentes partes del código y reportarlo periódicamente en la consola. No es un profiler tradicional, sino más bien una herramienta de medición personalizada.
    private values =
        new Map<string, number>();

    private counts =
        new Map<string, number>();

    private units =
        new Map<string, string>();

    private lastReport =
        performance.now();

    constructor(
        private title = "Cosmos performance"
    ) {}

    measure(
        label: string,
        callback: () => void
    ) {
        const start =
            performance.now();

        callback();

        this.record(
            label,
            performance.now() - start,
            "ms"
        );
    }

    record(
        label: string,
        value: number,
        unit = "ms"
    ) {
        this.values.set(
            label,
            (this.values.get(label) ?? 0) + value
        );

        this.counts.set(
            label,
            (this.counts.get(label) ?? 0) + 1
        );

        this.units.set(
            label,
            unit
        );
    }

    reportEvery(ms: number) {
        const now =
            performance.now();

        if (now - this.lastReport < ms) {
            return;
        }

        const rows: {
            label: string;
            avg: string;
            unit: string;
            samples: number;
        }[] = [];

        for (const [label, total] of this.values) {
            const count =
                this.counts.get(label) ?? 1;

            rows.push({
                label,
                avg: (total / count).toFixed(2),
                unit: this.units.get(label) ?? "ms",
                samples: count
            });
        }

        console.group(this.title);
        console.table(rows);
        console.groupEnd();

        this.values.clear();
        this.counts.clear();
        this.units.clear();

        this.lastReport = now;
    }
}