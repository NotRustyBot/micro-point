import { Sprite } from "pixi.js";
import { Vector, Vectorlike } from "./types";
import { pointDefinition, typeContainerRecord } from "./main";
import { PointProperty } from "./pointProps";
export class Point {
    destroy(): void {
        Point.chunk.get(this.inChunk)?.delete(this);
        this.sprite.destroy();
    }
    static maxNear = 0;
    static mostNear: Point;
    static chunk = new Map<number, Set<Point>>();
    inChunk: number;
    readonly maxForceDist = 100;
    size = 5;
    position: Vector;
    velocity = new Vector();

    sprite: Sprite;
    type: number;
    definition: PointProperty;

    mfr = false;

    constructor(x: number, y: number, type: number) {
        this.position = new Vector(x, y);
        this.inChunk = 0;
        this.type = type;
        this.definition = pointDefinition[type];
        this.move();
        this.sprite = Sprite.from("Kour.png");
        this.sprite.tint = this.definition.color;
        this.sprite.anchor.set(0.5);
        this.sprite.alpha = 0.5;

        typeContainerRecord[type].addChild(this.sprite);

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;
    }

    updateForces() {
        const nears = this.near();
        if (nears.size > Point.maxNear) {
            Point.maxNear = nears.size;
            Point.mostNear = this;
        }
        for (const near of nears) {
            if (near == this) continue;
            const dsq = near.position.distance(this.position);
            const nearDiff = this.position.diff(near.position);

            const ds = this.definition.relations.get(near.type);
            if (dsq < this.maxForceDist) {
                if (dsq < this.size) {
                    const diff = nearDiff.result().normalize(3);
                    this.velocity.add(diff.result());
                }

                if (this.type == near.type && dsq < this.size / 10) {
                    if (this.size <= near.size) {
                        if (!near.mfr) {
                            near.eat(this.size);
                            this.mfr = true;
                            this.destroy();
                            break;
                        }
                    }
                }

                if (!ds) continue;
                if (dsq < ds.optima * 2) {
                    const diff = nearDiff.result().normalize(dsq / ds.optima);
                    this.velocity.add(diff.result().mult((ds.strength * near.size) / this.size));
                }
            }
        }
    }

    eat(otherSize: number) {
        const ok = this.size ** 2 + otherSize ** 2;
        this.size = Math.sqrt(ok);
    }
    scalyOld = 0;
    scalyAvg = 10;
    updateMove() {
        let scaley = (this.velocity.length() / this.size + this.scalyOld * this.scalyAvg) / (this.scalyAvg + 1);
        this.sprite.scale.set(scaley + 1, 5 / (scaley + 5));
        this.sprite.scale.x *= (this.size / 64) * 3 + 0.00001;
        this.sprite.scale.y *= (this.size / 64) * 3 + 0.00001;
        this.sprite.rotation = this.velocity.toAngle();

        this.velocity.mult(0.3);
        this.velocity.add(this.position.result().normalize(-0.1));
        this.move(this.velocity);

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;
    }

    move(offset?: Vectorlike) {
        Point.chunk.get(this.inChunk)?.delete(this);

        if (offset) {
            this.position.add(offset);
        }

        this.inChunk = this.positionToGrid(this.position);
        let chunk = Point.chunk.get(this.inChunk);
        if (!chunk) {
            chunk = new Set();
            Point.chunk.set(this.inChunk, chunk);
        }

        chunk.add(this);
    }

    static readonly nearField = [-1, 0, 1];
    near() {
        const nearSet = new Set<Point>();
        for (const ox of Point.nearField) {
            for (const oy of Point.nearField) {
                const vl = { x: ox * this.maxForceDist + this.position.x, y: oy * this.maxForceDist + this.position.y };
                const chunkChildren = Point.chunk.get(this.positionToGrid(vl));

                if (chunkChildren) {
                    for (const child of chunkChildren) {
                        nearSet.add(child);
                    }
                }
            }
        }

        return nearSet;
    }

    toGridAxis(scalar: number): number {
        return Math.floor(scalar / this.maxForceDist);
    }

    toGrid(position: Vectorlike): Vector {
        return new Vector(this.toGridAxis(position.x), this.toGridAxis(position.y));
    }

    toGridIndex(vector: Vectorlike): number {
        return ((vector.x & 0xffff) << 16) | (vector.y & 0xffff);
    }

    positionToGrid(vector: Vectorlike): number {
        return this.toGridIndex(this.toGrid(vector));
    }
}
