attribute vec2 aVertex;

uniform vec2 uScreenSize;
uniform vec4 uZoom; // x,y: zoom center ; z: zoom factor ; w: scaling

void main(void) {
    vec2 zoomedPosition = uZoom.xy + (aVertex - uZoom.xy) * uZoom.z;
    gl_Position = vec4(zoomedPosition / uScreenSize * uZoom.w, 0, 1);
}
