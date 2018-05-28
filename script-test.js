let canvas;
let ctx;

var numberOfBalls = 52;
var ballColor = '#ff0000';
let balls = [];

window.addEventListener('load', function () {
    createWorld();
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    var resize = e => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        vp.dsc = Math.min(canvas.width / vp.w, canvas.height / vp.h);
    }

    resize();
    setTimeout(draw, 500);
});

function Ball(x, y, velocity, ang, radius, color) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.ang = ang;
    this.radius = radius;
    this.color = color;
    this.m = radius * radius;
}

function Wall(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
}

function createWorld() {
    let i = 0;
    let xx = 1;
    let yy = 1;
    while (i < numberOfBalls - 1) {
        balls[i] = new Ball(xres / 2 + yy * 13 - (xx + 1) / 2 * 13, 160 - xx * 12, 0, 0, 6, (xx + 2) % 7);
        yy++;
        if (yy > xx) {
            xx++;
            yy = 1;
        }
        i++;
    }
    balls[numberOfBalls - 1] = new Ball(xres / 2, 330, 3 + 10 * Math.random(), -0.75 - 1.5 * Math.random(), 5 + 10 * Math.random(), 0);
    for (i = 0; i < wnum; i++) {
        walls[i] = new Wall(
            xres / 2 + xres / 2.1 * Math.cos(2 * Math.PI / wnum * i),
            yres / 2 + yres / 2.1 * Math.sin(2 * Math.PI / wnum * i),
            xres / 2 + xres / 2.1 * Math.cos(2 * Math.PI / wnum * (i + 1)),
            yres / 2 + yres / 2.1 * Math.sin(2 * Math.PI / wnum * (i + 1)));
    }
}
