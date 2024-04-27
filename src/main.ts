function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
Math.random = mulberry32(2);

import { Point } from "./point";
import { generateDefinitions, typeCount } from "./pointProps";
import "./style.css";
import { Application, Assets, BlurFilter, Container, Text } from "pixi.js";
import { Vector } from "./types";
import { chroma } from "./chroma";
import { threshold } from "./threshold";

export const pointContainer = new Container();
export const typeContainerRecord: Record<number, Container> = {};
export let pointDefinition = generateDefinitions();
export let prts = new Array<Point>();

let zoomy = 0;
const camera = new Vector(0, 0);
(async () => {
    const app = new Application();
    await app.init({ background: "#010509", resizeTo: window, antialias: true });
    Assets.add({ alias: "kour", src: "Kour.png" });
    await Assets.load("kour");

    app.stage.addChild(pointContainer);
    pointContainer.x = 0;
    pointContainer.y = 0;
    pointContainer.scale.set(0.1);
    pointContainer.pivot.set(0.5);
    document.body.appendChild(app.canvas);

    const keys: Record<string, boolean> = {};

    document.addEventListener("keydown", (e) => {
        keys[e.key] = true;
    });

    document.addEventListener("keyup", (e) => {
        delete keys[e.key];
    });
    let autocam = true;
    let act = 0;

    const defaultCamSpeed = 10;
    let camSpeed = defaultCamSpeed;
    const blur = new BlurFilter({ antialias: true, strength: zoomy });
    chroma.resources.chroma.uniforms.power = 1;
    pointContainer.filters = [blur, chroma];
    const zoomtext = new Text({ style: { fontSize: 64, fill: 0xeeeeee, fontFamily: "consolas" } });
    zoomtext.alpha = 0.3;
    app.stage.addChild(zoomtext);

    const autocamText = new Text({ style: { fontSize: 32, fill: 0xeeeeee, fontFamily: "consolas" } });
    autocamText.y = 32;
    autocamText.alpha = 0.3;

    app.stage.addChild(autocamText);

    app.ticker.add(async () => {
        zoomtext.text = pointContainer.scale.x.toFixed(3) + "x";
        autocamText.text = "\n[" + (autocam ? "AUTO" : "MANUAL") + "]";

        for (const layer in typeContainerRecord) {
            (typeContainerRecord[layer].filters as BlurFilter[])[0].blur = pointContainer.scale.x * 5;
        }

        if (autocam) {
            act++;
            if (act > 150 && act < 260) {
                zoomIn();
            }
            if (act > 280 && act < 300) {
                zoomOut();
            }

            if (act > 400 && act < 420) {
                camera.y -= camSpeed / pointContainer.scale.x;
                zoomy += 0.3;
            }

            if (act > 420 && act < 500) {
                camera.y += (camSpeed / pointContainer.scale.x) * 0.3;
                zoomy += 0.1;
            }

            if (act > 510 && act < 560) {
                zoomy += 1;
            }

            if (act > 650 && act < 680) {
                zoomOut();
            }

            if (act > 900 && act < 1500) {
                const diff = Point.mostNear.position.result().mult(-1).diff(camera);
                camera.add(diff.normalize(diff.length() * 0.01));
                if (act > 1000 && act < 1030) {
                    zoomIn();
                }
            }

            if (act > 1650 && act < 1680) {
                zoomOut();
            }

            if (act > 1750 && act < 1800) {
                camera.mult(0.95);
            }

            if (act > 1820 && act < 1850) {
                zoomIn();
            }

            if (act > 1950 && act < 1980) {
                zoomOut();
            }

            if (act > 2000 && act < 2600) {
                const diff = Point.mostNear.position.result().mult(-1).diff(camera);
                camera.add(diff.normalize(diff.length() * 0.01));
                if (act > 2100 && act < 2130) {
                    zoomIn();
                }
            }

            if (act > 2650) {
                zoomOut();
            }
            if (act > 2750) {
                reset();
            }
            Point.maxNear--;
        } else {
            if (keys["w"]) {
                camera.y += camSpeed / pointContainer.scale.x;
                zoomy += 0.3;
            }
            if (keys["s"]) {
                camera.y -= camSpeed / pointContainer.scale.x;
                zoomy += 0.3;
            }
            if (keys["a"]) {
                camera.x += camSpeed / pointContainer.scale.x;
                zoomy += 0.3;
            }
            if (keys["d"]) {
                camera.x -= camSpeed / pointContainer.scale.x;
                zoomy += 0.3;
            }

            if (keys["e"]) {
                pointContainer.scale.set(pointContainer.scale.x * 1.03);
                zoomy += 1;
            }

            if (keys["q"]) {
                pointContainer.scale.set(pointContainer.scale.x / 1.03);
                zoomy += 1;
            }
        }

        if (keys["c"]) {
            keys["c"] = false;
            autocam = !autocam;
        }

        for (const point of prts) {
            point.updateForces();
        }

        prts = prts.filter((p) => !p.mfr);
        for (const point of prts) {
            point.updateMove();
        }

        zoomy *= 0.95;
        blur.blur = zoomy * 0.5 + 0.5;
        chroma.resources.chroma.uniforms.power = 0.1 * zoomy + 0.5;

        if (keys["r"]) {
            reset();
        }

        pointContainer.x = camera.x * pointContainer.scale.x + window.innerWidth / 2;
        pointContainer.y = camera.y * pointContainer.scale.x + window.innerHeight / 2;
    });

    function zoomIn() {
        pointContainer.scale.set(pointContainer.scale.x * 1.03);
        zoomy += 1;
    }

    function zoomOut() {
        pointContainer.scale.set(pointContainer.scale.x / 1.03);
        zoomy += 1;
    }

    reset();
    function reset() {
        Point.chunk.clear();
        prts.forEach((p) => p.destroy());
        prts = [];
        pointDefinition = generateDefinitions();
        const blur = new BlurFilter({ antialias: true, strength: 0 });
        for (const contKey in typeContainerRecord) {
            if (Object.prototype.hasOwnProperty.call(typeContainerRecord, contKey)) {
                const cont = typeContainerRecord[contKey];
                cont.destroy();
            }
        }

        for (let i = 0; i < typeCount; i++) {
            typeContainerRecord[i] = new Container();
            typeContainerRecord[i].filters = [blur, threshold];
            pointContainer.addChild(typeContainerRecord[i]);
        }
        act = 0;
        while (prts.length < 2000) {
            let point;
            const rnd = Vector.fromAngle(Math.random() * Math.PI * 2);
            rnd.mult((Math.random() * 2000 ** 2) ** 0.5);

            point = new Point(rnd.x, rnd.y, Math.floor(Math.random() * (typeCount - 3) + Math.abs((rnd.length() / 2000) * 3)));

            point.velocity.x = Math.random() * 10 - 5;
            point.velocity.y = Math.random() * 10 - 5;
            prts.push(point);
            pointContainer.scale.set(0.1);
            camera.x = 0;
            camera.y = 0;
        }
    }
})();
