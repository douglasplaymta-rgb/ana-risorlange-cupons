import React, { useState } from 'react';
import { Award, Settings2, Sparkles, Check, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/ledger';

interface BrandHeaderProps {
  couponThreshold: number;
  totalNotesCount: number;
  onChangeThreshold: (newThreshold: number) => void;
  onClearAllData: () => void;
}

/**
 * Símbolo Oficial do Supermercado Ana Risorlange:
 * Carrinho azul com duas rodas e a estrela laranja estilizada no centro com haste estendida à esquerda.
 */
export const AnaRisorlangeCartStarLogo: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 200 175"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Logótipo Oficial Supermercado Ana Risorlange - Carrinho Azul e Estrela Laranja"
  >
    <defs>
      <linearGradient id="cartBlueGrad" x1="30" y1="45" x2="175" y2="145" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1B56B5" />
        <stop offset="100%" stopColor="#0E387A" />
      </linearGradient>
      <linearGradient id="starOrangeGrad" x1="25" y1="15" x2="150" y2="115" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>

    {/* Cesto Azul do Carrinho (Formato em U arredondado com puxador superior direito fiel ao logo) */}
    <path
      d="M42 62 L57 118 C61 132 72 140 88 140 L122 140 C138 140 149 132 153 118 L170 54 C172 47 177 45 184 45"
      stroke="url(#cartBlueGrad)"
      strokeWidth="17"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Contorno de luz sutil para destacar no fundo azul-escuro */}
    <path
      d="M42 62 L57 118 C61 132 72 140 88 140 L122 140 C138 140 149 132 153 118 L170 54 C172 47 177 45 184 45"
      stroke="#60A5FA"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.45"
    />

    {/* Duas Rodas Azuis Inferiores */}
    <circle cx="84" cy="161" r="10.5" fill="#164B9E" stroke="#60A5FA" strokeWidth="2" />
    <circle cx="126" cy="161" r="10.5" fill="#164B9E" stroke="#60A5FA" strokeWidth="2" />

    {/* Estrela Laranja Oficial dentro do Carrinho (com braço esquerdo estendido e traço contínuo) */}
    <path
      d="M22 47 H88 L104 14 L120 47 H156 L128 71 L139 109 L104 88 L69 109 L80 71 H56"
      stroke="url(#starOrangeGrad)"
      strokeWidth="15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Emblema Completo Oficial da Marca (Ícone Carrinho + Estrela + Tipografia Ana SUPERMERCADO Risorlange)
 */
export const OfficialBrandEmblemCard: React.FC = () => (
  <div className="relative shrink-0 rounded-2xl bg-[#040D1F] border-2 border-[#F97316]/70 shadow-[0_0_28px_rgba(249,115,22,0.28)] px-3.5 py-2 flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02]">
    <AnaRisorlangeCartStarLogo className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
    <div className="pr-1 select-none">
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display font-extrabold text-lg sm:text-xl text-[#2563EB] tracking-tight">
          Ana
        </span>
        <span className="font-display font-extrabold text-[9px] sm:text-[10px] uppercase tracking-widest text-[#F97316]">
          SUPERMERCADO
        </span>
      </div>
      <div className="font-display font-extrabold text-xl sm:text-2xl text-[#1D4ED8] tracking-tight leading-none -mt-0.5">
        Risorlange
      </div>
      <div className="text-[9px] sm:text-[10px] text-slate-300/90 tracking-wide mt-1 font-medium">
        Trazendo o melhor para você
      </div>
    </div>
  </div>
);

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  couponThreshold,
  totalNotesCount,
  onChangeThreshold,
  onClearAllData,
}) => {
  const [showRulePopover, setShowRulePopover] = useState(false);
  const [confirmClearInHeader, setConfirmClearInHeader] = useState(false);
  const presetThresholds = [50, 100, 150, 200];

  return (
    <header className="relative overflow-visible bg-gradient-to-r from-[#061533] via-[#0B224C] to-[#103D8C] text-white border-b-4 border-[#F97316] shadow-lg">
      {/* Textura decorativa luminosa nas cores da marca */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F97316]/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Bloco Principal: Logótipo Oficial + Título e Subtítulo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5">
            {/* Emblema Oficial com o Logo do Supermercado Ana Risorlange */}
            <OfficialBrandEmblemCard />

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F97316] text-white shadow-sm">
                  <Award className="w-3 h-3" />
                  Rede Parceria
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-blue-100 border border-white/15">
                  <Sparkles className="w-3 h-3 text-[#FDBA74]" />
                  Gestão de Cupões da Promoção
                </span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Supermercado{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-[#FDBA74]">
                  Ana Risorlange
                </span>
              </h1>

              <p className="text-xs sm:text-sm font-medium text-blue-200/95 italic flex items-center gap-2 mt-0.5">
                <span>“Trazendo o melhor para você”</span>
              </p>
            </div>
          </div>

          {/* Bloco Direito: Regra Oficial do Cupão (R$ 100,00 = 1 Cupão) */}
          <div className="flex items-center justify-between lg:justify-end gap-2.5 pt-2.5 lg:pt-0 border-t border-white/10 lg:border-t-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRulePopover((prev) => !prev);
                  setConfirmClearInHeader(false);
                }}
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#05132B]/90 hover:bg-[#05132B] border-2 border-[#F97316]/80 shadow-md transition-all text-left cursor-pointer group"
                title="Regra de cálculo dos cupões da promoção"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-blue-200 font-bold">
                    Regra Oficial do Cupom
                  </span>
                  <span className="font-mono-num text-xs sm:text-sm font-extrabold text-white">
                    {formatCurrency(couponThreshold)} ={' '}
                    <span className="text-[#FDBA74] underline decoration-[#F97316]/60">
                      1 Cupom
                    </span>
                  </span>
                </div>
              </button>

              {showRulePopover && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B224C]">
                      Regra por Cupom (R$)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRulePopover(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Valor oficial configurado em múltiplos de{' '}
                    <strong>R$ 100,00 = 1 Cupom</strong>:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {presetThresholds.map((val) => {
                      const active = couponThreshold === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            onChangeThreshold(val);
                            setShowRulePopover(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#0B224C] text-white border-[#0B224C]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#F97316]'
                          }`}
                        >
                          <span className="font-mono-num">R$ {val},00</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#F97316]" />}
                        </button>
                      );
                    })}
                  </div>

                  {totalNotesCount > 0 && (
                    <div className="pt-2.5 border-t border-slate-100">
                      {!confirmClearInHeader ? (
                        <button
                          type="button"
                          onClick={() => setConfirmClearInHeader(true)}
                          className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Limpar / Zerar todos os dados
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-rose-700 block text-center">
                            Tem certeza? Isso apagará todas as notas.
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClearAllData();
                                setConfirmClearInHeader(false);
                                setShowRulePopover(false);
                              }}
                              className="py-1.5 px-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Sim, Zerar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmClearInHeader(false)}
                              className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
