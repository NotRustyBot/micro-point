export type PointProperty = {
    color: number;
    relations: Map<number, DistanceStrength>;
};

type DistanceStrength = {
    strength: number;
};

export const typeCount = 8;
export function generateDefinitions(): Record<number, PointProperty> {
    const record: Record<number, PointProperty> = {};
    for (let index = 0; index < typeCount; index++) {
        const map = new Map<number, DistanceStrength>();
        for (let a = 0; a < typeCount; a++) {
            let power = 0;
            switch (index) {
                case a:
                    power = -0.5;
                    break;

                case a + 1:
                    power = -0.25;
                    break;


                default:
                    break;
            }
            map.set(a, {
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
