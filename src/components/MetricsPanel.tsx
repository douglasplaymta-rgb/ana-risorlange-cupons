import React from 'react';
import {
  Wallet,
  Ticket,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';
import { LedgerSummary } from '../types/coupon';
import { formatCurrency } from '../utils/ledger';

interface MetricsPanelProps {
  summary: LedgerSummary;
  totalNotesCount: number;
  onNavigateTab: (tab: 'alerta' | 'registar' | 'historico') => void;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  summary,
  totalNotesCount,
  onNavigateTab,
}) => {
  const {
    totalSpent,
    totalCoupons,
    couponsInUrna,
    couponsPending,
    pendingBalance,
    amountMissingForNextCoupon,
    progressPercentage,
    couponThreshold,
  } = summary;

  return (
    <section
      aria-label="Painel de Métricas da Promoção"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-5 relative z-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total Gasto Acumulado (R$) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(11,34,76,0.07)] flex flex-col justify-between relative overflow-hidden group hover:border-[#103D8C]/40 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0B224C]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Gasto Acumulado
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#0B224C]/10 text-[#0B224C] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#0B224C] tracking-tight">
              {formatCurrency(totalSpent)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <ReceiptText className="w-3.5 h-3.5 text-[#103D8C]" />
              {totalNotesCount}{' '}
              {totalNotesCount === 1 ? 'nota registada' : 'notas registadas'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('registar')}
              className="inline-flex items-center gap-1 font-bold text-[#103D8C] hover:text-[#F97316] transition-colors cursor-pointer"
            >
              + Nova nota
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Total de Cupons Gerados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(11,34,76,0.07)] flex flex-col justify-between relative overflow-hidden group hover:border-[#F97316]/50 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F97316]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total de Cupons Gerados
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] border border-[#F97316]/20 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="font-mono-num text-3xl sm:text-4xl font-extrabold text-[#F97316] tracking-tight">
                {totalCoupons}
              </span>
              <span className="text-sm font-bold text-slate-600">
                {totalCoupons === 1 ? 'cupom da sorte' : 'cupons da sorte'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {couponsInUrna} Na Urna
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${
                  couponsPending > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                {couponsPending} Pendentes
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('historico')}
              className="font-bold text-[#0B224C] hover:text-[#F97316] transition-colors cursor-pointer"
            >
              Ver Urna
            </button>
          </div>
        </div>

        {/* Card 3: Saldo Pendente (Valor Residual p/ Próxima Compra) */}
        <div className="bg-gradient-to-br from-white via-white to-[#FFF7ED]/70 rounded-2xl p-5 border border-[#F97316]/35 shadow-[0_10px_25px_-5px_rgba(249,115,22,0.09)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#103D8C] to-[#F97316]" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Saldo Pendente Acumulado
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Sobra que soma na próxima compra
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#0B224C]">
                {formatCurrency(pendingBalance)}
              </span>
              <span className="font-mono-num text-xs font-bold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#F97316]/30">
                {progressPercentage}% de {formatCurrency(couponThreshold)}
              </span>
            </div>

            {/* Barra de Progresso do Saldo Pendente */}
            <div className="mt-2.5 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#103D8C] via-[#2563EB] to-[#F97316] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-200/50 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-700 font-medium">
              Faltam{' '}
              <strong className="font-mono-num text-[#EA580C] font-bold">
                {formatCurrency(amountMissingForNextCoupon)}
              </strong>{' '}
              p/ +1 cupom
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('alerta')}
              className="inline-flex items-center gap-1 font-bold text-[#EA580C] hover:text-[#0B224C] transition-colors shrink-0 cursor-pointer"
            >
              Simular Caixa
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
