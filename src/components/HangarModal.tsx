import React, { useEffect, useRef } from 'react';
import { AMMO_TYPES, AmmoId, GameState, SHIPS, ShipId } from '../types/game';
import { drawShipHull } from '../utils/shipRenderer';

interface HangarModalProps {
  showHangarModal: boolean;
  gameState: GameState;
  hasActiveCampaign: boolean;
  selectedShipId: ShipId;
  selectedAmmoId: AmmoId;
  startingWeaponTier: number;
  score: number;
  highScore: number;
  level: number;
  maxLevel: number;
  onSelectShip: (shipId: ShipId) => void;
  onSelectAmmo: (ammoId: AmmoId) => void;
  onChangeTier: (tier: number) => void;
  onStartCampaign: () => void;
  onResumeFromHangar: () => void;
  onTogglePause: () => void;
  onOpenHangar: () => void;
}

export const StageModals: React.FC<HangarModalProps> = ({
  showHangarModal,
  gameState,
  hasActiveCampaign,
  selectedShipId,
  selectedAmmoId,
  startingWeaponTier,
  score,
  highScore,
  level,
  maxLevel,
  onSelectShip,
  onSelectAmmo,
  onChangeTier,
  onStartCampaign,
  onResumeFromHangar,
  onTogglePause,
  onOpenHangar,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentShip = SHIPS[selectedShipId];

  useEffect(() => {
    const pCanvas = previewCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.save();
    pCtx.translate(pCanvas.width / 2, pCanvas.height / 2 + 4);
    drawShipHull(pCtx, selectedShipId, 44, 52, false);
    pCtx.restore();
  }, [selectedShipId, showHangarModal]);

  if (showHangarModal) {
    return (
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40">
        <div className="w-full max-w-5xl max-h-[94vh] bg-slate-950 border border-cyan-400/50 rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col justify-between overflow-y-auto">
          {/* Tiêu đề Modal */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
            <div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-cyan-300 tracking-wide">
                CHIẾN BINH KHÔNG GIAN: XƯỞNG CHIẾN CƠ & VŨ KHÍ
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                Thiết lập Chiến Cơ, Loại Đạn và Cấp Đạn Khởi Đầu trước hoặc ngay trong trận chiến.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Buồng Lái Chiến Thuật Màn Hình Ngang
            </span>
          </div>

          {/* Bố cục 2 Cột Ngang Cân Đối */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto items-stretch">
            {/* CỘT TRÁI: CHỌN 4 LOẠI MÁY BAY */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm md:text-base text-cyan-300">
                    01. Chọn Chiến Cơ Xuất Kích
                  </h3>
                  <span className="text-xs text-slate-400">4 Mẫu Chiến Cơ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {Object.values(SHIPS).map((ship) => {
                    const isSelected = ship.id === selectedShipId;
                    return (
                      <button
                        key={ship.id}
                        type="button"
                        onClick={() => onSelectShip(ship.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/75 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.22)]'
                            : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs md:text-sm text-white whitespace-nowrap">
                            {ship.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-cyan-300 whitespace-nowrap">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2">
                          {ship.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khung Xem Trước Ngoại Hình Canvas & Chỉ Số Chiến Cơ */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <canvas
                    ref={previewCanvasRef}
                    width={96}
                    height={96}
                    className="w-24 h-24"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-base text-cyan-300">
                    {currentShip.name}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                    {currentShip.desc}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-cyan-300 font-medium">
                    {currentShip.statsSummary.map((stat, idx) => (
                      <React.Fragment key={stat}>
                        {idx > 0 && (
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                        )}
                        <span>{stat}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: CHỌN 4 LOẠI ĐẠN & CẤP ĐẠN KHỞI ĐẦU */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm md:text-base text-amber-300">
                    02. Hệ Thống Đạn & Cấp Độ Khởi Đầu
                  </h3>
                  <span className="text-xs text-slate-400">Phím tắt 1–4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {Object.values(AMMO_TYPES).map((ammo) => {
                    const isSelected = ammo.id === selectedAmmoId;
                    return (
                      <button
                        key={ammo.id}
                        type="button"
                        onClick={() => onSelectAmmo(ammo.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/65 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.22)]'
                            : 'bg-slate-950/70 border-slate-800 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs md:text-sm text-amber-300 whitespace-nowrap">
                            Phím {ammo.key} · {ammo.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1.5">
                          {ammo.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tùy chỉnh Cấp Đạn Khởi Đầu (1 đến 10) */}
              <div>
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="start-tier-slider"
                      className="font-display font-bold text-xs md:text-sm text-amber-300"
                    >
                      Tùy Chỉnh Cấp Đạn Khởi Đầu:
                    </label>
                    <span className="font-display font-extrabold text-sm md:text-base text-yellow-300 tabular-nums">
                      CẤP {startingWeaponTier} / 10
                    </span>
                  </div>
                  <input
                    id="start-tier-slider"
                    type="range"
                    min={1}
                    max={10}
                    value={startingWeaponTier}
                    onChange={(e) => onChangeTier(Number(e.target.value))}
                    className="cyber-slider mb-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-display font-bold">
                    <span>Cấp 1 (Đơn)</span>
                    <span>Cấp 3 (Ba tia)</span>
                    <span>Cấp 5 (Tỏa 5)</span>
                    <span>Cấp 8 (Siêu cấp)</span>
                    <span>Cấp 10 (Tối thượng)</span>
                  </div>
                </div>

                {/* Hướng dẫn vật phẩm tóm tắt */}
                <div className="mt-2.5 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 grid grid-cols-3 gap-2">
                  <div>
                    <strong className="text-yellow-300">(U) Nâng Đạn:</strong>{' '}
                    Tăng cấp đạn (Tối đa 10)
                  </div>
                  <div>
                    <strong className="text-emerald-300">(H) Hồi Phục:</strong>{' '}
                    Hồi HP cho chiến cơ
                  </div>
                  <div>
                    <strong className="text-cyan-300">(S) Lá Chắn:</strong>{' '}
                    Chặn 1 đòn sát thương
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nút Hành Động Cuối Modal */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 mt-4 border-t border-slate-800">
            {hasActiveCampaign && gameState === 'PAUSED' && (
              <button
                type="button"
                onClick={onResumeFromHangar}
                className="px-5 py-2.5 rounded-lg font-display font-bold text-sm bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 transition-colors cursor-pointer whitespace-nowrap"
              >
                Tiếp Tục Trận Đấu Hiện Tại
              </button>
            )}
            <button
              type="button"
              onClick={onStartCampaign}
              className="px-8 py-2.5 rounded-lg font-display font-extrabold text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-300 shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Bắt Đầu Chiến Dịch Mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'PAUSED') {
    return (
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40">
        <div className="bg-slate-950 border border-cyan-400/60 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
          <h2 className="font-display font-extrabold text-3xl text-cyan-300 mb-2">
            TẠM DỪNG TRẬN ĐẤU
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            Bạn có thể đổi Chiến Cơ hoặc Loại Đạn ngay ở Cột Chỉ Huy bên trái trước khi tiếp tục.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onTogglePause}
              className="py-3 px-4 rounded-lg font-display font-extrabold text-base bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300 cursor-pointer whitespace-nowrap"
            >
              Tiếp Tục Chiến Đấu (P)
            </button>
            <button
              type="button"
              onClick={onOpenHangar}
              className="py-2.5 px-4 rounded-lg font-display font-bold text-sm bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 cursor-pointer whitespace-nowrap"
            >
              Mở Xưởng Chiến Cơ & Cài Đặt
            </button>
            <button
              type="button"
              onClick={onStartCampaign}
              className="py-2.5 px-4 rounded-lg font-display font-bold text-sm bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 cursor-pointer whitespace-nowrap"
            >
              Chơi Lại Từ Đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
    return (
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40">
        <div className="bg-slate-950 border border-cyan-400/60 rounded-2xl p-6 max-w-xl w-full text-center shadow-2xl">
          <h2
            className={`font-display font-extrabold text-3xl md:text-4xl mb-2 ${
              gameState === 'VICTORY' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {gameState === 'VICTORY'
              ? 'CHIẾN THẮNG VĨ ĐẠI!'
              : 'CHIẾN CƠ BỊ HẠ!'}
          </h2>
          <p className="text-sm md:text-base text-slate-300 mb-5">
            {gameState === 'VICTORY'
              ? 'Chúc mừng Chỉ Huy! Bạn đã tiêu diệt toàn bộ 10 Gà Chúa Vũ Trụ!'
              : 'Hãy nâng cấp Chiến Cơ hoặc chọn Cấp Đạn Khởi Đầu cao hơn để phục thù!'}
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6">
            <div>
              <div className="text-xs text-slate-400">TỔNG ĐIỂM</div>
              <div className="font-display font-extrabold text-xl text-cyan-300 mt-1 tabular-nums">
                {score.toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">KỶ LỤC CAO NHẤT</div>
              <div className="font-display font-extrabold text-xl text-amber-300 mt-1 tabular-nums">
                {highScore.toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">CẤP ĐỘ ĐẠT ĐƯỢC</div>
              <div className="font-display font-extrabold text-xl text-emerald-300 mt-1 tabular-nums">
                {level} / {maxLevel}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onOpenHangar}
              className="px-5 py-3 rounded-lg font-display font-bold text-sm bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/40 cursor-pointer whitespace-nowrap"
            >
              Đổi Chiến Cơ & Cài Đặt
            </button>
            <button
              type="button"
              onClick={onStartCampaign}
              className="px-7 py-3 rounded-lg font-display font-extrabold text-base bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300 cursor-pointer whitespace-nowrap"
            >
              Chơi Lại Ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
