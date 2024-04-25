import { Filter, GlProgram, defaultFilterVert } from "pixi.js";

export const chroma = new Filter({
    glProgram: new GlProgram({
        fragment: `
        in vec2 vTextureCoord;
        
        out vec4 finalColor;
        
        uniform sampler2D uTexture;
        uniform float power;
        
        void main()
        {
            finalColor.r =  texture(uTexture, vTextureCoord - 0.001 * power).r;
            finalColor.g =  texture(uTexture, vTextureCoord).g;
            finalColor.b =  texture(uTexture, vTextureCoord + 0.001 * power).b;
            finalColor.a =  texture(uTexture, vTextureCoord + 0.001 * power).a;
        }`,
        vertex: defaultFilterVert,
    }),
    resources: {
        chroma: {
            power: { value: 0, type: "f32" },
        },
    },
});
