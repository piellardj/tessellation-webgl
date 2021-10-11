attribute vec2 aVertex;

uniform vec2 uScreenSize;
uniform vec4 uZoom; // x,y,z: zoom ; w: scaling

void main(void) {
    vec2 zoomedPosition = uZoom.x * aVertex + uZoom.yz;
    gl_Position = vec4(zoomedPosition / uScreenSize * uZoom.w, 0, 1);
}
