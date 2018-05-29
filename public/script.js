// Get button press
var socket = io.connect('http://localhost:3000');

const xres = 250;
const yres = 250;
let canvas;
let ctx;

let vp = {
    w: xres,
    h: yres,
    x: xres / 2,
    y: yres / 2,
    dsc: 1
};

let dec2vpX = x => (x - vp.x) * vp.dsc + canvas.width / 2;
let dec2vpY = y => (y - vp.y) * vp.dsc + canvas.height / 2;
let vp2decX = x => vp.x + (x - canvas.width / 2) / vp.dsc;
let vp2decY = y => vp.y + (y - canvas.height / 2) / vp.dsc;
let getDist = (ax, ay, bx, by, m, d) => (m = 50, d = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2))) < m ? m : d;
let getMid = (a, b) => (a + b) / 2;

var numberOfBalls = 70;
var ballColor = '#e3002c';
var ballStroke = '#152900';
const numberOfWalls = 30;

const prec = 0.01;
const kdf = 0.85;
const grav = 0.01;

let balls = [];
let walls = [];
let mox = xres / 2;
let moy = xres;

let getdistdxdy = (dx, dy) => Math.sqrt(dx * dx + dy * dy);

function geta0(dx, dy) {
    let d = getdistdxdy(dx, dy);
    if (d !== 0) {
        let res = Math.acos(dx / d);
        if (dy < 0) res = -res;
        return res;
    } else return 0;
}

function geta(x1, y1, x2, y2) {
    let d = Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2));
    if (d !== 0) {
        let res = Math.acos((x1 * x2 + y1 * y2) / d);
        if ((x1 * y2 - x2 * y1) < 0) res = -res;
        return res;
    } else return 0;
}

function gettimeb2b(b1, b2) {
    let a0 = b1.x - b2.x,
        b0 = b1.dx - b2.dx;
    let c0 = b1.y - b2.y,
        u0 = b1.dy - b2.dy;
    let ka = b0 * b0 + u0 * u0;
    let kk = a0 * b0 + c0 * u0;
    let kc = a0 * a0 + c0 * c0 - Math.pow(b1.r + b2.r, 2);
    let kd = kk * kk - ka * kc;
    if (kd > 0 && ka !== 0) {
        kd = Math.sqrt(kd);
        let res = (-kk + kd) / ka;
        let t = (-kk - kd) / ka;
        if (res > t) res = t;
        if (Math.abs(res) < prec) return 0;
        else return res;
    } else return -1;
}

function gettimeb2w(b, w) {
    let lx = w.x2 - w.x1,
        ly = w.y2 - w.y1;
    let kc = lx * b.dy - ly * b.dx;
    let kk = getdistdxdy(lx, ly) * b.r;
    let ka = -w.x1 * w.y2 + w.x2 * w.y1 + ly * b.x - lx * b.y;
    if (kc !== 0) {
        let res = (ka + kk) / kc;
        let t = (ka - kk) / kc;
        if (res > t) res = t;
        if (Math.abs(res) < prec) return 0;
        else return res;
    } else return -1;
}

function getdxdy(b) {
    b.dx = b.vel * Math.cos(b.ang);
    b.dy = b.vel * Math.sin(b.ang);
}

function gravity(ball) {
    ball.dx = ball.vel * Math.cos(ball.ang);
    ball.dy = ball.vel * Math.sin(ball.ang);
    ball.dx += (mox - ball.x) * grav;
    ball.dy += (moy - ball.y) * grav;
    ball.vel = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (ball.vel !== 0) {
        ball.ang = Math.acos(ball.dx / ball.vel);
        if (ball.dy < 0) ball.ang = -ball.ang;
    }
}

function Ball(x, y, vel, ang, r) {
    this.x = x;
    this.y = y;
    this.vel = vel;
    this.ang = ang;
    this.r = r;
    this.m = r * r;
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
    while (i < numberOfBalls) {
        balls[i] = new Ball(xres / 2 + yy * 13 - (xx + 1) / 2 * 13, 180 - xx * 12, 0, 0, 6);
        yy++;
        if (yy > xx) {
            xx++;
            yy = 1;
        }
        i++;
    }

    for (i = 0; i < numberOfWalls; i++) {
        walls[i] = new Wall(
            xres / 2 + xres / 2.1 * Math.cos(2 * Math.PI / numberOfWalls * i),
            yres / 2 + yres / 2.1 * Math.sin(2 * Math.PI / numberOfWalls * i),
            xres / 2 + xres / 2.1 * Math.cos(2 * Math.PI / numberOfWalls * (i + 1)),
            yres / 2 + yres / 2.1 * Math.sin(2 * Math.PI / numberOfWalls * (i + 1)));
    }
}

