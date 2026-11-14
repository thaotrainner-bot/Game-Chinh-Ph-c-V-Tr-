import { AMMO_TYPES, AmmoId, SHIPS, ShipId } from '../types/game';
import { Bullet, RichParticle } from './fx';
import { drawShipHull } from './shipRenderer';
import { soundFX } from './sound';

let nextEntityUid = 1;

export class ChickenEnemy {
  uid: number;
  width: number;
  height: number;
  x: number;
  y: number;
  baseSpeed: number;
  hp: number;
  maxHp: number;
  angle: number;
  curve: number;
  markedForDeletion = false;
  lastEggTime: number;
  slowTimer = 0;
  featherColor: string;

  constructor(level: number, gameWidth: number) {
    this.uid = nextEntityUid++;
    this.width = 38 + Math.random() * 14;
    this.height = this.width;
    this.x = Math.random() * (gameWidth - 100) + 50;
    this.y = -this.height;
    this.baseSpeed = (1.35 + Math.random() * 1.2) * (1 + level * 0.08);
    this.hp = (this.width > 45 ? 42 : 22) + level * 7;
    this.maxHp = this.hp;
    this.angle = Math.random() * Math.PI * 2;
    this.curve = 0.8 + Math.random() * 1.4;
    this.lastEggTime = Date.now() + Math.random() * 1600;
    const palettes = ['#ffffff', '#fef08a', '#fed7aa', '#f5d0fe'];
    this.featherColor = palettes[Math.floor(Math.random() * palettes.length)];
  }

  applySlow() {
    this.slowTimer = 150;
  }

