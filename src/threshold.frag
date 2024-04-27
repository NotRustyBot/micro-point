#version 150 core
#ifdef ARB_explicit_attrib_location
#define useLayout layout(location = 2)
#else
#define useLayout  //thats an empty space
#endif

in vec2 vTextureCoord;

out vec4 finalColor;

uniform sampler2D uTexture;

void main() {
    finalColor.rgb = normalize(texture(uTexture, vTextureCoord).rgb);
    finalColor.a = texture(uTexture, vTextureCoord).a;
    if(finalColor.a > 0.2) {
        finalColor.a = max(1.5 - finalColor.a * 2.5, 0.5);
    } else {
        finalColor.a = 0.;
    }

    finalColor.rgb *= finalColor.a;
}