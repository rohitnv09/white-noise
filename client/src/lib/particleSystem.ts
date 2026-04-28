interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 80;
  private width = 0;
  private height = 0;

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  update(dt: number, activeColors: string[]) {
    // Spawn particles
    if (activeColors.length > 0 && this.particles.length < this.maxParticles) {
      const spawnRate = Math.min(activeColors.length * 0.3, 2);
      if (Math.random() < spawnRate * dt) {
        const color = activeColors[Math.floor(Math.random() * activeColors.length)]!;
        this.particles.push({
          x: Math.random() * this.width,
          y: this.height + 10,
          vx: (Math.random() - 0.5) * 20,
          vy: -(20 + Math.random() * 40),
          radius: 2 + Math.random() * 4,
          color,
          opacity: 0.15 + Math.random() * 0.25,
          life: 0,
          maxLife: 8 + Math.random() * 12,
        });
      }
    }

    // Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += (Math.random() - 0.5) * 5 * dt;

      const lifePct = p.life / p.maxLife;
      if (lifePct > 0.7) {
        p.opacity *= 0.98;
      }

      if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > this.width + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}