  update(
    gameWidth: number,
    gameHeight: number,
    currentLevel: number,
    enemyBullets: Bullet[]
  ) {
    const slowFactor = this.slowTimer > 0 ? 0.55 : 1.0;
    if (this.slowTimer > 0) this.slowTimer--;

    this.y += this.baseSpeed * slowFactor;
    this.x += Math.sin(this.angle) * this.curve * slowFactor;
    this.angle += 0.045 * slowFactor;
    this.x = Math.max(30, Math.min(gameWidth - 30, this.x));

    if (Date.now() - this.lastEggTime > 2300) {
      enemyBullets.push(
        new Bullet(
          this.x,
          this.y + this.height / 2,
          0,
          3.8 + currentLevel * 0.25,
          {},
          false,
          16
        )
      );
      this.lastEggTime = Date.now() + Math.random() * 1200;
    }

    if (this.y - this.height > gameHeight + 20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const wingFlap = Math.sin(Date.now() * 0.018 + this.uid) * 10;
    const bodyTint = this.slowTimer > 0 ? '#7dd3fc' : this.featherColor;

    ctx.fillStyle = bodyTint;
    ctx.beginPath();
    ctx.ellipse(-this.width / 2 - 4, wingFlap, 16, 10, -0.25, 0, Math.PI * 2);
    ctx.ellipse(this.width / 2 + 4, wingFlap, 16, 10, 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-5, -this.height / 2 - 2, 5, 0, Math.PI * 2);
    ctx.arc(0, -this.height / 2 - 5, 6, 0, Math.PI * 2);
    ctx.arc(5, -this.height / 2 - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.lineTo(6, 1);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-16, -this.height / 2 - 14, 32, 4);
      ctx.fillStyle = this.slowTimer > 0 ? '#38bdf8' : '#22c55e';
      ctx.fillRect(-16, -this.height / 2 - 14, 32 * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }
}

export class Meteor {
  uid: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation = 0;
  rotSpeed: number;
  hp: number;
  maxHp: number;
  slowTimer = 0;
  markedForDeletion = false;
  vertices: { x: number; y: number }[] = [];

  constructor(level: number, gameWidth: number) {
    this.uid = nextEntityUid++;
    this.radius = 22 + Math.random() * 18;
    this.x = Math.random() * (gameWidth - 80) + 40;
    this.y = -this.radius * 2;
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = 1.6 + Math.random() * 1.8 + level * 0.12;
    this.rotSpeed = (Math.random() - 0.5) * 0.06;
    this.hp = 35 + this.radius * 1.2 + level * 8;
    this.maxHp = this.hp;

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const r = this.radius * (0.78 + Math.random() * 0.32);
      this.vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
  }

  applySlow() {
    this.slowTimer = 150;
  }

  update(gameHeight: number, frameCount: number, particles: RichParticle[]) {
    const slowFactor = this.slowTimer > 0 ? 0.55 : 1.0;
    if (this.slowTimer > 0) this.slowTimer--;

    this.x += this.vx * slowFactor;
    this.y += this.vy * slowFactor;
    this.rotation += this.rotSpeed * slowFactor;

    if (frameCount % 4 === 0) {
      particles.push(
        new RichParticle(
          this.x + (Math.random() - 0.5) * this.radius,
          this.y - this.radius * 0.6,
          this.slowTimer > 0 ? '#38bdf8' : '#f97316',
          'smoke'
        )
      );
    }

    if (this.y - this.radius > gameHeight + 30) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = this.slowTimer > 0 ? '#475569' : '#57534e';
    ctx.strokeStyle = this.slowTimer > 0 ? '#38bdf8' : '#ea580c';
    ctx.lineWidth = 2;

    ctx.beginPath();
    this.vertices.forEach((v, idx) => {
      if (idx === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(
      -this.radius * 0.25,
      -this.radius * 0.15,
      this.radius * 0.22,
      0,
      Math.PI * 2
    );
    ctx.arc(
      this.radius * 0.25,
      this.radius * 0.2,
      this.radius * 0.16,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}

export class BossChicken {
  uid: number;
  level: number;
  width: number;
  height: number;
  x: number;
  y: number;
  targetY = 120;
  maxHp: number;
  hp: number;
  speedX: number;
  angle = 0;
  phase = 1;
  lastShotTime = Date.now();
  fireRate: number;
  slowTimer = 0;

  constructor(level: number, gameWidth: number) {
    this.uid = nextEntityUid++;
    this.level = level;
    this.width = 135 + level * 6;
    this.height = 110 + level * 4;
    this.x = gameWidth / 2;
    this.y = -this.height;
    this.maxHp = 480 + level * 320;
    this.hp = this.maxHp;
    this.speedX = 2.4 + level * 0.22;
    this.fireRate = Math.max(550, 1450 - level * 85);
  }

  applySlow() {
    this.slowTimer = 90;
  }

  update(
    gameWidth: number,
    enemyBullets: Bullet[],
    onEnrage: (x: number, y: number) => void
  ) {
    const slowFactor = this.slowTimer > 0 ? 0.65 : 1.0;
    if (this.slowTimer > 0) this.slowTimer--;

    if (this.y < this.targetY) {
      this.y += 2.2;
    } else {
      this.x += this.speedX * slowFactor;
      if (
        this.x > gameWidth - this.width / 2 - 20 ||
        this.x < this.width / 2 + 20
      ) {
        this.speedX *= -1;
      }
      this.y = this.targetY + Math.sin(this.angle) * 22;
      this.angle += 0.04 * slowFactor;

      if (Date.now() - this.lastShotTime > this.fireRate) {
        this.shoot(enemyBullets);
        this.lastShotTime = Date.now();
      }

      if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
        this.phase = 2;
        this.fireRate *= 0.68;
        this.speedX *= 1.3;
        onEnrage(this.x, this.y);
      }
    }
  }

  shoot(enemyBullets: Bullet[]) {
    const spd = 4.6 + this.level * 0.35;
    if (this.phase === 1) {
      for (let i = -2; i <= 2; i++) {
        enemyBullets.push(
          new Bullet(
            this.x + i * 16,
            this.y + this.height / 2,
            i * 1.3,
            spd,
            { isBossFireball: true },
            false,
            20
          )
        );
      }
    } else {
      const count = 9;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI / (count - 1)) * i;
        enemyBullets.push(
          new Bullet(
            this.x,
            this.y + 20,
            Math.cos(a) * spd,
            Math.sin(a) * spd + 1.5,
            { isBossFireball: true },
            false,
            22
          )
        );
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const flap = Math.sin(Date.now() * 0.02) * 18;
    ctx.fillStyle = this.phase === 2 ? '#fecdd3' : '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(-this.width / 2 - 12, flap, 34, 20, -0.3, 0, Math.PI * 2);
    ctx.ellipse(this.width / 2 + 12, flap, 34, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle =
      this.slowTimer > 0
        ? '#bae6fd'
        : this.phase === 2
          ? '#ffe4e6'
          : '#ffffff';
    ctx.strokeStyle = this.phase === 2 ? '#f43f5e' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, -this.height / 2 + 6);
    ctx.lineTo(-38, -this.height / 2 - 26);
    ctx.lineTo(-14, -this.height / 2 - 10);
    ctx.lineTo(0, -this.height / 2 - 34);
    ctx.lineTo(14, -this.height / 2 - 10);
    ctx.lineTo(38, -this.height / 2 - 26);
    ctx.lineTo(32, -this.height / 2 + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(16, 8);
    ctx.lineTo(0, 34);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.phase === 2 ? '#ef4444' : '#0f172a';
    ctx.beginPath();
    ctx.arc(-24, -10, 7, 0, Math.PI * 2);
    ctx.arc(24, -10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Player {
  width = 42;
  height = 50;
  x: number;
  y: number;
  baseSpeed = 6.2;
  weaponTier = 1;
  lastShotTime = 0;
  isHit = false;
  hitTimer = 0;
  shield = false;
  shipId: ShipId = 'falcon';
  maxHp = 100;
  hp = 100;
  speed = 6.2;
  damageMult = 1.0;
  fireRateMult = 1.0;
  healBonus = 1.0;
  color = '#00f3ff';

  constructor(
    shipId: ShipId,
    startTier: number,
    gameWidth: number,
    gameHeight: number
  ) {
    this.x = gameWidth / 2;
    this.y = gameHeight - 75;
    this.weaponTier = startTier || 1;
    this.applyShipConfig(shipId, true);
  }

  applyShipConfig(shipId: ShipId, isInitial: boolean) {
    const cfg = SHIPS[shipId] || SHIPS.falcon;
    this.shipId = cfg.id;
    const prevPct = this.maxHp ? this.hp / this.maxHp : 1;
    this.maxHp = cfg.maxHp;
    this.hp = isInitial
      ? cfg.maxHp
      : Math.max(15, Math.round(cfg.maxHp * prevPct));
    this.speed = this.baseSpeed * cfg.speedMult;
    this.damageMult = cfg.damageMult;
    this.fireRateMult = cfg.fireRateMult;
    this.healBonus = cfg.healBonus;
    this.color = cfg.primaryColor;
    if (isInitial && cfg.autoShieldPerLevel) {
      this.shield = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isHit && Math.floor(Date.now() / 70) % 2 === 0) {
      ctx.globalAlpha = 0.42;
    }
    drawShipHull(ctx, this.shipId, this.width, this.height, this.shield);
    ctx.restore();
  }

  update(
    gameWidth: number,
    gameHeight: number,
    isPointerActive: boolean,
    pointerX: number,
    pointerY: number,
    keys: Record<string, boolean>,
    selectedAmmoId: AmmoId,
    playerBullets: Bullet[]
  ) {
    if (this.isHit) {
      this.hitTimer -= 16.6;
      if (this.hitTimer <= 0) this.isHit = false;
    }

    if (isPointerActive) {
      this.x += (pointerX - this.x) * 0.22;
      this.y += (pointerY - 30 - this.y) * 0.22;
    } else {
      if (keys.ArrowLeft || keys.a || keys.A) this.x -= this.speed;
      if (keys.ArrowRight || keys.d || keys.D) this.x += this.speed;
      if (keys.ArrowUp || keys.w || keys.W) this.y -= this.speed;
      if (keys.ArrowDown || keys.s || keys.S) this.y += this.speed;
    }

    this.x = Math.max(
      this.width / 2 + 8,
      Math.min(gameWidth - this.width / 2 - 8, this.x)
    );
    this.y = Math.max(
      this.height / 2 + 8,
      Math.min(gameHeight - this.height / 2 - 8, this.y)
    );

    const now = Date.now();
    const baseInterval =
      this.weaponTier >= 8 ? 115 : this.weaponTier >= 5 ? 135 : 165;
    const fireInterval = baseInterval / this.fireRateMult;

    if (
      (keys[' '] || isPointerActive) &&
      now - this.lastShotTime >= fireInterval
    ) {
      this.shoot(selectedAmmoId, playerBullets);
      this.lastShotTime = now;
    }
  }

  shoot(selectedAmmoId: AmmoId, playerBullets: Bullet[]) {
    const ammo = AMMO_TYPES[selectedAmmoId] || AMMO_TYPES[1];
    const y = this.y - this.height / 2;
    const baseSpeed = (-12.5 - this.weaponTier * 0.4) * ammo.speedMult;
    const tierDmg =
      (11 + this.weaponTier * 1.6) * this.damageMult * ammo.damageMult;

    soundFX.playShot(ammo.id);

    const spawnBullet = (
      offsetX: number,
      offsetY: number,
      vx: number,
      vy: number
    ) => {
      playerBullets.push(
        new Bullet(
          this.x + offsetX,
          y + offsetY,
          vx,
          vy,
          ammo,
          true,
          tierDmg,
          this.weaponTier
        )
      );
    };

    const t = this.weaponTier;
    if (t === 1) {
      spawnBullet(0, 0, 0, baseSpeed);
    } else if (t === 2) {
      spawnBullet(-11, 2, 0, baseSpeed);
      spawnBullet(11, 2, 0, baseSpeed);
    } else if (t === 3) {
      spawnBullet(0, -4, 0, baseSpeed);
      spawnBullet(-16, 4, -0.6, baseSpeed);
      spawnBullet(16, 4, 0.6, baseSpeed);
    } else if (t === 4) {
      spawnBullet(-8, 0, -0.5, baseSpeed);
      spawnBullet(8, 0, 0.5, baseSpeed);
      spawnBullet(-20, 8, -1.8, baseSpeed);
      spawnBullet(20, 8, 1.8, baseSpeed);
    } else if (t === 5) {
      for (let i = -2; i <= 2; i++)
        spawnBullet(i * 6, Math.abs(i) * 3, i * 1.3, baseSpeed);
    } else if (t === 6) {
      for (let i = -3; i <= 3; i++) {
        if (i !== 0) spawnBullet(i * 5, Math.abs(i) * 2, i * 1.35, baseSpeed);
      }
    } else if (t === 7) {
      for (let i = -3; i <= 3; i++)
        spawnBullet(i * 5, Math.abs(i) * 2, i * 1.5, baseSpeed);
    } else if (t === 8) {
      for (let i = -4; i <= 4; i++)
        spawnBullet(i * 4, Math.abs(i) * 2, i * 1.45, baseSpeed);
    } else if (t === 9) {
      for (let i = -4; i <= 4; i++)
        spawnBullet(i * 5, Math.abs(i) * 2, i * 1.75, baseSpeed);
      spawnBullet(-24, 14, -4.5, baseSpeed * 0.7);
      spawnBullet(24, 14, 4.5, baseSpeed * 0.7);
    } else {
      for (let i = -5; i <= 5; i++) {
        spawnBullet(i * 4, Math.abs(i) * 1.5, i * 1.65, baseSpeed);
      }
      spawnBullet(-18, 22, -2.2, Math.abs(baseSpeed) * 0.65);
      spawnBullet(18, 22, 2.2, Math.abs(baseSpeed) * 0.65);
    }
  }
}
