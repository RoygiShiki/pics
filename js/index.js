console.clear();
var Dot = /** @class */ (function () {
    function Dot(ctx, graphic, start) {
        this._start = { x: 0, y: 0 };
        this._position = { x: 0, y: 0 };
        this._target = { x: 0, y: 0 };
        this._curve = { x: 0, y: 0 };
        this.opacity = 0;
        this.targetOpacity = 0.5;
        this.delay = 0;
        this.ease = function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; };
        this.ctx = ctx;
        this.graphic = graphic;
        this._start = start;
        this._position = start;
    }
    Dot.prototype.setPosition = function (index, newPos, curve, opacity, width, height, size, jump) {
        if (jump === void 0) { jump = false; }
        newPos.x = Math.round(newPos.x);
        newPos.y = Math.round(newPos.y);
        this._target = newPos;
        this._start = this._position;
        this._curve = curve;
        this.delay = ((newPos.x + size - width / 2) + (newPos.y + size - height / 2)) * 3;
        this.targetOpacity = opacity;
    };
    Object.defineProperty(Dot.prototype, "position", {
        get: function () {
            return this._position;
        },
        enumerable: true,
        configurable: true
    });
    Dot.prototype.getPointOnBezierCurve = function (start, curve, target, time) {
        var rt = 1 - time;
        var x = rt * rt * start.x + 2 * rt * time * curve.x + time * time * target.x;
        var y = rt * rt * start.y + 2 * rt * time * curve.y + time * time * target.y;
        return { x: x, y: y };
    };
    Dot.prototype.update = function (time) {
        var timeValue = (time - this.delay) / 2500;
        if (timeValue > 1)
            timeValue = 1;
        if (timeValue >= 0) {
            var t = this.ease(timeValue);
            this.opacity += (this.targetOpacity - this.opacity) * t;
            this._position = this.getPointOnBezierCurve(this._start, this._curve, this._target, t);
        }
        this.ctx.globalAlpha = this.opacity;
        this.ctx.drawImage(this.graphic, this._position.x, this._position.y);
        this.ctx.globalAlpha = 1;
    };
    return Dot;
}());
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        this.width = 0;
        this.height = 0;
        this.dots = [];
        this.positions = [];
        this.gridSize = 350;
        this.gridSpace = 1;
        this.dotCount = 0;
        this.dotSize = 4;
        this.imageIndex = -1;
        this.images = [
            // 'images/p1.jpg',
            // 'images/p2.jpg',
            // 'images/p3.jpg',
            // 'images/p4.jpg',
            // 'images/p5.jpg',
            // 'images/p6.jpg',
            // 'images/p7.jpg',
        ];
        this.started = false;
        this.getContrast = function (color) {
            var _a = [0, 2, 4].map(function (p) { return parseInt(color.substr(p, 2), 16); }), r = _a[0], g = _a[1], b = _a[2];
            return (((r * 299) + (g * 587) + (b * 114)) / 1000 / 256);
        };
        this.canvas = document.getElementById('canvas');
        this.onResize();
        this.calculateAvaliablePositions();
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.fillStyle = "#4E4E4E";
        this.ctx.fillRect(0, 0, this.width, this.height);
        var dotCanvas = document.createElement('canvas');
        dotCanvas.width = this.dotSize;
        dotCanvas.height = this.dotSize;
        var dotCtx = dotCanvas.getContext('2d');
        dotCtx.beginPath();
        dotCtx.arc(this.dotSize / 2, this.dotSize / 2, this.dotSize / 2, 0, Math.PI * 2);
        dotCtx.fillStyle = "#FFFFFF";
        dotCtx.fill();
        for (var i = 0; i < this.positions.length; i++) {
            var pos = this.shiftPosition(this.grid(i));
            this.spreadPosition(pos);
            var dot = new Dot(this.ctx, dotCanvas, pos);
            this.dots.push(dot);
        }
        Rx.Observable.fromEvent(window, 'resize').subscribe(function () { return _this.onResize(); });
        this.next();
    }
    App.prototype.calculateAvaliablePositions = function () {
        var jump = (this.dotSize + this.gridSpace);
        var radius = this.gridSize / 2;
        var center = { x: this.gridSize / 2, y: this.gridSize / 2 };
        for (var i = 0; i < this.gridSize / jump; i++) {
            for (var j = 0; j < this.gridSize / jump; j++) {
                var offset = j % 2 ? jump / 2 : 0;
                var pos = { x: offset + jump * i, y: jump * j };
                if (Math.pow((pos.x - center.x), 2) + Math.pow((pos.y - center.y), 2) < Math.pow(radius, 2)) {
                    this.positions.push(pos);
                }
            }
        }
    };
    App.prototype.next = function () {
        var _this = this;
        this.imageIndex++;
        if (this.imageIndex >= this.images.length)
            this.imageIndex = 0;
        this.loadImage().then(function (image) {
            _this.currentImage = image;
            _this.reloadDots();
            if (!_this.started)
                _this.tick(null);
            _this.started = true;
        });
        setTimeout(function () { return _this.next(); }, 7000);
    };
    App.prototype.randomPosition = function () {
        return { x: Math.random() * this.width, y: Math.random() * this.height };
    };
    App.prototype.onResize = function () {
        this.width = this.canvas.parentElement.offsetWidth;
        this.height = this.canvas.parentElement.offsetHeight;
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);
    };
    App.prototype.shuffle = function (a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [a[j], a[i]], a[i] = _a[0], a[j] = _a[1];
        }
        return a;
        var _a;
    };
    App.prototype.reloadDots = function () {
        var _this = this;
        this.startTime = this.lastTime ? this.lastTime : 0;
        var i = -1;
        this.dots.map(function (dot) {
            i++;
            var pos = _this.grid(i);
            var shiftedPos = _this.shiftPosition(pos);
            var curve = _this.grid(i);
            _this.spreadPosition(curve);
            var percentX = (pos.x / _this.gridSize) * 100;
            var percentY = (pos.y / _this.gridSize) * 100;
            var contrast = _this.getContrast(String(_this.getPixel(percentX, percentY)));
            dot.setPosition(i, shiftedPos, curve, contrast || 0, _this.width, _this.height, _this.gridSize);
        });
    };
    App.prototype.shiftPosition = function (pos) {
        return {
            x: pos.x + this.width / 2 - this.gridSize / 2,
            y: pos.y + this.height / 2 - this.gridSize / 2
        };
    };
    App.prototype.spreadPosition = function (pos) {
        pos.x += this.width / 3.5 + ((Math.random() * 600) - 300) - this.gridSize / 2;
        pos.y += this.height / 2 + ((Math.random() * 600) - 300) - this.gridSize / 2;
    };
    App.prototype.grid = function (i) {
        return { x: this.positions[i].x, y: this.positions[i].y };
    };
    App.prototype.loadImage = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function () { return resolve(_this.getImageData(img)); };
            img.src = _this.images[_this.imageIndex];
        });
    };
    App.prototype.getImageData = function (image) {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
    };
    App.prototype.radius = function (k, n, b) {
        if (k > (n - b))
            return 1;
        return Math.sqrt(k - 1 / 2) / Math.sqrt(n - (b + 1) / 2);
    };
    App.prototype.getPixel = function (percentX, percentY) {
        var size = this.currentImage.width > this.currentImage.height ? this.currentImage.height : this.currentImage.width;
        var x = Math.round((percentX / 100) * size);
        var y = Math.round((percentY / 100) * size);
        if (x < 0)
            x = 0;
        if (x > this.currentImage.width)
            x = this.currentImage.width;
        if (y < 0)
            y = 0;
        if (y > this.currentImage.height)
            y = this.currentImage.height;
        var r, g, b, a, offset = x * 4 + y * 4 * this.currentImage.width;
        if (offset + 3 > this.currentImage.data.length)
            offset = this.currentImage.data.length - 4;
        r = this.currentImage.data[offset];
        g = this.currentImage.data[offset + 1];
        b = this.currentImage.data[offset + 2];
        var str = "" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
        return str;
    };
    App.prototype.componentToHex = function (c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };
    App.prototype.tick = function (t) {
        var _this = this;
        if (!this.startTime || this.startTime == 0)
            this.startTime = t;
        this.lastTime = t;
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = "#4E4E4E";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = 1;
        this.dots.map(function (dot) { return dot.update(t - _this.startTime); });
        window.requestAnimationFrame(function (t) { return _this.tick(t); });
    };
    return App;
}());
var app = new App();