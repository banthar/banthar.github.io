'use strict';
let main = function (canvas) {
    let init = function () {
        let gl = canvas.getContext('webgl');
        let createShader = function (type, source) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                let log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw new Error("An error occurred compiling the shaders: " + log);
            }
            return shader;
        }
        let program = gl.createProgram();
        gl.attachShader(program, createShader(gl.VERTEX_SHADER, `
precision mediump float;

uniform mat4 transform;

attribute vec2 position;
attribute vec2 direction;
attribute vec2 uv;
attribute float color;
attribute float size;

varying vec2 fragmentPosition;
varying vec2 fragmentUv;
varying vec3 fragmentColor;

void main(void) {
    vec2 d = normalize(direction);
    vec2 rotatedDirection = vec2(d.y, -d.x);
    vec2 directionMix = (uv*2.0-1.0);
    fragmentPosition = position + (d*directionMix.x + rotatedDirection*directionMix.y) * size * 7.0;
    fragmentUv = uv;
    fragmentColor = color > 0.0 ? vec3(1,.5,0):(color==0.0?vec3(0,.5,1):vec3(.1,.1,.1));
    gl_Position = transform * vec4(fragmentPosition, 0.0, 1.0);
}
`));
        gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, `
precision mediump float;

varying vec2 fragmentPosition;
varying vec2 fragmentUv;
varying vec3 fragmentColor;

void main(void) {
    float d = length(fragmentUv*2.0-1.0) > 1.0 ? 0.0 : 1.0;
    d = max(0.0,exp(-pow(length(fragmentUv*2.0-1.0),2.0)) * 0.99-0.7);
    gl_FragColor = vec4(fragmentColor,d);
}
`));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        }
        let buffer = gl.createBuffer();

        let n = 10000;
        let objects = new Set();
        let liveObjects = [];
        for (let i = 0; i < n; i++) {
            let position = vec2.fromValues(1.77 * (Math.random() * 2 - 1), Math.random() * 2 - 1);
            let direction = vec2.create();
            vec2.random(direction, 0.001);
            let object = {
                index: i,
                color: i % 2,
                health: 1.0,
                follow: null,
                avoid: null,
                size: 0.01,
                position: position,
                direction: direction,
                maxSpeed: 0.001,
                attackRate: 60,
                attackFrames: 0,
            };
            objects.add(object);
        }

        let stride = 2 * 3 + 2;
        let vertices = new Float32Array(n * stride * 6);

        let draw = function () {
            let w = canvas.width = canvas.clientWidth;
            let h = canvas.height = canvas.clientHeight;
            canvas.style.backgroundColor = 'black';
            document.body.backgroundColor = 'red';
            let gl = canvas.getContext('webgl');

            let liveObjects = Array.from(objects).filter(function (o) { return o.health > 0.0 });
            objects.forEach(function (o1) {
                if (o1.health < 0) {
                    o1.color = -1;
                    return;
                }
                o1.attackFrames ++;
                if (o1.avoid && o1.avoid.health < 0) {
                    o1.avoid = null;
                }
                if (o1.follow && o1.follow.health < 0) {
                    o1.follow = null;
                }
                for (let i = 0; i < 10; i++) {
                    let o2 = liveObjects[Math.floor(Math.random() * liveObjects.length)];
                    if (o1 == o2 || o2.health < 0) {
                        continue;
                    }
                    let distance = vec2.distance(o1.position, o2.position);
                    if (o1.color == o2.color && (!o1.avoid || distance < vec2.distance(o1.position, o1.avoid.position))) {
                        o1.avoid = o2;
                    } else if (o1.color != o2.color && (!o1.follow || distance < vec2.distance(o1.position, o1.follow.position))) {
                        o1.follow = o2;
                    }
                }
                if (o1.follow) {
                    let sizeLimit = o1.size + o1.follow.size;
                    let d = vec2.create();
                    vec2.subtract(d, o1.follow.position, o1.position);
                    let followDistance = vec2.length(d);
                    if (followDistance <= sizeLimit && o1.attackFrames >= o1.attackRate) {
                        o1.follow.health -= 0.4;
                        o1.attackFrames = 0;
                        vec2.scale(d, d, o1.size * 0.75 / followDistance);
                        vec2.add(o1.position, o1.position, d);
                    } else {
                        vec2.scale(d, d, Math.min(1, followDistance - sizeLimit) / followDistance * 0.01);
                    }
                    vec2.add(o1.direction, o1.direction, d);
                }

                if (o1.avoid) {
                    let sizeLimit = o1.size + o1.avoid.size;
                    let d = vec2.create();
                    vec2.subtract(d, o1.position, o1.avoid.position);
                    let avoidDistance = vec2.length(d);
                    if (avoidDistance < sizeLimit) {
                        vec2.normalize(d, d);
                        vec2.add(o1.direction, o1.direction, d);
                    }
                }

                vec2.scale(o1.direction, o1.direction, 0.9);
                let speed = vec2.clone(o1.direction);
                if (vec2.length(speed) > o1.maxSpeed) {
                    vec2.scale(speed, speed, o1.maxSpeed / vec2.length(speed));
                }
                vec2.add(o1.position, o1.position, speed);
            });


            let i = 0;
            let edges = [[0, 0], [0, 1], [1, 0], [0, 1], [1, 1], [1, 0]];
            let negOne = vec2.fromValues(-1, -1);
            let one = vec2.fromValues(1, 1);
            objects.forEach(function (o) {
                edges.forEach(function (v) {
                    vertices[i++] = o.position[0];
                    vertices[i++] = o.position[1];
                    vertices[i++] = o.direction[0];
                    vertices[i++] = o.direction[1];
                    vertices[i++] = v[0];
                    vertices[i++] = v[1];
                    vertices[i++] = o.color;
                    vertices[i++] = o.size;
                });
            });

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

            gl.viewport(0, 0, w, h);
            let transform = mat4.create();
            mat4.scale(transform, transform, vec3.fromValues(h / w, 1, 1));
            gl.cullFace(gl.FRONT);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.enable(gl.BLEND);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(program);
            let ptransformUniform = gl.getUniformLocation(program, "transform");
            gl.uniformMatrix4fv(ptransformUniform, false, transform);
            let vertexPositionAttribute = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(vertexPositionAttribute);
            let vertexDirectionAttribute = gl.getAttribLocation(program, "direction");
            gl.enableVertexAttribArray(vertexDirectionAttribute);
            let vertexUvAttribute = gl.getAttribLocation(program, "uv");
            gl.enableVertexAttribArray(vertexUvAttribute);
            let vertexColorAttribute = gl.getAttribLocation(program, "color");
            gl.enableVertexAttribArray(vertexColorAttribute);
            let vertexSizeAttribute = gl.getAttribLocation(program, "size");
            gl.enableVertexAttribArray(vertexSizeAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, stride * 4, 0 * 4);
            gl.vertexAttribPointer(vertexDirectionAttribute, 2, gl.FLOAT, false, stride * 4, 2 * 4);
            gl.vertexAttribPointer(vertexUvAttribute, 2, gl.FLOAT, false, stride * 4, 4 * 4);
            gl.vertexAttribPointer(vertexColorAttribute, 1, gl.FLOAT, false, stride * 4, 6 * 4);
            gl.vertexAttribPointer(vertexSizeAttribute, 1, gl.FLOAT, false, stride * 4, 7 * 4);
            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    }
    init();
}

