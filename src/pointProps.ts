export type PointProperty = {
    color: number;
    relations: Map<number, DistanceStrength>;
};

type DistanceStrength = {
    optima: number;
    strength: number;
};

export const typeCount = 10;
export function generateDefinitions(): Record<number, PointProperty> {
    const record: Record<number, PointProperty> = {};
    for (let index = 0; index < typeCount; index++) {
        const map = new Map<number, DistanceStrength>();
        for (let a = 0; a < typeCount; a++) {
            map.set(a, {
                optima: 0.5 * Math.random() * 80 + 20,
                strength: Math.random() - 0.5,
            });
        }

        record[index] = {
            color: 0x555555 + Math.floor(Math.random() * 0x999999),
            relations: map,
        };
    }

    return record;
}
