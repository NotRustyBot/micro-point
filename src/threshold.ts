import { Filter, GlProgram, defaultFilterVert } from "pixi.js";
import fr from "./threshold.frag?raw";

let header = `#version 150 core
#ifdef ARB_explicit_attrib_location
#define useLayout layout(location = 2)
#else
#define useLayout  //thats an empty space
#endif




`;

let frnoh = fr.substring(header.length);
console.log(frnoh);

export const threshold = new Filter({
    glProgram: new GlProgram({
        fragment: frnoh,
        vertex: defaultFilterVert,
    }),
});
