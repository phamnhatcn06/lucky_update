class ModernFireworks {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this.continuousMode = false;
        this.cw = window.innerWidth;
        this.ch = window.innerHeight;

        // Configuration
        this.gravity = 0.04; // Lower gravity for floatier LED feel
        this.friction = 0.96;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cw = this.canvas.width;
        this.ch = this.canvas.height;
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Explode at a position- with impact mode for prominence
    explodeAt(x, y, density = 1, isImpact = false) {
        const particleCount = (isImpact ? 80 : 60) * density; 
        
        // Pháo hoa nhiều màu ngẫu nhiên cho mọi lần nổ
        const baseHue = this.random(0, 360);

        for (let i = 0; i < particleCount; i++) {
            const angle = this.random(0, Math.PI * 2);
            const speed = isImpact ? this.random(4, 12) : this.random(1, 8); // Faster for impact
            // Nếu là impact thì mỗi hạt một màu ngẫu nhiên, còn không thì theo tone màu gốc
            const particleHue = isImpact ? this.random(0, 360) : baseHue + this.random(-20, 20);

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                hue: particleHue,
                // Tăng độ sáng (lightness) lên để màu rực hơn trên nền tối
                brightness: isImpact ? this.random(70, 100) : this.random(50, 90), 
                alpha: 1,
                size: isImpact ? this.random(3.5, 6.5) : this.random(1.5, 4.5), // Slightly larger for front-layer visibility
                decay: isImpact ? this.random(0.02, 0.04) : this.random(0.015, 0.03) 
            });
        }
    }

    randomExplosion() {
        const x = this.random(this.cw * 0.2, this.cw * 0.8);
        const y = this.random(this.ch * 0.2, this.ch * 0.6);
        this.explodeAt(x, y);
    }

    loop() {
        if (!this.running) {
            this.ctx.clearRect(0, 0, this.cw, this.ch);
            return;
        }

        requestAnimationFrame(() => this.loop());

        // Fade effect
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Slightly faster fade
        this.ctx.fillRect(0, 0, this.cw, this.ch);

        this.ctx.globalCompositeOperation = 'lighter';

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= this.friction;
            p.vy *= this.friction;
            p.vy += this.gravity;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw Particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            
            // Removed expensive shadowBlur/shadowColor for performance
            
            // Dùng hsla: hue (màu), saturation=100%, lightness (độ sáng) không nên quá cao sẽ thành trắng xóa
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, ${Math.min(p.brightness, 75)}%, ${p.alpha})`;
            this.ctx.fill();
        }

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    start() {
        this.running = true;
        this.loop();
    }

    stop() {
        this.running = false;
        this.particles = []; // Clear particles to free memory
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.cw, this.ch);
        }
    }

    fireSequence() {
        if (!this.running) this.start();
        const count = 10;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.randomExplosion();
            }, i * 150);
        }
    }

    startContinuous() {
        if (!this.running) this.start();
        this.continuousMode = true;
        this._continuousLoop();
    }

    _continuousLoop() {
        if (!this.continuousMode) return;
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.continuousMode) this.randomExplosion();
            }, i * 100);
        }
        setTimeout(() => this._continuousLoop(), 300 + Math.random() * 300);
    }

    stopContinuous() {
        this.continuousMode = false;
        setTimeout(() => {
            if (!this.continuousMode) {
                this.stop();
            }
        }, 1500);
    }
}

window.ModernFireworks = ModernFireworks;
