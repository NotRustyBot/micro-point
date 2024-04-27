import { Assets, Sprite } from "pixi.js";
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
        this.sprite = Sprite.from(Assets.get("kour"));
        this.sprite.tint = this.definition.color;
        this.sprite.anchor.set(0.5);
        this.sprite.alpha = 1;

        typeContainerRecord[type].addChild(this.sprite);

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;
    }

    updateForces() {
        const nears = this.near();
        if (nears.length > Point.maxNear) {
            Point.maxNear = nears.length;
            Point.mostNear = this;
        }
        for (const near of nears) {
            if (near == this) continue;
            const distance = near.position.distance(this.position);
            const nearDiff = this.position.diff(near.position);

            const relation = this.definition.relations.get(near.type);
            if (distance < this.maxForceDist) {
                if (distance < this.maxForceDist / 5) {
                    const diff = nearDiff.result().normalize((this.maxForceDist / 5 - distance) * 2);
                    this.velocity.add(diff);

                    if (distance < this.size) {
                        const diff = nearDiff.result().normalize(5);
                        this.velocity.add(diff);
                    }
                } else {
                    // if (this.type == near.type && distance < this.size / 10) {
                    //     if (this.size <= near.size) {
                    //         if (!near.mfr) {
                    //             near.eat(this.size);
                    //             this.mfr = true;
                    //             this.destroy();
                    //             break;
                    //         }
                    //     }
                    // }

                    if (!relation) continue;
                    const diff = nearDiff.result().normalize(this.maxForceDist - Math.abs(distance - 0.5 * this.maxForceDist));
                    this.velocity.add(diff.result().mult(relation.strength * 0.02));
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
        this.velocity.mult(Math.min(3 / this.velocity.length(), 0.9));
        const speed = this.velocity.length();
        let scaley = (speed / this.size + this.scalyOld * this.scalyAvg) / (this.scalyAvg + 1);
        this.scalyOld = scaley;
        this.sprite.scale.set(scaley + 1, 5 / (scaley + 5));
        this.sprite.scale.x *= (this.size / 64) * 5 + 0.0;
        this.sprite.scale.y *= (this.size / 64) * 5 + 0.0;

        this.sprite.rotation = rLerp(this.sprite.rotation, this.velocity.toAngle(), 0.25);

        this.velocity.add(this.position.result().normalize(-this.position.lengthSquared() / 10000 ** 2));
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
        const nearSet = new Array<Point>();
        const vl = { x: 0, y: 0 };
        for (const ox of Point.nearField) {
            for (const oy of Point.nearField) {
                vl.x = ox * this.maxForceDist + this.position.x;
                vl.y = oy * this.maxForceDist + this.position.y;
                const chunkChildren = Point.chunk.get(this.positionToGrid(vl));
                if (chunkChildren) {
                    nearSet.push(...chunkChildren);
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

function rLerp(A: number, B: number, w: number) {
    let CS = (1 - w) * Math.cos(A) + w * Math.cos(B);
    let SN = (1 - w) * Math.sin(A) + w * Math.sin(B);
    return Math.atan2(SN, CS);
}
