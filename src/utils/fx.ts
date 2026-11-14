import { AmmoConfig, AmmoId } from '../types/game';

export class RichParticle {
  x: number;
  y: number;
  color: string;
  kind: 'feather' | 'rock' | 'spark' | 'smoke';
  life = 1.0;
  rotation = Math.random() * Math.PI * 2;
  rotSpeed = (Math.random() - 0.5) * 0.22;
  vx: number;
  vy: number;
  gravity: number;
  decay: number;
  size: number;

  constructor(
    x: number,
    y: number,
    color: string,
    kind: 'feather' | 'rock' | 'spark' | 'smoke' = 'spark'
  ) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.kind = kind;
    const angle = Math.random() * Math.PI * 2;
    if (kind === 'feather') {
      const spd = 2 + Math.random() * 5.5;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd - 1.5;
      this.gravity = 0.08;
      this.decay = 0.016 + Math.random() * 0.015;
      this.size = 6 + Math.random() * 5;
    } else if (kind === 'rock') {
      const spd = 1.5 + Math.random() * 6;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
      this.gravity = 0.06;
      this.decay = 0.02 + Math.random() * 0.02;
      this.size = 4 + Math.random() * 5;
    } else if (kind === 'smoke') {
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = -0.8 - Math.random() * 1.2;
      this.gravity = 0;
      this.decay = 0.04;
      this.size = 5 + Math.random() * 6;
    } else {
      const spd = 2 + Math.random() * 7;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
      this.gravity = 0.03;
      this.decay = 0.03 + Math.random() * 0.025;
      this.size = 2.5 + Math.random() * 3.5;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    if (this.kind === 'feather') {
      this.vx *= 0.96;
      this.x += Math.sin(this.life * 10) * 0.6;
    }
    this.rotation += this.rotSpeed;
    this.life -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    if (this.kind === 'feather') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'rock') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.8);
    } else if (this.kind === 'smoke') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

export class ShockwaveRing {
  x: number;
  y: number;
  color: string;
  radius = 6;
  maxRadius: number;
  life = 1.0;

  constructor(x: number, y: number, color: string, maxRadius = 65) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.18;
    this.life -= 0.045;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3 * this.life;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life = 1.0;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
  }

  update() {
    this.y -= 1.3;
    this.life -= 0.022;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = "800 14px 'Chakra Petch', 'Be Vietnam Pro', sans-serif";
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#000000';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class PowerUpItem {
  x: number;
  y: number;
  radius = 15;
  speed = 2.1;
  angle = 0;
  markedForDeletion = false;
  type: 'U' | 'H' | 'S';
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const r = Math.random();
    if (r < 0.52) {
      this.type = 'U';
      this.color = '#facc15';
    } else if (r < 0.8) {
      this.type = 'H';
      this.color = '#34d399';
    } else {
      this.type = 'S';
      this.color = '#00f3ff';
    }
  }

  update(gameHeight: number) {
    this.y += this.speed;
    this.angle += 0.1;
    if (this.y - this.radius > gameHeight + 20) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const s = 1 + Math.sin(this.angle) * 0.12;
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.font = "800 14px 'Chakra Petch', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type, 0, 1);
    ctx.restore();
  }
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  damage: number;
  tier: number;
  markedForDeletion = false;
  rotation = 0;
  ammoType: AmmoId = 1;
  color = '#fff9e6';
  coreColor = '#ffffff';
  slowEffect = false;
  pierceLeft = 1;
  hitIds = new Set<number>();
  radius = 9;
  isBossFireball = false;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    ammoConfig: Partial<AmmoConfig> & { radius?: number; isBossFireball?: boolean },
    isPlayer: boolean,
    damage: number,
    tier = 1
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isPlayer = isPlayer;
    this.damage = damage;
    this.tier = tier;
    if (isPlayer) {
      this.ammoType = (ammoConfig.id as AmmoId) || 1;
      this.color = ammoConfig.color || '#00f3ff';
      this.coreColor = ammoConfig.coreColor || '#ffffff';
      this.slowEffect = Boolean(ammoConfig.slowEffect);
      this.pierceLeft = ammoConfig.pierceCount || 1;
      this.radius =
        this.ammoType === 2
          ? 9 + tier * 0.4
          : this.ammoType === 3
            ? 14 + tier * 0.5
            : 8 + tier * 0.3;
    } else {
      this.color = ammoConfig.color || '#fff9e6';
      this.radius = ammoConfig.radius || 9;
      this.isBossFireball = Boolean(ammoConfig.isBossFireball);
    }
  }

  update(gameWidth: number, gameHeight: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += 0.28;
    if (
      this.y < -40 ||
      this.y > gameHeight + 40 ||
      this.x < -40 ||
      this.x > gameWidth + 40
    ) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isPlayer) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      if (this.ammoType === 1) {
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-3.5, -12, 7, 24, 4);
        ctx.fill();
        ctx.fillStyle = this.coreColor;
        ctx.fillRect(-1.5, -9, 3, 18);
      } else if (this.ammoType === 2) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.coreColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.ammoType === 3) {
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, 4, this.radius, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.strokeStyle = this.coreColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 4, this.radius - 2, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
      } else {
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const rOut = this.radius + 3;
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? rOut : 4;
          const a = (i * Math.PI) / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.isBossFireball) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2a6d';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffbeb';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}
