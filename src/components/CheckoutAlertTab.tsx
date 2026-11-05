import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingCart,
  AlertTriangle,
  Sparkles,
  Plus,
  Minus,
  RotateCcw,
  Ticket,
  ArrowRight,
  CheckCircle2,
  Zap,
  Calculator,
  Trash2,
  Flame,
  Database,
} from 'lucide-react';
import { LOW_COST_SUGGESTIONS } from '../data/suggestions';
import { LowCostItemSuggestion, SimulatedCartExtra } from '../types/coupon';
import { formatCurrency } from '../utils/ledger';

interface CheckoutAlertTabProps {
  pendingBalance: number;
  couponThreshold: number;
  onSendToRegister: (totalPurchaseAmount: number, notesSummary: string) => void;
}

export const CheckoutAlertTab: React.FC<CheckoutAlertTabProps> = ({
  pendingBalance,
  couponThreshold,
  onSendToRegister,
}) => {
  // Inicia zerado / vazio para o utilizador digitar o valor REAL da compra atual no caixa
  const [cartInputStr, setCartInputStr] = useState<string>('');
  const [usePreviousBalance, setUsePreviousBalance] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Recomendados');
  const [extras, setExtras] = useState<SimulatedCartExtra[]>([]);
  const [justUnlockedCoupon, setJustUnlockedCoupon] = useState<boolean>(false);

  // Converte string monetária pt-BR para número real
  const baseCartAmount = useMemo(() => {
    if (!cartInputStr.trim()) return 0;
    const normalized = cartInputStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [cartInputStr]);

  // Soma dos produtos da gôndola adicionados na simulação
  const extrasTotal = useMemo(() => {
    return extras.reduce((acc, entry) => acc + entry.item.price * entry.quantity, 0);
  }, [extras]);

  // Compra total no caixa (Valor digitado + Produtos adicionados da gôndola)
  const currentCheckoutAmount = useMemo(() => {
    return Math.round((baseCartAmount + extrasTotal) * 100) / 100;
  }, [baseCartAmount, extrasTotal]);

  // Saldo Pendente REAL vindo do localStorage das compras anteriores
  const effectivePreviousBalance = usePreviousBalance ? pendingBalance : 0;

  // Cálculos matemáticos em centavos para precisão absoluta
  const simulationMath = useMemo(() => {
    const thresholdCents = Math.round(couponThreshold * 100);
    const baseOnlyTotalCents =
      Math.round(baseCartAmount * 100) + Math.round(effectivePreviousBalance * 100);
    const baseOnlyCoupons =
      thresholdCents > 0 ? Math.floor(baseOnlyTotalCents / thresholdCents) : 0;

    const totalCombinedCents =
      Math.round(currentCheckoutAmount * 100) +
      Math.round(effectivePreviousBalance * 100);

    const couponsEarnedNow =
      thresholdCents > 0 ? Math.floor(totalCombinedCents / thresholdCents) : 0;
    const newResidualCents =
      thresholdCents > 0 ? totalCombinedCents % thresholdCents : 0;
    const missingForNextCents =
      thresholdCents > 0 ? thresholdCents - newResidualCents : 0;

    const progressPercent =
      thresholdCents > 0
        ? Math.min(100, Math.round((newResidualCents / thresholdCents) * 100))
        : 0;

    // Alerta quando existe saldo residual e falta <= 35% do valor do cupom (ex: <= R$ 17,50)
    const alertThresholdCents = Math.max(1500, Math.round(thresholdCents * 0.35));
    const isCloseToNextCoupon =
      newResidualCents > 0 && missingForNextCents <= alertThresholdCents;

    const extraCouponsFromSuggestions = Math.max(0, couponsEarnedNow - baseOnlyCoupons);

    return {
      totalCombined: totalCombinedCents / 100,
      couponsEarnedNow,
      baseOnlyCoupons,
      extraCouponsFromSuggestions,
      newResidual: newResidualCents / 100,
      missingForNext: missingForNextCents / 100,
      progressPercent,
      isCloseToNextCoupon,
      hasActiveValue: totalCombinedCents > 0,
    };
  }, [
    baseCartAmount,
    currentCheckoutAmount,
    effectivePreviousBalance,
    couponThreshold,
  ]);

  // Recomendação Exata de Produto(s): encontra na lista qual produto (ou dupla) adiciona exatamente os reais/centavos que faltam
  const exactProductRecommendation = useMemo(() => {
    const missing = simulationMath.missingForNext;
    if (!simulationMath.hasActiveValue || missing <= 0) return null;

    // 1. Procura um único produto cujo preço cubra o valor faltante com a menor sobra possível
    const singleCandidates = LOW_COST_SUGGESTIONS.filter(
      (item) => item.price >= missing
    ).sort((a, b) => a.price - b.price);

    const bestSingle = singleCandidates[0] || null;

    // 2. Procura combinação de até 2 produtos que cubra exatamente o valor faltante
    let bestCombo: { items: LowCostItemSuggestion[]; total: number } | null = null;
    for (let i = 0; i < LOW_COST_SUGGESTIONS.length; i++) {
      for (let j = i; j < LOW_COST_SUGGESTIONS.length; j++) {
        const sum =
          Math.round(
            (LOW_COST_SUGGESTIONS[i].price + LOW_COST_SUGGESTIONS[j].price) * 100
          ) / 100;
        if (sum >= missing) {
          if (!bestCombo || sum < bestCombo.total) {
            bestCombo = {
              items: [LOW_COST_SUGGESTIONS[i], LOW_COST_SUGGESTIONS[j]],
              total: sum,
            };
          }
        }
      }
    }

    // Se 1 produto único resolve com diferença de até R$ 1,20 do combo, prioriza a praticidade de pegar 1 único item
    if (
      bestSingle &&
      (!bestCombo || bestSingle.price <= bestCombo.total + 1.2)
    ) {
      return {
        items: [bestSingle],
        total: bestSingle.price,
        extraOverMissing: Math.max(
          0,
          Math.round((bestSingle.price - missing) * 100) / 100
        ),
      };
    }

    if (bestCombo) {
      return {
        items: bestCombo.items,
        total: bestCombo.total,
        extraOverMissing: Math.max(
          0,
          Math.round((bestCombo.total - missing) * 100) / 100
        ),
      };
    }

    // Se faltam mais de R$ 22,00, recomenda o item de maior valor unitário (ex: Cartela de Ovos ou Café) com a quantidade necessária
    const highestItem = [...LOW_COST_SUGGESTIONS].sort(
      (a, b) => b.price - a.price
    )[0];
    const neededQty = Math.ceil(missing / highestItem.price);
    const total = Math.round(highestItem.price * neededQty * 100) / 100;
    return {
      items: Array(neededQty).fill(highestItem),
      total,
      extraOverMissing: Math.max(0, Math.round((total - missing) * 100) / 100),
    };
  }, [simulationMath.missingForNext, simulationMath.hasActiveValue]);

  const handleAddQuickValue = (delta: number) => {
    const nextVal = Math.max(0, Math.round((baseCartAmount + delta) * 100) / 100);
    setCartInputStr(nextVal.toFixed(2).replace('.', ','));
    setJustUnlockedCoupon(false);
  };

  const handleAddExtraItem = (item: LowCostItemSuggestion) => {
    const previousCoupons = simulationMath.couponsEarnedNow;

    setExtras((prev) => {
      const existing = prev.find((e) => e.item.id === item.id);
      if (existing) {
        return prev.map((e) =>
          e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { item, quantity: 1 }];
    });

    const newTotalCents = Math.round(
      (currentCheckoutAmount + item.price + effectivePreviousBalance) * 100
    );
    const thresholdCents = Math.round(couponThreshold * 100);
    const nextCoupons =
      thresholdCents > 0 ? Math.floor(newTotalCents / thresholdCents) : 0;

    if (nextCoupons > previousCoupons) {
      setJustUnlockedCoupon(true);
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleApplyRecommendation = () => {
    if (!exactProductRecommendation) return;
    const previousCoupons = simulationMath.couponsEarnedNow;

    setExtras((prev) => {
      const updated = [...prev];
      exactProductRecommendation.items.forEach((recItem) => {
        const idx = updated.findIndex((e) => e.item.id === recItem.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        } else {
          updated.push({ item: recItem, quantity: 1 });
        }
      });
      return updated;
    });

    const newTotalCents = Math.round(
      (currentCheckoutAmount +
        exactProductRecommendation.total +
        effectivePreviousBalance) *
        100
    );
    const thresholdCents = Math.round(couponThreshold * 100);
    const nextCoupons =
      thresholdCents > 0 ? Math.floor(newTotalCents / thresholdCents) : 0;

    if (nextCoupons > previousCoupons) {
      setJustUnlockedCoupon(true);
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.65 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleDecrementExtraItem = (itemId: string) => {
    setExtras((prev) =>
      prev
        .map((e) =>
          e.item.id === itemId ? { ...e, quantity: e.quantity - 1 } : e
        )
        .filter((e) => e.quantity > 0)
    );
  };

  const handleClearSimulation = () => {
    setCartInputStr('');
    setExtras([]);
    setJustUnlockedCoupon(false);
  };

  // Ordena os produtos destacando no topo exatamente aqueles que cobrem os reais/centavos que faltam
  const displayedSuggestions = useMemo(() => {
    const missing = simulationMath.missingForNext;
    let list = [...LOW_COST_SUGGESTIONS];

    if (selectedCategory !== 'Recomendados' && selectedCategory !== 'Todos') {
      list = list.filter((i) => i.category === selectedCategory);
    }

    if (selectedCategory === 'Recomendados' && simulationMath.hasActiveValue) {
      return list.sort((a, b) => {
        const aCovers = a.price >= missing && a.price <= missing + 5 ? 0 : 1;
        const bCovers = b.price >= missing && b.price <= missing + 5 ? 0 : 1;
        if (aCovers !== bCovers) return aCovers - bCovers;
        return Math.abs(a.price - missing) - Math.abs(b.price - missing);
      });
    }

    return list.sort((a, b) => a.price - b.price);
  }, [
    selectedCategory,
    simulationMath.missingForNext,
    simulationMath.hasActiveValue,
  ]);

  const categories = [
    'Recomendados',
    'Todos',
    'Mercearia',
    'Laticínios & Bebidas',
    'Caixa & Padaria',
    'Limpeza & Higiene',
  ];

  const handleConvertToReceipt = () => {
    const extraDescriptions = extras
      .map((e) => `${e.quantity}x ${e.item.name}`)
      .join(', ');
    const noteSummary = extraDescriptions
      ? `Compra no caixa + Produtos adicionados (${extraDescriptions})`
      : '';
    onSendToRegister(currentCheckoutAmount, noteSummary);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Simulador Integrado ao Saldo Pendente Real */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] flex items-center justify-center shrink-0 shadow-xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0B224C]">
                Simulador do Caixa (100% Integrado ao Seu Saldo Real)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3" />
                Sincronizado c/ Histórico
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Digite o valor atual das suas compras. O simulador puxa automaticamente o seu{' '}
              <strong className="text-[#0B224C]">
                Saldo Pendente Salvo ({formatCurrency(pendingBalance)})
              </strong>
              , calcula os centavos que faltam para o próximo cupom e indica qual produto pegar na prateleira!
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Coluna Esquerda (Calculadora Real) + Coluna Direita (Diagnóstico Exato e Gôndola de Produtos Reais) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA (5 cols): Entrada da Compra no Caixa + Resumo do Cálculo */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="checkout-amount-input"
                  className="text-xs font-bold uppercase tracking-wider text-[#0B224C] flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4 text-[#F97316]" />
                  Digite o Valor Atual das Compras (R$)
                </label>
                {(cartInputStr || extras.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearSimulation}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar Simulador
                  </button>
                )}
              </div>

              {/* Input Gigante Estilo Frente de Caixa (POS) */}
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono-num text-xl sm:text-2xl font-extrabold text-[#103D8C] select-none">
                  R$
                </span>
                <input
                  id="checkout-amount-input"
                  type="text"
                  inputMode="decimal"
                  value={cartInputStr}
                  onChange={(e) => {
                    setCartInputStr(e.target.value);
                    setJustUnlockedCoupon(false);
                  }}
                  placeholder="0,00"
                  className="w-full pl-14 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#F97316] focus:bg-white focus:outline-none font-mono-num text-2xl sm:text-3xl font-extrabold text-[#0B224C] transition-all shadow-inner"
                />
              </div>

              {/* Botões de Adição Rápida de Valor (ajustados para múltiplos de R$ 100,00) */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {[10, 20, 50, 90, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuickValue(val)}
                    className="flex-1 min-w-[56px] py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-[#0B224C] text-slate-700 hover:text-white font-mono-num text-xs font-bold transition-colors cursor-pointer"
                  >
                    +R${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Produtos da Gôndola Adicionados na Simulação */}
            {extras.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C2410C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Produtos Adicionados ({extras.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExtras([]);
                      setJustUnlockedCoupon(false);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover todos
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {extras.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white p-2 rounded-xl border border-orange-200/80 text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <span className="font-bold text-slate-800 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num font-bold text-[#EA580C]">
                          {formatCurrency(item.price * quantity)}
                        </span>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecrementExtraItem(item.id)}
                            className="p-0.5 hover:text-rose-600 cursor-pointer"
                            title="Diminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono-num font-bold text-[11px] px-1">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddExtraItem(item)}
                            className="p-0.5 hover:text-emerald-600 cursor-pointer"
                            title="Adicionar mais um"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle para Somar com o Saldo Pendente REAL Salvo no localStorage */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-[#0B224C] block">
                  Saldo Pendente REAL das Compras Anteriores
                </span>
                <span className="text-[11px] text-slate-600">
                  Salvo no seu histórico:{' '}
                  <strong className="font-mono-num text-emerald-700 font-extrabold">
                    {formatCurrency(pendingBalance)}
                  </strong>
                </span>
              </div>
              <input
                type="checkbox"
                checked={usePreviousBalance}
                onChange={(e) => setUsePreviousBalance(e.target.checked)}
                className="w-5 h-5 accent-[#F97316] rounded cursor-pointer"
                title="Somar automaticamente com o saldo pendente salvo"
              />
            </div>

            {/* Quadro Demonstrativo da Soma Matemática em Tempo Real */}
            <div className="rounded-2xl bg-[#0B224C] text-white p-4 sm:p-5 space-y-3 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span>Valor Digitado da Compra Atual:</span>
                <span className="font-mono-num font-semibold text-white">
                  {formatCurrency(baseCartAmount)}
                </span>
              </div>

              {extrasTotal > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span>+ Produtos da prateleira Adicionados:</span>
                  <span className="font-mono-num font-bold">
                    + {formatCurrency(extrasTotal)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-blue-200">
                <span>+ Saldo Pendente Salvo (localStorage):</span>
                <span className="font-mono-num font-semibold text-emerald-300">
                  + {formatCurrency(effectivePreviousBalance)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-blue-100">
                  Total Acumulado no Caixa:
                </span>
                <span className="font-mono-num text-xl sm:text-2xl font-extrabold text-white">
                  {formatCurrency(simulationMath.totalCombined)}
                </span>
              </div>

              {/* Valor Exato que Falta para o Próximo Cupão */}
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  Falta p/ o próximo cupom:
                </span>
                <span className="font-mono-num text-base sm:text-lg font-extrabold text-[#FDBA74]">
                  {formatCurrency(simulationMath.missingForNext)}
                </span>
              </div>

              {/* Destaque de Cupões Conquistados Agora */}
              <div className="mt-2 pt-3 border-t border-white/15 flex items-center justify-between bg-white/10 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block">
                      Cupons Gerados Nesta Compra
                    </span>
                    <span className="text-xs text-white/90">
                      {simulationMath.extraCouponsFromSuggestions > 0 ? (
                        <span className="text-amber-300 font-bold">
                          Inclui +{simulationMath.extraCouponsFromSuggestions} cupom destravado pelos produtos!
                        </span>
                      ) : (
                        `Regra: ${formatCurrency(couponThreshold)} = 1 cupom`
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono-num text-3xl font-extrabold text-[#FDBA74]">
                    +{simulationMath.couponsEarnedNow}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-blue-200">
                    {simulationMath.couponsEarnedNow === 1 ? 'Cupão' : 'Cupões'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão para Transferir e Salvar esta Compra Real na Aba "Registar Nota" */}
            {currentCheckoutAmount > 0 && (
              <button
                type="button"
                onClick={handleConvertToReceipt}
                className="w-full py-3.5 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  Registar Esta Compra Real ({formatCurrency(currentCheckoutAmount)})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (7 cols): Diagnóstico Exato de Centavos/Reais + Prateleira com Fotos Reais */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card Termómetro de Alerta + Recomendação Exata do Produto */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border-2 transition-all shadow-sm ${
              justUnlockedCoupon
                ? 'bg-emerald-50/90 border-emerald-400'
                : simulationMath.isCloseToNextCoupon
                ? 'bg-gradient-to-br from-[#FFF7ED] via-amber-50/80 to-orange-50 border-[#F97316]'
                : 'bg-white border-slate-200/90'
            }`}
          >
            {justUnlockedCoupon && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-600 text-white flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-200" />
                  <div>
                    <h4 className="font-display font-extrabold text-sm sm:text-base">
                      🎉 Parabéns! Você completou o valor e ganhou +1 Cupom!
                    </h4>
                    <p className="text-xs text-emerald-100">
                      O produto adicionado cobriu exatamente os reais/centavos que faltavam!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                {simulationMath.isCloseToNextCoupon ? (
                  <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shrink-0 animate-pulse-subtle shadow">
                    <Flame className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#0B224C]/10 text-[#0B224C] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-[#F97316]" />
                  </div>
                )}

                <div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      simulationMath.isCloseToNextCoupon
                        ? 'bg-[#F97316] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {simulationMath.isCloseToNextCoupon
                      ? '🔥 Alerta do Caixa: Falta Pouco p/ +1 Cupom!'
                      : 'Cálculo Exato para o Próximo Cupão'}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-[#0B224C] mt-0.5">
                    {!simulationMath.hasActiveValue ? (
                      `Digite o valor da compra ao lado (Múltiplos de ${formatCurrency(couponThreshold)} = 1 Cupom)`
                    ) : simulationMath.newResidual === 0 ? (
                      `Múltiplo exato de ${formatCurrency(couponThreshold)} atingido! Nenhum centavo sobrando.`
                    ) : (
                      <>
                        Faltam exatamente{' '}
                        <span className="text-[#EA580C] underline decoration-2 font-mono-num">
                          {formatCurrency(simulationMath.missingForNext)}
                        </span>{' '}
                        para completar {formatCurrency(couponThreshold)} (+1 Cupom)!
                      </>
                    )}
                  </h3>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/80 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Saldo que Sobra p/ Próxima
                </span>
                <span className="font-mono-num text-lg font-extrabold text-[#0B224C]">
                  {formatCurrency(simulationMath.newResidual)}{' '}
                  <span className="text-xs font-semibold text-slate-400">
                    / {formatCurrency(couponThreshold)}
                  </span>
                </span>
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="relative w-full h-4 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  simulationMath.isCloseToNextCoupon
                    ? 'bg-gradient-to-r from-[#F97316] via-orange-500 to-amber-400'
                    : 'bg-gradient-to-r from-[#0B224C] to-[#2563EB]'
                }`}
                style={{ width: `${simulationMath.progressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>
                Acumulado rumo ao próximo cupão:{' '}
                <strong className="font-mono-num text-[#0B224C]">
                  {formatCurrency(simulationMath.newResidual)} ({simulationMath.progressPercent}%)
                </strong>
              </span>
              <span>
                Meta: <strong className="font-mono-num">{formatCurrency(couponThreshold)}</strong>
              </span>
            </div>

            {/* Recomendação Automática de Produto Real que Cobre Exatamente o Valor Faltante */}
            {exactProductRecommendation && simulationMath.newResidual > 0 && (
              <div className="mt-4 pt-4 border-t border-orange-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-3.5 rounded-xl border-2 border-[#F97316]/40 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-2 shrink-0">
                    {exactProductRecommendation.items.slice(0, 2).map((recItem, idx) => (
                      <img
                        key={`${recItem.id}-${idx}`}
                        src={recItem.imageUrl}
                        alt={recItem.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm bg-slate-100"
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#EA580C]">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Produto Recomendado p/ Cobrir os{' '}
                      {formatCurrency(simulationMath.missingForNext)}:
                    </span>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B224C] truncate">
                      {exactProductRecommendation.items.length === 1
                        ? `1x ${exactProductRecommendation.items[0].name}`
                        : exactProductRecommendation.items[0].id ===
                          exactProductRecommendation.items[1]?.id
                        ? `${exactProductRecommendation.items.length}x ${exactProductRecommendation.items[0].name}`
                        : exactProductRecommendation.items
                            .map((i) => i.name)
                            .join(' + ')}{' '}
                      <span className="font-mono-num text-[#EA580C]">
                        ({formatCurrency(exactProductRecommendation.total)})
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Adiciona{' '}
                      <strong className="font-mono-num text-slate-700">
                        {formatCurrency(exactProductRecommendation.total)}
                      </strong>
                      , fecha os{' '}
                      <strong className="font-mono-num text-emerald-700">
                        {formatCurrency(simulationMath.missingForNext)}
                      </strong>{' '}
                      que faltam e ainda sobra{' '}
                      <strong className="font-mono-num text-[#0B224C]">
                        {formatCurrency(exactProductRecommendation.extraOverMissing)}
                      </strong>{' '}
                      de saldo!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyRecommendation}
                  className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar (+1 Cupom)
                </button>
              </div>
            )}
          </div>

          {/* Vitrine / Gôndola de Produtos Reais de Supermercado */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base sm:text-lg font-extrabold text-[#0B224C]">
                  Gôndola de Produtos para Completar Cupom
                </h3>
                <p className="text-xs text-slate-500">
                  Clique em qualquer produto real abaixo para somar à compra atual e ver quantos reais/centavos ele completa:
                </p>
              </div>
            </div>

            {/* Filtro por Categoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0B224C] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Grid de Produtos com Fotografias Reais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedSuggestions.map((item) => {
                const missing = simulationMath.missingForNext;
                const hasActive = simulationMath.hasActiveValue && simulationMath.newResidual > 0;
                const closesGapDirectly =
                  hasActive && item.price >= missing && item.price <= missing + 5.5;
                const remainingIfAdded = hasActive
                  ? Math.max(0, Math.round((missing - item.price) * 100) / 100)
                  : 0;
                const addedEntry = extras.find((e) => e.item.id === item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddExtraItem(item)}
                    className={`group relative rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      closesGapDirectly
                        ? 'bg-[#FFF7ED]/90 border-2 border-[#F97316] shadow-xs hover:shadow-md'
                        : addedEntry
                        ? 'bg-blue-50/50 border-2 border-[#103D8C]'
                        : 'bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-[#F97316]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Imagem Realista do Produto de Supermercado */}
                      <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {addedEntry && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-[#0B224C] text-white font-mono-num text-[10px] font-extrabold shadow">
                            {addedEntry.quantity}x
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {closesGapDirectly ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[10px] font-extrabold uppercase tracking-wider">
                              🎯 Cobre os {formatCurrency(missing)}!
                            </span>
                          ) : hasActive && item.price >= missing ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              ✓ Fecha +1 Cupão
                            </span>
                          ) : hasActive && remainingIfAdded > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold font-mono-num">
                              Faltarão {formatCurrency(remainingIfAdded)}
                            </span>
                          ) : (
                            item.popularTag && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {item.popularTag}
                              </span>
                            )
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-[#0B224C] line-clamp-1 mt-0.5">
                          {item.name}
                        </h4>

                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-mono-num text-sm font-extrabold text-[#EA580C]">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            / {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-colors shadow-2xs ${
                          addedEntry
                            ? 'bg-[#0B224C] text-white'
                            : 'bg-white border border-slate-200 text-[#0B224C] group-hover:bg-[#F97316] group-hover:text-white group-hover:border-[#F97316]'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
