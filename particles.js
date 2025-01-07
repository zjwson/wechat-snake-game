class Particle {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
        this.size = Math.random() * 3 + 2
        this.speedX = Math.random() * 6 - 3
        this.speedY = Math.random() * 6 - 3
        this.life = 1.0
        this.decay = Math.random() * 0.02 + 0.02
    }

    update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= this.decay
        this.size *= 0.95
    }

    draw(ctx) {
        ctx.fillStyle = this.color + Math.floor(this.life * 255).toString(16).padStart(2, '0')
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
    }
}

class ParticleSystem {
    constructor() {
        this.particles = []
    }

    createEatEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, '#ffff00'))
        }
    }

    createDeathEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(x, y, '#ff0000'))
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update()
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1)
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx))
    }
}

export default new ParticleSystem()
