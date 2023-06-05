const canvas = document.getElementById("background");

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    set(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    magnitude() {
        return Math.sqrt(this.magnitudeSqr());
    }

    magnitudeSqr() {
        return (this.x * this.x + this.y * this.y);
    }

    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    multiply(vector) {
        return new Vector2(this.x * vector.x, this.y * vector.y);
    }

    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }

    distance(vector) {
        let xDiff = this.x - vector.x;
        let yDiff = this.y - vector.y;
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }

    scale(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    clamp(maxValue){
        let xClamped = this.x > maxValue ? maxValue : this.x;
        let yClamped = this.y > maxValue ? maxValue : this.y;
        return new Vector2(xClamped, yClamped);
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    directionTo(vector) {
        return vector.subtract(this).normalize();
    }

    normalize(){
        let magnitude = this.magnitude();
        let vector = this.clone();
        if(Math.abs(magnitude) < 1e-9){
            vector.x = 0;
            vector.y = 0;
        } else {
            vector.x /= magnitude;
            vector.y /= magnitude;
        }
        return vector;
    }
}

class Connector {
    constructor(position, velocity, isStatic = false) {
        this.position = position;
        this.velocity = velocity;
        this.desiredDirection = new Vector2(0, 0);
        this.wanderStrength = 0.2;
        this.steerStrength = 0.05;
        this.maxSpeed = 0.40;
        this.isStatic = isStatic;
    }

    update(){
        if(this.isStatic) return;
        
        this.desiredDirection = this.desiredDirection.add(randomPointInCircle().scale(this.wanderStrength)).normalize();
        if(this.position.x < (0 - (getWidth() * 0.1)) || this.position.x > getWidth() * 1.1){
            this.desiredDirection = this.desiredDirection.add(this.position.directionTo(getCenter())).scale(this.wanderStrength).normalize();
        }
        if(this.position.y < (0 - (getHeight() * 0.1)) || this.position.y > getHeight() * 1.1){
            this.desiredDirection = this.desiredDirection.add(this.position.directionTo(getCenter())).scale(this.wanderStrength).normalize();
        }

        let desiredVelocity = this.desiredDirection.scale(this.maxSpeed);
        
        let desiredSteeringForce = (desiredVelocity.subtract(this.velocity)).scale(this.steerStrength);
        
        let acceleration = desiredSteeringForce.clamp(this.steerStrength);

        this.velocity = this.velocity.add(acceleration).clamp(this.maxSpeed);
        
        this.position = this.position.add(this.velocity);
    }
}

const connectors = [];

function getRandomX() {
    return getRandom(-(getWidth() * 0.1), getWidth() * 1.1);
}

function getRandomAngle() {
    return getRandomX(0, 360);
}

function getRandomY() {
    return getRandom(-(getHeight() * 0.1), getHeight() * 1.1);
}

function getCenter(){
    return new Vector2(getWidth()/2, getHeight()/2);
}

// let indices;
const numConnectors = 250;

function generatePoints(width, height){
    connectors.length = 0;
    let x = 0 - width * 0.1;
    let y = 0 - height * 0.1;
    connectors[0] = new Connector(new Vector2(x, y), new Vector2(0, 0), true);
    connectors[1] = new Connector(new Vector2(x, height - y), new Vector2(0, 0), true);
    connectors[2] = new Connector(new Vector2(width - x, height - y), new Vector2(0, 0), true);
    connectors[3] = new Connector(new Vector2(width - x, y), new Vector2(0, 0), true);
    let n = connectors.length;
    for (let i = n; i < n + numConnectors; i++) {
        let angle = getRandomAngle();
        let angleVec = new Vector2(Math.sin(angle), Math.cos(angle)).scale(0.5);
        
        connectors[i] = new Connector(new Vector2(getRandomX(), getRandomY()), angleVec, false);
        // connectors[i].speed = Math.min(0.4, connectors[i].speed);
    }
}

function onLoad() {
    console.log("width: " + getWidth() + ", height: " + getHeight());
    generatePoints(getWidth(), getHeight());
    lastTriangle = performance.now();
    canvas.width = getWidth();
    canvas.height = getHeight();
    window.addEventListener('gesturestart', e => e.preventDefault());
    window.addEventListener('gesturechange', e => e.preventDefault());
    window.addEventListener('gestureend', e => e.preventDefault());
    animate();
}

let lastAnimate = 0;
let lastSecond = 0;
let frames = 0;
let lastFps = 0;
let lastTriangle = 0;

function getWidth(){
    return window.screen.width;
}

function getHeight(){
    return window.outerHeight;
}

function animate() {
    requestAnimationFrame(animate);
    // request next frame
    if (performance.now() - lastAnimate < 15) {
        return;
    }
    if(performance.now() - lastSecond > 1000){
        lastFps = frames;
        frames = 0;
        lastSecond = performance.now();
    }
    frames++;
    lastAnimate = performance.now();
    canvas.width = getWidth();
    canvas.height = getHeight();
    let points = [];
    for(let i = 0; i < connectors.length; i++){
        let p = [connectors[i].position.x, connectors[i].position.y];
        points.push(p);
    }
    const pattern = trianglify({
        width: getWidth(),
        height: getHeight(),
        xColors: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
        yColors: 'match',
        palette: trianglify.colorbrewer,
        colorSpace: 'lab',
        cellSize: 1,
        colorFunction: trianglify.colorFunctions.interpolateLinear(0.3),
        fill: true,
        strokeWidth: 0,
        points: points,
    }).toCanvas(canvas)
    for (let i = 0; i < connectors.length; i++) {
        let p = connectors[i];
        if(p.isStatic)
            continue;
        // Rules:
        // Avoid the edges, avoid other points
        p.update();
    }

}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function randomPointInCircle(){
    let r = 1 * Math.sqrt(Math.random());
    let theta = Math.random() * 2 * Math.PI;
    return new Vector2(r * Math.cos(theta), r * Math.sin(theta))
}

window.addEventListener('load', onLoad);