function animateit() {
    let checkt = (tt, dtt, mtt) => (tt >= 0) && (tt < dtt) && (tt < mtt);
    let dt = 1;
    for (let b of balls) getdxdy(b);
    do {
        let mint = dt;
        let tob = -1,
            tow = -1,
            frb = -1;
        for (let i = 0; i < numberOfBalls; i++) {
            for (let z = 0; z < numberOfWalls; z++) {
                let tt = gettimeb2w(balls[i], walls[z]);
                if (checkt(tt, dt, mint)) {
                    frb = i;
                    tow = z;
                    tob = -1;
                    mint = tt;
                }
            }
            for (let z = i + 1; z < numberOfBalls; z++) {
                let tt = gettimeb2b(balls[i], balls[z]);
                if (checkt(tt, dt, mint)) {
                    frb = i;
                    tow = -1;
                    tob = z;
                    mint = tt;
                }
            }
        }

        for (let i = 0; i < numberOfBalls; i++) {
            if (i === frb) {
                if (tow !== -1) {
                    balls[frb].x = balls[frb].x + mint * balls[frb].dx;
                    balls[frb].y = balls[frb].y + mint * balls[frb].dy;
                    let an = geta0(walls[tow].x2 - walls[tow].x1, walls[tow].y2 - walls[tow].y1);
                    if (geta(balls[frb].x - walls[tow].x1, balls[frb].y - walls[tow].y1, walls[tow].x2 - walls[tow].x1, walls[tow].y2 - walls[tow].y1) < 0) {
                        an -= Math.PI / 2;
                    } else {
                        an += Math.PI / 2;
                    }
                    balls[frb].ang = geta0(-balls[frb].vel * Math.cos(balls[frb].ang - an), balls[frb].vel * Math.sin(balls[frb].ang - an)) + an;
                    balls[frb].vel *= kdf;
                    getdxdy(balls[frb]);
                }
                if (tob !== -1) {
                    balls[frb].x = balls[frb].x + mint * balls[frb].dx;
                    balls[frb].y = balls[frb].y + mint * balls[frb].dy;
                    balls[tob].x = balls[tob].x + mint * balls[tob].dx;
                    balls[tob].y = balls[tob].y + mint * balls[tob].dy;
                    let an = geta0(balls[frb].x - balls[tob].x, balls[frb].y - balls[tob].y);
                    let v1 = balls[frb].vel * Math.cos(balls[frb].ang - an);
                    let v1y = balls[frb].vel * Math.sin(balls[frb].ang - an);
                    let m1 = balls[frb].m;
                    let v2 = balls[tob].vel * Math.cos(balls[tob].ang - an);
                    let v2y = balls[tob].vel * Math.sin(balls[tob].ang - an);
                    let m2 = balls[tob].m;
                    let v1x = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
                    let v2x = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
                    balls[frb].ang = geta0(v1x, v1y) + an;
                    balls[frb].vel = Math.sqrt(v1x * v1x + v1y * v1y) * kdf;
                    balls[tob].ang = geta0(v2x, v2y) + an;
                    balls[tob].vel = Math.sqrt(v2x * v2x + v2y * v2y) * kdf;
                    getdxdy(balls[frb]);
                    getdxdy(balls[tob]);
                }
            } else if (i !== tob) {
                balls[i].x = balls[i].x + mint * balls[i].dx;
                balls[i].y = balls[i].y + mint * balls[i].dy;
            }
        }
        dt -= mint;
    } while (dt > 0);
}

window.addEventListener('load', function () {

    createWorld();
    canvas = document.querySelector('#blue-gum');
    ctx = canvas.getContext('2d');

    var resize = e => {
        canvas.width = xres * 1.5;
        canvas.height = yres * 1.5;
        vp.dsc = Math.min(canvas.width / vp.w, canvas.height / vp.h);
    }

    resize();
    setTimeout(draw, 500);
});

socket.on('buttonPressed', function (buttonPressed) {
    var bottomBallYPos = 0;
    var bottomBallIndex = 0;
    
    if (buttonPressed) {
        for (var i = 0; i < balls.length; i++) {
            if (balls[i].y > bottomBallYPos) {
                bottomBallYPos = balls[i].y;
                bottomBallIndex = i;
            }
        }

        balls.splice(bottomBallIndex, 1);
        numberOfBalls--;
    }
});

window.addEventListener('keydown', function (e) {
    var keyCode = e.keyCode;
    var bottomBallYPos = 0;
    var bottomBallIndex = 0;

    if (keyCode === 32) {
        e.preventDefault();

        for (var i = 0; i < balls.length; i++) {
            if (balls[i].y > bottomBallYPos) {
                bottomBallYPos = balls[i].y;
                bottomBallIndex = i;
            }
        }

        balls.splice(bottomBallIndex, 1);
        numberOfBalls--;
    }
});

function draw() {
    var gumImage = document.createElement('img');
    gumImage.src = '/img/blue-gum.png';

    for (i = 0; i < numberOfBalls; i++) gravity(balls[i]);
    animateit();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < numberOfWalls; i++) {
        ctx.beginPath();
        ctx.moveTo(dec2vpX(walls[i].x1), dec2vpY(walls[i].y1));
        ctx.lineTo(dec2vpX(walls[i].x2), dec2vpY(walls[i].y2));
        ctx.closePath();
    }
    for (var i = 0; i < numberOfBalls; i++) {
        ctx.beginPath();
        ctx.arc(dec2vpX(balls[i].x), dec2vpY(balls[i].y), vp.dsc * balls[i].r, 0, 2 * Math.PI, false);
        ctx.fillStyle = ballColor;
        ctx.fill();
        ctx.strokeStyle = ballStroke;
        ctx.stroke();
    }
    setTimeout(draw, 20);
}
