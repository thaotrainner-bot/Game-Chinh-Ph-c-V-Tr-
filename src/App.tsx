import { useEffect, useRef, useState } from 'react';
import { StageModals } from './components/HangarModal';
import { AMMO_TYPES, AmmoId, GameState, SHIPS, ShipId } from './types/game';
import { BossChicken, ChickenEnemy, Meteor, Player } from './utils/actors';
import {
  Bullet,
  FloatingText,
  PowerUpItem,
  RichParticle,
  ShockwaveRing,
} from './utils/fx';
import { soundFX } from './utils/sound';

const MAX_LEVEL = 10;

interface HudSnapshot {
  score: number;
  highScore: number;
  level: number;
  hp: number;
  maxHp: number;
  shield: boolean;
  weaponTier: number;
  enemiesKilled: number;
  killsRequired: number;
  bossActive: boolean;
  bossLevel: number;
  bossHp: number;
  bossMaxHp: number;
}

interface BannerInfo {
  title: string;
  subtitle: string;
  borderColor: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [selectedShipId, setSelectedShipId] = useState<ShipId>('falcon');
  const [selectedAmmoId, setSelectedAmmoId] = useState<AmmoId>(1);
  const [startingWeaponTier, setStartingWeaponTier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>('START');
  const [showHangarModal, setShowHangarModal] = useState<boolean>(true);
  const [hasActiveCampaign, setHasActiveCampaign] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [banner, setBanner] = useState<BannerInfo | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const savedHigh = Number(
      localStorage.getItem('space_chicken_highscore_v2') || 0
    );
    return {
      score: 0,
      highScore: savedHigh,
      level: 1,
      hp: 100,
      maxHp: 100,
      shield: false,
      weaponTier: 1,
      enemiesKilled: 0,
      killsRequired: 14,
      bossActive: false,
      bossLevel: 1,
      bossHp: 550,
      bossMaxHp: 550,
    };
  });

  const engineRef = useRef<{
    selectShipLive: (shipId: ShipId) => void;
    selectAmmoLive: (ammoId: AmmoId) => void;
    adjustTierLive: (delta: number) => void;
    setTierDirectly: (tier: number) => void;
    startNewCampaign: () => void;
    togglePause: () => void;
    openHangar: () => void;
    resumeFromHangar: () => void;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stageContainer = stageRef.current;
    if (!canvas || !stageContainer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let bannerTimeoutId: number | null = null;
    let bossSpawnTimeoutId: number | null = null;
    let transitionTimeoutId: number | null = null;

    const state = {
      gameWidth: 800,
      gameHeight: 600,
      selectedShipId: 'falcon' as ShipId,
      selectedAmmoId: 1 as AmmoId,
      startingWeaponTier: 1,
      gameState: 'START' as GameState,
      previousPlayState: 'PLAYING' as GameState,
      score: 0,
      highScore: Number(
        localStorage.getItem('space_chicken_highscore_v2') || 0
      ),
      currentLevel: 1,
      enemiesKilled: 0,
      killsRequiredForBoss: 14,
      frameCount: 0,
      screenShake: 0,
      isPointerActive: false,
      pointerX: 0,
      pointerY: 0,
      keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        w: false,
        a: false,
        s: false,
        d: false,
        W: false,
        A: false,
        S: false,
        D: false,
        ' ': false,
      } as Record<string, boolean>,
    };

    let stars: { x: number; y: number; size: number; speed: number }[] = [];
    let nebulae: {
      x: number;
      y: number;
      r: number;
      color: string;
      speed: number;
    }[] = [];
    let player: Player | null = null;
    let boss: BossChicken | null = null;
    let playerBullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];
    let enemies: ChickenEnemy[] = [];
    let meteors: Meteor[] = [];
    let powerups: PowerUpItem[] = [];
    let particles: RichParticle[] = [];
    let shockwaves: ShockwaveRing[] = [];
    let floatingTexts: FloatingText[] = [];

    const createBurstParticles = (
      x: number,
      y: number,
      color: string,
      count: number,
      kind: 'feather' | 'rock' | 'spark' | 'smoke' = 'spark'
    ) => {
      for (let i = 0; i < count; i++) {
        particles.push(new RichParticle(x, y, color, kind));
      }
    };

    const createShockwave = (
      x: number,
      y: number,
      color: string,
      maxRadius = 60
    ) => {
      shockwaves.push(new ShockwaveRing(x, y, color, maxRadius));
    };

    const addFloatingText = (
      x: number,
      y: number,
      text: string,
      color: string
    ) => {
      floatingTexts.push(new FloatingText(x, y, text, color));
    };

    const showCenterBanner = (
      title: string,
      subtitle: string,
      borderColor = '#fbbf24',
      duration = 2200
    ) => {
      if (bannerTimeoutId) window.clearTimeout(bannerTimeoutId);
      setBanner({ title, subtitle, borderColor });
      bannerTimeoutId = window.setTimeout(() => setBanner(null), duration);
    };

    const syncHud = () => {
      setHud({
        score: state.score,
        highScore: state.highScore,
        level: state.currentLevel,
        hp: player ? player.hp : SHIPS[state.selectedShipId].maxHp,
        maxHp: player ? player.maxHp : SHIPS[state.selectedShipId].maxHp,
        shield: player ? player.shield : false,
        weaponTier: player ? player.weaponTier : state.startingWeaponTier,
        enemiesKilled: state.enemiesKilled,
        killsRequired: state.killsRequiredForBoss,
        bossActive: Boolean(boss),
        bossLevel: boss ? boss.level : state.currentLevel,
        bossHp: boss ? boss.hp : 0,
        bossMaxHp: boss ? boss.maxHp : 1,
      });
    };

    const initStarfield = () => {
      stars = [];
      nebulae = [];
      for (let i = 0; i < 110; i++) {
        stars.push({
          x: Math.random() * state.gameWidth,
          y: Math.random() * state.gameHeight,
          size: Math.random() * 2.2 + 0.5,
          speed: Math.random() * 2.8 + 0.4,
        });
      }
      for (let i = 0; i < 4; i++) {
        nebulae.push({
          x: Math.random() * state.gameWidth,
          y: Math.random() * state.gameHeight,
          r: 140 + Math.random() * 120,
          color:
            i % 2 === 0
              ? 'rgba(6, 182, 212, 0.06)'
              : 'rgba(147, 51, 234, 0.06)',
          speed: 0.35 + Math.random() * 0.25,
        });
      }
    };

    const drawBackground = () => {
      nebulae.forEach((n) => {
        const grad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        if (
          state.gameState === 'PLAYING' ||
          state.gameState === 'BOSS_FIGHT' ||
          state.gameState === 'TRANSITION'
        ) {
          n.y += n.speed;
          if (n.y - n.r > state.gameHeight) {
            n.y = -n.r;
            n.x = Math.random() * state.gameWidth;
          }
        }
      });

      ctx.fillStyle = '#ffffff';
      stars.forEach((s) => {
        ctx.globalAlpha = Math.min(1, s.size / 2.2);
        ctx.fillRect(s.x, s.y, s.size, s.size);
        if (
          state.gameState === 'PLAYING' ||
          state.gameState === 'BOSS_FIGHT' ||
          state.gameState === 'TRANSITION'
        ) {
          s.y += s.speed * (state.gameState === 'BOSS_FIGHT' ? 1.8 : 1);
          if (s.y > state.gameHeight) {
            s.y = 0;
            s.x = Math.random() * state.gameWidth;
          }
        }
      });
      ctx.globalAlpha = 1.0;
    };

    const damagePlayer = (amount: number) => {
      if (!player || player.isHit) return;
      if (player.shield) {
        player.shield = false;
        player.isHit = true;
        player.hitTimer = 950;
        state.screenShake = 8;
        soundFX.playDamage(true);
        createShockwave(player.x, player.y, '#00f3ff', 75);
        createBurstParticles(player.x, player.y, '#00f3ff', 28, 'spark');
        addFloatingText(
          player.x,
          player.y - 25,
          'KHIÊN CHẶN SÁT THƯƠNG!',
          '#00f3ff'
        );
        syncHud();
        return;
      }

      player.hp -= amount;
      player.isHit = true;
      player.hitTimer = 1100;
      state.screenShake = 12;
      soundFX.playDamage(false);

      if (player.weaponTier > 1) {
        player.weaponTier--;
        state.startingWeaponTier = player.weaponTier;
        setStartingWeaponTier(player.weaponTier);
        addFloatingText(player.x, player.y - 32, '-1 CẤP ĐẠN', '#fb7185');
      }

      createBurstParticles(player.x, player.y, '#ff2a6d', 30, 'spark');
      createShockwave(player.x, player.y, '#ff2a6d', 60);
      syncHud();

      if (player.hp <= 0) {
        player.hp = 0;
        syncHud();
        endGame(false);
      }
    };

    const healPlayer = (baseAmount: number) => {
      if (!player) return;
      const actualHeal = Math.round(baseAmount * player.healBonus);
      player.hp = Math.min(player.maxHp, player.hp + actualHeal);
      addFloatingText(player.x, player.y - 28, `+${actualHeal} HP`, '#34d399');
      syncHud();
    };

    const transitionToNextLevel = () => {
      state.gameState = 'TRANSITION';
      setGameState('TRANSITION');
      state.enemiesKilled = 0;
      state.killsRequiredForBoss = 12 + state.currentLevel * 4;

      if (player) {
        healPlayer(40);
        if (SHIPS[player.shipId].autoShieldPerLevel) {
          player.shield = true;
          addFloatingText(
            player.x,
            player.y - 45,
            'TITAN TỰ BẬT KHIÊN MỚI!',
            '#fbbf24'
          );
        }
      }
      syncHud();

      showCenterBanner(
        `VƯỢT QUA CẤP ĐỘ ${state.currentLevel - 1}!`,
        `Chuẩn bị bước vào Cấp Độ ${state.currentLevel} / ${MAX_LEVEL}...`,
        '#34d399',
        2600
      );
      if (transitionTimeoutId) window.clearTimeout(transitionTimeoutId);
      transitionTimeoutId = window.setTimeout(() => {
        if (state.gameState === 'TRANSITION') {
          state.gameState = 'PLAYING';
          setGameState('PLAYING');
        }
      }, 2600);
    };

    const endGame = (victory: boolean) => {
      cancelAnimationFrame(animationId);
      state.gameState = victory ? 'VICTORY' : 'GAMEOVER';
      setGameState(state.gameState);
      boss = null;
      syncHud();
    };

    const checkCollisions = () => {
      if (!player) return;

      playerBullets.forEach((b) => {
        if (b.markedForDeletion) return;

        if (
          boss &&
          b.x > boss.x - boss.width / 2 &&
          b.x < boss.x + boss.width / 2 &&
          b.y > boss.y - boss.height / 2 &&
          b.y < boss.y + boss.height / 2
        ) {
          if (!b.hitIds.has(boss.uid)) {
            b.hitIds.add(boss.uid);
            b.pierceLeft--;
            if (b.pierceLeft <= 0) b.markedForDeletion = true;
            if (b.slowEffect) boss.applySlow();
            createBurstParticles(b.x, b.y, '#ffffff', 4, 'feather');
            createBurstParticles(b.x, b.y, b.color, 4, 'spark');
            boss.hp -= b.damage;
            syncHud();
            if (boss.hp <= 0) {
              boss.hp = 0;
              state.screenShake = 20;
              soundFX.playEnemyDown(true);
              createShockwave(boss.x, boss.y, '#fbbf24', 180);
              createBurstParticles(boss.x, boss.y, '#ffffff', 55, 'feather');
              createBurstParticles(boss.x, boss.y, '#fbbf24', 45, 'spark');
              state.score += boss.level * 1200;
              if (state.score > state.highScore) {
                state.highScore = state.score;
                localStorage.setItem(
                  'space_chicken_highscore_v2',
                  String(state.highScore)
                );
              }
              boss = null;
              syncHud();
              if (state.currentLevel >= MAX_LEVEL) {
                endGame(true);
              } else {
                state.currentLevel++;
                transitionToNextLevel();
              }
            }
          }
          return;
        }

        enemies.forEach((e) => {
          if (
            !e.markedForDeletion &&
            !b.hitIds.has(e.uid) &&
            Math.hypot(b.x - e.x, b.y - e.y) < e.width / 2 + b.radius
          ) {
            b.hitIds.add(e.uid);
            b.pierceLeft--;
            if (b.pierceLeft <= 0) b.markedForDeletion = true;
            e.hp -= b.damage;
            if (b.slowEffect) e.applySlow();
            createBurstParticles(b.x, b.y, e.featherColor, 4, 'feather');
            createBurstParticles(b.x, b.y, b.color, 3, 'spark');

            if (e.hp <= 0) {
              e.markedForDeletion = true;
              state.score += e.maxHp > 35 ? 60 : 30;
              state.enemiesKilled++;
              soundFX.playEnemyDown(false);
              if (state.score > state.highScore) {
                state.highScore = state.score;
                localStorage.setItem(
                  'space_chicken_highscore_v2',
                  String(state.highScore)
                );
              }
              createBurstParticles(e.x, e.y, e.featherColor, 18, 'feather');
              createBurstParticles(e.x, e.y, '#f59e0b', 10, 'spark');
              createShockwave(e.x, e.y, '#fde047', 42);
              if (Math.random() < 0.14) {
                powerups.push(new PowerUpItem(e.x, e.y));
              }
              syncHud();
            }
          }
        });

        meteors.forEach((m) => {
          if (
            !m.markedForDeletion &&
            !b.hitIds.has(m.uid) &&
            Math.hypot(b.x - m.x, b.y - m.y) < m.radius + b.radius
          ) {
            b.hitIds.add(m.uid);
            b.pierceLeft--;
            if (b.pierceLeft <= 0) b.markedForDeletion = true;
            m.hp -= b.damage;
            if (b.slowEffect) m.applySlow();
            createBurstParticles(b.x, b.y, '#a8a29e', 5, 'rock');
            createBurstParticles(b.x, b.y, '#f97316', 4, 'spark');

            if (m.hp <= 0) {
              m.markedForDeletion = true;
              state.score += 45;
              state.enemiesKilled++;
              state.screenShake = 5;
              soundFX.playEnemyDown(true);
              if (state.score > state.highScore) {
                state.highScore = state.score;
                localStorage.setItem(
                  'space_chicken_highscore_v2',
                  String(state.highScore)
                );
              }
              createBurstParticles(m.x, m.y, '#78716c', 18, 'rock');
              createBurstParticles(m.x, m.y, '#ea580c', 16, 'spark');
              createShockwave(m.x, m.y, '#f97316', 55);
              if (Math.random() < 0.18) {
                powerups.push(new PowerUpItem(m.x, m.y));
              }
              syncHud();
            }
          }
        });
      });

      enemyBullets.forEach((eb) => {
        if (
          !eb.markedForDeletion &&
          player &&
          !player.isHit &&
          Math.hypot(eb.x - player.x, eb.y - player.y) < 20 + eb.radius
        ) {
          eb.markedForDeletion = true;
          createBurstParticles(eb.x, eb.y, '#fde047', 12, 'spark');
          damagePlayer(eb.damage);
        }
      });

      if (!player.isHit) {
        enemies.forEach((e) => {
          if (
            !e.markedForDeletion &&
            player &&
            Math.hypot(player.x - e.x, player.y - e.y) < e.width / 2 + 18
          ) {
            e.markedForDeletion = true;
            createBurstParticles(e.x, e.y, e.featherColor, 20, 'feather');
            damagePlayer(22);
          }
        });

        meteors.forEach((m) => {
          if (
            !m.markedForDeletion &&
            player &&
            Math.hypot(player.x - m.x, player.y - m.y) < m.radius + 18
          ) {
            m.markedForDeletion = true;
            createBurstParticles(m.x, m.y, '#78716c', 22, 'rock');
            createShockwave(m.x, m.y, '#f97316', 60);
            damagePlayer(28);
          }
        });

        if (
          boss &&
          player.x > boss.x - boss.width / 2 &&
          player.x < boss.x + boss.width / 2 &&
          player.y > boss.y - boss.height / 2 &&
          player.y < boss.y + boss.height / 2
        ) {
          damagePlayer(32);
          player.y = Math.min(state.gameHeight - 40, player.y + 55);
        }
      }

      powerups.forEach((pu) => {
        if (
          !pu.markedForDeletion &&
          player &&
          Math.hypot(player.x - pu.x, player.y - pu.y) < pu.radius + 24
        ) {
          pu.markedForDeletion = true;
          soundFX.playPowerUp();
          createShockwave(pu.x, pu.y, pu.color, 45);
          createBurstParticles(pu.x, pu.y, pu.color, 15, 'spark');

          if (pu.type === 'U') {
            if (player.weaponTier < 10) {
              player.weaponTier++;
              state.startingWeaponTier = player.weaponTier;
              setStartingWeaponTier(player.weaponTier);
              addFloatingText(
                player.x,
                player.y - 28,
                `NÂNG ĐẠN CẤP ${player.weaponTier}!`,
                '#facc15'
              );
            } else {
              state.score += 200;
              addFloatingText(
                player.x,
                player.y - 28,
                'ĐẠN TỐI ĐA! +200 ĐIỂM',
                '#facc15'
              );
            }
            state.score += 100;
          } else if (pu.type === 'H') {
            healPlayer(30);
            state.score += 60;
          } else if (pu.type === 'S') {
            player.shield = true;
            state.score += 60;
            addFloatingText(
              player.x,
              player.y - 28,
              'BẬT KHIÊN BẢO VỆ!',
              '#00f3ff'
            );
          }
          if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem(
              'space_chicken_highscore_v2',
              String(state.highScore)
            );
          }
          syncHud();
        }
      });
    };

    const spawnEntities = () => {
      if (state.gameState !== 'PLAYING') return;

      if (state.enemiesKilled < state.killsRequiredForBoss) {
        const chickenInterval = Math.max(24, 72 - state.currentLevel * 4);
        if (state.frameCount % chickenInterval === 0) {
          enemies.push(new ChickenEnemy(state.currentLevel, state.gameWidth));
        }
        const meteorInterval = Math.max(55, 135 - state.currentLevel * 7);
        if (state.frameCount % meteorInterval === 0) {
          meteors.push(new Meteor(state.currentLevel, state.gameWidth));
        }
      } else if (enemies.length === 0 && meteors.length === 0) {
        state.gameState = 'BOSS_FIGHT';
        setGameState('BOSS_FIGHT');
        soundFX.playBossAlert();
        showCenterBanner(
          `CẢNH BÁO TRÙM CẤP ${state.currentLevel}!`,
          'GÀ CHÚA VŨ TRỤ ĐANG TIẾN VÀO CHIẾN TRƯỜNG',
          '#f43f5e',
          2100
        );
        if (bossSpawnTimeoutId) window.clearTimeout(bossSpawnTimeoutId);
        bossSpawnTimeoutId = window.setTimeout(() => {
          if (state.gameState === 'BOSS_FIGHT') {
            boss = new BossChicken(state.currentLevel, state.gameWidth);
            syncHud();
          }
        }, 2000);
      }
    };

    const gameLoop = () => {
      if (
        state.gameState !== 'PLAYING' &&
        state.gameState !== 'BOSS_FIGHT' &&
        state.gameState !== 'TRANSITION'
      ) {
        return;
      }

      ctx.save();
      if (state.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * state.screenShake,
          (Math.random() - 0.5) * state.screenShake
        );
        state.screenShake *= 0.85;
        if (state.screenShake < 0.5) state.screenShake = 0;
      }

      ctx.clearRect(0, 0, state.gameWidth, state.gameHeight);
      drawBackground();

      if (player) {
        player.update(
          state.gameWidth,
          state.gameHeight,
          state.isPointerActive,
          state.pointerX,
          state.pointerY,
          state.keys,
          state.selectedAmmoId,
          playerBullets
        );
        player.draw(ctx);
      }

      if (boss) {
        boss.update(state.gameWidth, enemyBullets, (bx, by) => {
          createShockwave(bx, by, '#ff2a6d', 130);
          addFloatingText(bx, by, 'GÀ CHÚA NỔI GIẬN!', '#ff2a6d');
        });
        boss.draw(ctx);
      }

      playerBullets.forEach((b) => {
        b.update(state.gameWidth, state.gameHeight);
        b.draw(ctx);
      });
      enemyBullets.forEach((eb) => {
        eb.update(state.gameWidth, state.gameHeight);
        eb.draw(ctx);
      });
      enemies.forEach((e) => {
        e.update(
          state.gameWidth,
          state.gameHeight,
          state.currentLevel,
          enemyBullets
        );
        e.draw(ctx);
      });
      meteors.forEach((m) => {
        m.update(state.gameHeight, state.frameCount, particles);
        m.draw(ctx);
      });
      powerups.forEach((p) => {
        p.update(state.gameHeight);
        p.draw(ctx);
      });
      particles.forEach((pt) => {
        pt.update();
        pt.draw(ctx);
      });
      shockwaves.forEach((sw) => {
        sw.update();
        sw.draw(ctx);
      });
      floatingTexts.forEach((ft) => {
        ft.update();
        ft.draw(ctx);
      });

      playerBullets = playerBullets.filter((b) => !b.markedForDeletion);
      enemyBullets = enemyBullets.filter((eb) => !eb.markedForDeletion);
      enemies = enemies.filter((e) => !e.markedForDeletion);
      meteors = meteors.filter((m) => !m.markedForDeletion);
      powerups = powerups.filter((p) => !p.markedForDeletion);
      particles = particles.filter((pt) => pt.life > 0);
      shockwaves = shockwaves.filter((sw) => sw.life > 0);
      floatingTexts = floatingTexts.filter((ft) => ft.life > 0);

      if (state.gameState !== 'TRANSITION') {
        checkCollisions();
        spawnEntities();
      }

      ctx.restore();
      state.frameCount++;
      animationId = requestAnimationFrame(gameLoop);
    };

    const resizeCanvas = () => {
      const rect = stageContainer.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      state.gameWidth = canvas.width;
      state.gameHeight = canvas.height;
      if (stars.length === 0) initStarfield();
      if (state.gameState === 'START' || state.gameState === 'PAUSED') {
        ctx.clearRect(0, 0, state.gameWidth, state.gameHeight);
        drawBackground();
        if (player) player.draw(ctx);
      }
    };

    const controls = {
      selectShipLive: (shipId: ShipId) => {
        state.selectedShipId = shipId;
        setSelectedShipId(shipId);
        if (player) {
          player.applyShipConfig(shipId, false);
          addFloatingText(
            player.x,
            player.y - 35,
            `CHIẾN CƠ: ${SHIPS[shipId].shortName.toUpperCase()}`,
            SHIPS[shipId].primaryColor
          );
          createShockwave(player.x, player.y, SHIPS[shipId].primaryColor, 55);
        }
        syncHud();
      },
      selectAmmoLive: (ammoId: AmmoId) => {
        state.selectedAmmoId = ammoId;
        setSelectedAmmoId(ammoId);
        if (
          player &&
          (state.gameState === 'PLAYING' || state.gameState === 'BOSS_FIGHT')
        ) {
          addFloatingText(
            player.x,
            player.y - 30,
            AMMO_TYPES[ammoId].name.toUpperCase(),
            AMMO_TYPES[ammoId].color
          );
        }
        syncHud();
      },
      adjustTierLive: (delta: number) => {
        const current = player ? player.weaponTier : state.startingWeaponTier;
        const next = Math.max(1, Math.min(10, current + delta));
        state.startingWeaponTier = next;
        setStartingWeaponTier(next);
        if (player) player.weaponTier = next;
        syncHud();
      },
      setTierDirectly: (tier: number) => {
        const next = Math.max(1, Math.min(10, tier));
        state.startingWeaponTier = next;
        setStartingWeaponTier(next);
        if (player) player.weaponTier = next;
        syncHud();
      },
      startNewCampaign: () => {
        cancelAnimationFrame(animationId);
        if (bossSpawnTimeoutId) window.clearTimeout(bossSpawnTimeoutId);
        if (transitionTimeoutId) window.clearTimeout(transitionTimeoutId);
        resizeCanvas();

        player = new Player(
          state.selectedShipId,
          state.startingWeaponTier,
          state.gameWidth,
          state.gameHeight
        );
        boss = null;
        playerBullets = [];
        enemyBullets = [];
        enemies = [];
        meteors = [];
        powerups = [];
        particles = [];
        shockwaves = [];
        floatingTexts = [];

        state.score = 0;
        state.currentLevel = 1;
        state.enemiesKilled = 0;
        state.killsRequiredForBoss = 14;
        state.frameCount = 0;
        state.isPointerActive = false;

        setHasActiveCampaign(true);
        setShowHangarModal(false);
        state.gameState = 'PLAYING';
        setGameState('PLAYING');
        syncHud();
        gameLoop();
      },
      togglePause: () => {
        if (
          state.gameState === 'PLAYING' ||
          state.gameState === 'BOSS_FIGHT' ||
          state.gameState === 'TRANSITION'
        ) {
          state.previousPlayState = state.gameState;
          state.gameState = 'PAUSED';
          setGameState('PAUSED');
          cancelAnimationFrame(animationId);
        } else if (state.gameState === 'PAUSED') {
          setShowHangarModal(false);
          state.gameState = state.previousPlayState;
          setGameState(state.previousPlayState);
          gameLoop();
        }
      },
      openHangar: () => {
        if (
          state.gameState === 'PLAYING' ||
          state.gameState === 'BOSS_FIGHT' ||
          state.gameState === 'TRANSITION'
        ) {
          state.previousPlayState = state.gameState;
          state.gameState = 'PAUSED';
          setGameState('PAUSED');
          cancelAnimationFrame(animationId);
        }
        setShowHangarModal(true);
      },
      resumeFromHangar: () => {
        if (state.gameState === 'PAUSED') {
          setShowHangarModal(false);
          state.gameState = state.previousPlayState;
          setGameState(state.previousPlayState);
          gameLoop();
        }
      },
    };

    engineRef.current = controls;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (Object.prototype.hasOwnProperty.call(state.keys, e.key)) {
        state.keys[e.key] = true;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        controls.selectAmmoLive(Number(e.key) as AmmoId);
      }
      if (e.key === 'p' || e.key === 'P') controls.togglePause();
      if (e.key === 'h' || e.key === 'H') controls.openHangar();
      if (e.key === 'm' || e.key === 'M') {
        soundFX.enabled = !soundFX.enabled;
        setSoundEnabled(soundFX.enabled);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (Object.prototype.hasOwnProperty.call(state.keys, e.key)) {
        state.keys[e.key] = false;
      }
    };

    const updatePointerCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      state.pointerX = clientX - rect.left;
      state.pointerY = clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      state.isPointerActive = true;
      updatePointerCoords(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (state.isPointerActive) updatePointerCoords(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      state.isPointerActive = false;
    };
    const handleTouchStart = (e: TouchEvent) => {
      state.isPointerActive = true;
      if (e.touches[0]) {
        updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (state.isPointerActive && e.touches[0]) {
        updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    };
    const handleTouchEnd = () => {
      state.isPointerActive = false;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    resizeCanvas();
    syncHud();

    return () => {
      cancelAnimationFrame(animationId);
      if (bannerTimeoutId) window.clearTimeout(bannerTimeoutId);
      if (bossSpawnTimeoutId) window.clearTimeout(bossSpawnTimeoutId);
      if (transitionTimeoutId) window.clearTimeout(transitionTimeoutId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const currentShip = SHIPS[selectedShipId];
  const hpPercentage = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const bossHpPercentage = Math.max(
    0,
    Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100)
  );

  const stateLabel =
    gameState === 'START'
      ? 'SẴN SÀNG'
      : gameState === 'PLAYING'
        ? 'ĐANG CHIẾN ĐẤU'
        : gameState === 'BOSS_FIGHT'
          ? 'ĐÁNH TRÙM'
          : gameState === 'TRANSITION'
            ? `QUA MÀN ${hud.level}`
            : gameState === 'PAUSED'
              ? 'TẠM DỪNG'
              : gameState === 'VICTORY'
                ? 'CHIẾN THẮNG'
                : 'THẤT BẠI';

  return (
    <div
      id="cockpit-wrapper"
      className="flex flex-row w-screen h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 65% 50%, #09122c 0%, #030612 100%)',
      }}
    >
      {/* 1. CỘT CHỈ HUY BÊN TRÁI (COMMAND SIDEBAR) */}
      <aside className="w-[235px] min-w-[215px] md:w-[320px] md:min-w-[280px] md:max-w-[340px] h-screen flex flex-col justify-between p-2 md:px-3 md:py-2.5 z-30 overflow-y-auto border-r-2 border-cyan-400/30 bg-slate-950/95 shadow-2xl">
        <div>
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2 gap-2">
            <h2 className="font-display font-extrabold text-xs md:text-sm tracking-wider text-cyan-300 whitespace-nowrap shrink-0">
              BUỒNG LÁI CHỈ HUY
            </h2>
            <span className="text-[11px] font-display font-bold text-cyan-300 whitespace-nowrap shrink-0">
              {stateLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                ĐIỂM SỐ
              </div>
              <div className="font-display font-extrabold text-sm text-cyan-300 tabular-nums truncate">
                {hud.score.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                KỶ LỤC
              </div>
              <div className="font-display font-extrabold text-sm text-amber-300 tabular-nums truncate">
                {hud.highScore.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                CẤP ĐỘ
              </div>
              <div className="font-display font-extrabold text-sm text-emerald-300 tabular-nums whitespace-nowrap">
                {hud.level} / {MAX_LEVEL}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 mb-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-emerald-300 whitespace-nowrap">
                NĂNG LƯỢNG (HP)
              </span>
              <span className="font-display font-bold text-white tabular-nums whitespace-nowrap">
                {Math.ceil(hud.hp)} / {hud.maxHp}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 border border-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className={
                  hpPercentage > 32
                    ? 'h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-150'
                    : 'h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-150'
                }
                style={{ width: `${hpPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/90">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">KHIÊN:</span>
                <span
                  className={`font-display font-bold ${
                    hud.shield ? 'text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  {hud.shield ? 'ĐANG BẬT' : 'TẮT'}
                </span>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-slate-400">TRÙM:</span>
                <span className="font-display font-bold text-amber-300 ml-1">
                  {hud.bossActive
                    ? 'ĐÁNH TRÙM'
                    : `${Math.min(hud.enemiesKilled, hud.killsRequired)}/${hud.killsRequired}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Ô Chọn Nhanh Chiến Cơ */}
        <div className="my-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-display font-bold text-cyan-300 tracking-wider whitespace-nowrap">
              4 CHIẾN CƠ (ĐỔI TRỰC TIẾP)
            </span>
            <span className="text-[11px] text-sky-300 font-semibold truncate">
              {currentShip.shortName}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(SHIPS).map((ship) => {
              const isSelected = ship.id === selectedShipId;
              return (
                <button
                  key={ship.id}
                  type="button"
                  onClick={() => engineRef.current?.selectShipLive(ship.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.28)]'
                      : 'bg-slate-900/75 border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="font-display font-bold text-xs text-white truncate whitespace-nowrap">
                    {ship.shortName}
                  </div>
                  <div className="text-[10px] text-cyan-300 tabular-nums truncate whitespace-nowrap mt-0.5">
                    {ship.maxHp} HP · {ship.statsSummary[1]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Ô Chọn Nhanh Loại Đạn */}
        <div className="my-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-display font-bold text-amber-300 tracking-wider whitespace-nowrap">
              4 LOẠI ĐẠN (PHÍM 1–4)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Giảm cấp đạn"
                onClick={() => engineRef.current?.adjustTierLive(-1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-cyan-300 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-[11px] font-display font-extrabold text-yellow-300 px-1 tabular-nums whitespace-nowrap">
                CẤP {hud.weaponTier}/10
              </span>
              <button
                type="button"
                title="Tăng cấp đạn"
                onClick={() => engineRef.current?.adjustTierLive(1)}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-cyan-300 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(AMMO_TYPES).map((ammo) => {
              const isSelected = ammo.id === selectedAmmoId;
              return (
                <button
                  key={ammo.id}
                  type="button"
                  onClick={() => engineRef.current?.selectAmmoLive(ammo.id)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                      : 'bg-slate-900/75 border-slate-800 hover:border-amber-400/50'
                  }`}
                >
                  <span className="w-5 h-5 rounded bg-slate-800 border border-amber-400/50 text-[10px] font-display font-extrabold text-amber-300 flex items-center justify-center shrink-0 tabular-nums">
                    {ammo.key}
                  </span>
                  <span className="font-display font-bold text-xs text-white truncate whitespace-nowrap">
                    {ammo.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nút điều khiển nhanh dưới cùng */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => engineRef.current?.openHangar()}
            className="w-full py-2 px-3 rounded-lg font-display font-bold text-xs bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            XƯỞNG CHIẾN CƠ & CÀI ĐẶT (H)
          </button>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => engineRef.current?.togglePause()}
              className="py-1.5 px-2 rounded-lg font-display font-bold text-[11px] bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 transition-colors cursor-pointer whitespace-nowrap truncate"
            >
              {gameState === 'PAUSED' ? 'TIẾP TỤC (P)' : 'TẠM DỪNG (P)'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.enabled = !soundFX.enabled;
                setSoundEnabled(soundFX.enabled);
              }}
              className="py-1.5 px-2 rounded-lg font-display font-bold text-[11px] bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer whitespace-nowrap truncate"
            >
              ÂM: {soundEnabled ? 'BẬT' : 'TẮT'}
            </button>
            <button
              type="button"
              onClick={() => engineRef.current?.startNewCampaign()}
              className="py-1.5 px-2 rounded-lg font-display font-bold text-[11px] bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer whitespace-nowrap truncate"
            >
              CHƠI LẠI
            </button>
          </div>
        </div>
      </aside>

      {/* 2. CHIẾN TRƯỜNG KHÔNG GIAN CHIỀU NGANG BÊN PHẢI */}
      <main
        ref={stageRef}
        className="flex-1 relative h-screen overflow-hidden bg-[#02040a]"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {hud.bossActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[82%] max-w-2xl bg-slate-950/90 border-2 border-rose-500/80 rounded-xl px-4 py-2.5 shadow-[0_0_25px_rgba(244,63,94,0.45)] z-20 pointer-events-none">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-display font-extrabold text-sm md:text-base text-rose-400 tracking-wider">
                GÀ CHÚA VŨ TRỤ · CẤP {hud.bossLevel}
              </span>
              <span className="font-display font-bold text-xs text-amber-300 tabular-nums">
                {Math.ceil(hud.bossHp)} / {hud.bossMaxHp} HP
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-900 border border-rose-500/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-100"
                style={{ width: `${bossHpPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="absolute top-3 right-4 z-10 pointer-events-none hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span>
            Di chuyển:{' '}
            <strong className="text-cyan-300">WASD / Chuột / Chạm</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Đổi đạn: <strong className="text-amber-300">Phím 1–4</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Tạm dừng: <strong className="text-emerald-300">P</strong>
          </span>
        </div>

        {banner && (
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-25 pointer-events-none w-[88%]">
            <div
              className="inline-block bg-slate-950/95 border-2 px-8 py-4 rounded-2xl shadow-2xl"
              style={{ borderColor: banner.borderColor }}
            >
              <div className="font-display font-extrabold text-2xl md:text-3xl text-amber-300 tracking-wider">
                {banner.title}
              </div>
              <div className="text-sm md:text-base text-slate-200 mt-1 font-semibold">
                {banner.subtitle}
              </div>
            </div>
          </div>
        )}

        <StageModals
          showHangarModal={showHangarModal}
          gameState={gameState}
          hasActiveCampaign={hasActiveCampaign}
          selectedShipId={selectedShipId}
          selectedAmmoId={selectedAmmoId}
          startingWeaponTier={startingWeaponTier}
          score={hud.score}
          highScore={hud.highScore}
          level={hud.level}
          maxLevel={MAX_LEVEL}
          onSelectShip={(id) => engineRef.current?.selectShipLive(id)}
          onSelectAmmo={(id) => engineRef.current?.selectAmmoLive(id)}
          onChangeTier={(t) => engineRef.current?.setTierDirectly(t)}
          onStartCampaign={() => engineRef.current?.startNewCampaign()}
          onResumeFromHangar={() => engineRef.current?.resumeFromHangar()}
          onTogglePause={() => engineRef.current?.togglePause()}
          onOpenHangar={() => engineRef.current?.openHangar()}
        />
      </main>
    </div>
  );
}
