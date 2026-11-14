export type ShipId = 'falcon' | 'phantom' | 'titan' | 'valkyrie';
export type AmmoId = 1 | 2 | 3 | 4;
export type GameState =
  | 'START'
  | 'PLAYING'
  | 'BOSS_FIGHT'
  | 'TRANSITION'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'VICTORY';

export interface ShipConfig {
  id: ShipId;
  name: string;
  shortName: string;
  maxHp: number;
  speedMult: number;
  damageMult: number;
  fireRateMult: number;
  healBonus: number;
  autoShieldPerLevel: boolean;
  primaryColor: string;
  secondaryColor: string;
  desc: string;
  statsSummary: string[];
}

export interface AmmoConfig {
  id: AmmoId;
  key: string;
  name: string;
  shortName: string;
  color: string;
  coreColor: string;
  speedMult: number;
  damageMult: number;
  slowEffect: boolean;
  pierceCount: number;
  desc: string;
}

export const SHIPS: Record<ShipId, ShipConfig> = {
  falcon: {
    id: 'falcon',
    name: 'Chim Ưng Ngân Hà',
    shortName: 'Chim Ưng',
    maxHp: 100,
    speedMult: 1.0,
    damageMult: 1.0,
    fireRateMult: 1.0,
    healBonus: 1.0,
    autoShieldPerLevel: false,
    primaryColor: '#00f3ff',
    secondaryColor: '#0284c7',
    desc: 'Cân bằng toàn diện (100 HP, tốc độ bay và hỏa lực tiêu chuẩn).',
    statsSummary: ['100 HP', 'Tốc độ 100%', 'Cân bằng'],
  },
  phantom: {
    id: 'phantom',
    name: 'Bóng Ma Siêu Thanh',
    shortName: 'Bóng Ma',
    maxHp: 100,
    speedMult: 1.35,
    damageMult: 1.0,
    fireRateMult: 1.22,
    healBonus: 1.0,
    autoShieldPerLevel: false,
    primaryColor: '#e879f9',
    secondaryColor: '#9333ea',
    desc: 'Cánh ngược tàng hình, tốc độ bay cực nhanh (+35%) và tăng +22% tốc độ bắn.',
    statsSummary: ['100 HP', 'Tốc độ +35%', 'Tốc bắn +22%'],
  },
  titan: {
    id: 'titan',
    name: 'Pháo Đài Titan',
    shortName: 'Titan',
    maxHp: 160,
    speedMult: 0.86,
    damageMult: 1.25,
    fireRateMult: 0.95,
    healBonus: 1.0,
    autoShieldPerLevel: true,
    primaryColor: '#fbbf24',
    secondaryColor: '#d97706',
    desc: 'Giáp hạng nặng 160 HP, sát thương +25%, tự động có Lá Chắn Bảo Vệ khi xuất kích & mỗi khi qua màn.',
    statsSummary: ['160 HP', 'Sát thương +25%', 'Tự tạo Khiên'],
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Valkyrie Ánh Sao',
    shortName: 'Valkyrie',
    maxHp: 125,
    speedMult: 1.08,
    damageMult: 1.15,
    fireRateMult: 1.12,
    healBonus: 1.5,
    autoShieldPerLevel: false,
    primaryColor: '#34d399',
    secondaryColor: '#059669',
    desc: '125 HP, sát thương +15%, tốc độ bắn +12% và tăng +50% lượng máu hồi phục khi nhặt (H).',
    statsSummary: ['125 HP', 'Sát thương +15%', 'Tốc bắn +12%', 'Hồi máu +50%'],
  },
};

export const AMMO_TYPES: Record<AmmoId, AmmoConfig> = {
  1: {
    id: 1,
    key: '1',
    name: 'Đạn Tia Laser',
    shortName: 'Tia Laser',
    color: '#00f3ff',
    coreColor: '#ffffff',
    speedMult: 1.18,
    damageMult: 1.0,
    slowEffect: false,
    pierceCount: 1,
    desc: 'Tốc độ cao, đường đạn chuẩn xác, cân bằng trong mọi tình huống.',
  },
  2: {
    id: 2,
    key: '2',
    name: 'Cầu Nhiệt Plasma',
    shortName: 'Cầu Plasma',
    color: '#ff5500',
    coreColor: '#fde047',
    speedMult: 0.92,
    damageMult: 1.35,
    slowEffect: false,
    pierceCount: 1,
    desc: 'Quả cầu năng lượng nhiệt hạch cỡ lớn, tăng +35% sát thương mỗi phát.',
  },
  3: {
    id: 3,
    key: '3',
    name: 'Sóng Băng Từ Trường',
    shortName: 'Sóng Băng',
    color: '#38bdf8',
    coreColor: '#e0f2fe',
    speedMult: 0.96,
    damageMult: 1.05,
    slowEffect: true,
    pierceCount: 1,
    desc: 'Lưỡi sóng bán nguyệt quét rộng và làm chậm 45% tốc độ bay của gà địch.',
  },
  4: {
    id: 4,
    key: '4',
    name: 'Phi Tiêu Xuyên Phá',
    shortName: 'Xuyên Phá',
    color: '#c084fc',
    coreColor: '#f5d0fe',
    speedMult: 1.12,
    damageMult: 0.95,
    slowEffect: false,
    pierceCount: 4,
    desc: 'Đạn sao 4 cánh xoay tròn siêu tốc xuyên thấu qua nhiều mục tiêu liên tiếp.',
  },
};
