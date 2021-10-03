attribute vec2 aPosition;
attribute vec4 aColor;

uniform vec2 uScreenSize;

varying vec4 vColor;

void main(void) {
    gl_Position = vec4(aPosition / uScreenSize, 0, 1);
    vColor = aColor;
}
