attribute vec2 aPosition;
attribute vec4 aColor;

uniform vec2 uScreenSize;
uniform vec4 uZoom; // x,y: zoom center ; z: zoom factor ; w: scaling
uniform float uAlpha;

varying vec4 vColor;

void main(void) {
    vec2 zoomedPosition = uZoom.xy + (aPosition - uZoom.xy) * uZoom.z;
    gl_Position = vec4(zoomedPosition / uScreenSize * uZoom.w, 0, 1);
    vColor = vec4(aColor.rgb, uAlpha);
}
