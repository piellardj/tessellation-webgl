attribute vec2 aVertex;

uniform vec2 uScreenSize;

void main(void) {
    gl_Position = vec4(aVertex / uScreenSize, 0, 1);
}
