import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calculator,
  FilePlus2,
  Archive,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ReceiptNote } from './types/coupon';
import {
  computeLedgerSummary,
  DEFAULT_COUPON_THRESHOLD,
  formatCurrency,
} from './utils/ledger';
import { BrandHeader, AnaRisorlangeCartStarLogo } from './components/BrandHeader';
import { MetricsPanel } from './components/MetricsPanel';
import { CheckoutAlertTab } from './components/CheckoutAlertTab';
import { RegisterReceiptTab } from './components/RegisterReceiptTab';
import { HistoryBallotTab } from './components/HistoryBallotTab';

type ActiveTab = 'alerta' | 'registar' | 'historico';

const LEGACY_MOCK_STORAGE_KEY = 'ana_risorlange_rede_parceria_notes_v1';
const LEGACY_THRESHOLD_KEY_V1 = 'ana_risorlange_rede_parceria_threshold_v1';
const LEGACY_THRESHOLD_KEY_V2 = 'ana_risorlange_rede_parceria_threshold_v2';
const STORAGE_NOTES_KEY = 'ana_risorlange_rede_parceria_real_notes_v2';
const STORAGE_THRESHOLD_KEY = 'ana_risorlange_rede_parceria_threshold_v3_100';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('alerta');

  // Inicializa 100% real e sem dados mockados (R$ 0,00 gasto, 0 cupons, R$ 0,00 saldo pendente)
  const [notes, setNotes] = useState<ReceiptNote[]>(() => {
    try {
      // Remove qualquer dado mockado ou regra antiga de versões anteriores
      localStorage.removeItem(LEGACY_MOCK_STORAGE_KEY);
      localStorage.removeItem(LEGACY_THRESHOLD_KEY_V1);
      localStorage.removeItem(LEGACY_THRESHOLD_KEY_V2);

      const saved = localStorage.getItem(STORAGE_NOTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback seguro caso localStorage esteja indisponível
    }
    return [];
  });

  // Carrega o valor por cupom (padrão oficial: R$ 100,00 = 1 Cupom)
  const [couponThreshold, setCouponThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THRESHOLD_KEY);
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch {
      // ignore
    }
    return DEFAULT_COUPON_THRESHOLD;
  });

  // Estado para pré-preencher a Aba 2 a partir da simulação da Aba 1
  const [prefilledAmount, setPrefilledAmount] = useState<number | null>(null);
  const [prefilledNotes, setPrefilledNotes] = useState<string>('');

  // Notificação Toast rápida
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Persiste notas reais no localStorage sempre que alteradas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch {
      // ignore storage quota errors
    }
  }, [notes]);

  // Persiste meta de cupom no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THRESHOLD_KEY, String(couponThreshold));
    } catch {
      // ignore
    }
  }, [couponThreshold]);

  // Resumo matemático completo (Total Gasto, Total de Cupom, Saldo Pendente REAL e Notas Enriquecidas)
  const ledgerSummary = useMemo(
    () => computeLedgerSummary(notes, couponThreshold),
    [notes, couponThreshold]
  );

  // Lista apenas compradores reais já registados pelo utilizador
  const existingBuyers = useMemo(() => {
    const names = notes.map((n) => n.buyer).filter(Boolean);
    return Array.from(new Set(names));
  }, [notes]);

  // Adicionar nova nota fiscal real
  const handleSaveReceipt = (newNoteData: Omit<ReceiptNote, 'id' | 'createdAt'>) => {
    const newNote: ReceiptNote = {
      ...newNoteData,
      id: `nota-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setNotes((prev) => [...prev, newNote]);
    triggerToast(
      `Nota de ${formatCurrency(newNote.amount)} (${newNote.buyer}) salva com sucesso!`
    );
  };

  // Alternar estado interativo entre "Pendente" e "Na Urna"
  const handleToggleStatus = (id: string) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== id) return note;
        const nextStatus = note.status === 'na_urna' ? 'pendente' : 'na_urna';
        triggerToast(
          nextStatus === 'na_urna'
            ? `🗳️ Cupons da nota de ${note.buyer} marcados como "Na Urna"!`
            : `⏳ Nota de ${note.buyer} alterada para "Pendente".`
        );
        return { ...note, status: nextStatus };
      })
    );
  };

  // Marcar todas as notas pendentes como "Na Urna"
  const handleMarkAllInUrna = () => {
    setNotes((prev) =>
      prev.map((note) => ({
        ...note,
        status: 'na_urna',
      }))
    );
    triggerToast('🎉 Todos os cupons foram marcados como depositados Na Urna!');
  };

  // Excluir uma nota individual
  const handleDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (target) {
      triggerToast(`Nota de ${target.buyer} (${formatCurrency(target.amount)}) removida.`);
    }
  };

  // Limpar / Zerar todos os dados a qualquer momento
  const handleClearAllData = () => {
    setNotes([]);
    try {
      localStorage.removeItem(STORAGE_NOTES_KEY);
      localStorage.removeItem(LEGACY_MOCK_STORAGE_KEY);
    } catch {
      // ignore
    }
    triggerToast(
      'Todos os dados foram zerados (Total: R$ 0,00 • 0 Cupons • Saldo: R$ 0,00).'
    );
  };

  // Atualizar ou anexar foto real de uma nota já existente no histórico
  const handleUpdateNotePhoto = (
    id: string,
    photoDataUrl: string,
    photoName: string
  ) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              receiptPhotoUrl: photoDataUrl,
              receiptPhotoName: photoName,
            }
          : note
      )
    );
    triggerToast('📸 Foto real da Nota Fiscal salva com sucesso no histórico!');
  };

  // Enviar simulação da Aba 1 diretamente para a Aba 2
  const handleSendToRegister = (totalPurchaseAmount: number, notesSummary: string) => {
    setPrefilledAmount(totalPurchaseAmount);
    setPrefilledNotes(notesSummary);
    setActiveTab('registar');
    triggerToast(
      `Valor de ${formatCurrency(totalPurchaseAmount)} transferido para Registar Nota!`
    );
  };

  const clearPrefill = useCallback(() => {
    setPrefilledAmount(null);
    setPrefilledNotes('');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-24 sm:pb-12">
      {/* 1. CABEÇALHO DA MARCA (Supermercado Ana Risorlange - Rede Parceria) */}
      <BrandHeader
        couponThreshold={couponThreshold}
        totalNotesCount={notes.length}
        onChangeThreshold={(val) => {
          setCouponThreshold(val);
          triggerToast(`Meta atualizada: 1 cupom a cada ${formatCurrency(val)}`);
        }}
        onClearAllData={handleClearAllData}
      />

      {/* 2. PAINEL DE MÉTRICAS NO TOPO */}
      <MetricsPanel
        summary={ledgerSummary}
        totalNotesCount={notes.length}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* 3. SISTEMA DE ABAS / NAVEGAÇÃO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {/* Barra de Abas Desktop & Tablet */}
        <nav
          aria-label="Navegação Principal de Funcionalidades"
          className="bg-[#0B224C]/5 p-1.5 rounded-2xl border border-slate-200/90 grid grid-cols-3 gap-1.5 sm:gap-2 shadow-2xs"
        >
          {/* Aba 1: Alerta do Caixa */}
          <button
            type="button"
            onClick={() => setActiveTab('alerta')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl font-display text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'alerta'
                ? 'bg-[#0B224C] text-white shadow-md'
                : 'text-slate-600 hover:text-[#0B224C] hover:bg-white/70'
            }`}
          >
            <Calculator
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'alerta' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Alerta do Caixa</span>
            <span
              className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'alerta'
                  ? 'bg-[#F97316] text-white'
                  : 'bg-orange-100 text-[#EA580C]'
              }`}
            >
              Simulador
            </span>
          </button>

          {/* Aba 2: Registar Nota */}
          <button
            type="button"
            onClick={() => setActiveTab('registar')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl font-display text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'registar'
                ? 'bg-[#0B224C] text-white shadow-md'
                : 'text-slate-600 hover:text-[#0B224C] hover:bg-white/70'
            }`}
          >
            <FilePlus2
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'registar' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Registar Nota</span>
          </button>

          {/* Aba 3: Urna e Histórico */}
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl font-display text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'bg-[#0B224C] text-white shadow-md'
                : 'text-slate-600 hover:text-[#0B224C] hover:bg-white/70'
            }`}
          >
            <Archive
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'historico' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Urna e Histórico</span>
            {ledgerSummary.couponsPending > 0 ? (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                {ledgerSummary.couponsPending} pend.
              </span>
            ) : (
              <span
                className={`hidden md:inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'historico'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {notes.length}
              </span>
            )}
          </button>
        </nav>

        {/* Conteúdo Dinâmico da Aba Ativa */}
        <div className="transition-all duration-200">
          {activeTab === 'alerta' && (
            <CheckoutAlertTab
              pendingBalance={ledgerSummary.pendingBalance}
              couponThreshold={couponThreshold}
              onSendToRegister={handleSendToRegister}
            />
          )}

          {activeTab === 'registar' && (
            <RegisterReceiptTab
              pendingBalance={ledgerSummary.pendingBalance}
              couponThreshold={couponThreshold}
              existingBuyers={existingBuyers}
              prefilledAmount={prefilledAmount}
              prefilledNotes={prefilledNotes}
              onClearPrefill={clearPrefill}
              onSaveReceipt={handleSaveReceipt}
              onGoToHistory={() => setActiveTab('historico')}
            />
          )}

          {activeTab === 'historico' && (
            <HistoryBallotTab
              notes={ledgerSummary.enrichedNotes}
              totalCoupons={ledgerSummary.totalCoupons}
              couponsInUrna={ledgerSummary.couponsInUrna}
              couponsPending={ledgerSummary.couponsPending}
              onToggleStatus={handleToggleStatus}
              onMarkAllInUrna={handleMarkAllInUrna}
              onDeleteNote={handleDeleteNote}
              onClearAllData={handleClearAllData}
              onUpdateNotePhoto={handleUpdateNotePhoto}
              onGoToRegister={() => setActiveTab('registar')}
            />
          )}
        </div>
      </main>

      {/* Rodapé Corporativo */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B224C] p-1 flex items-center justify-center">
              <AnaRisorlangeCartStarLogo className="w-full h-full" />
            </div>
            <div>
              <span className="font-display font-bold text-[#0B224C] block">
                Supermercado Ana Risorlange • Rede Parceria
              </span>
              <span>“Trazendo o melhor para você” — Gestão de Cupons &amp; Sorteios</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Dados e fotos salvos localmente neste dispositivo (localStorage)</span>
          </div>
        </div>
      </footer>

      {/* Barra de Navegação Inferior Fixa para Celular (Mobile-First UX) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-[0_-8px_20px_rgba(11,34,76,0.08)]">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('alerta')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
              activeTab === 'alerta'
                ? 'bg-[#0B224C] text-white'
                : 'text-slate-600'
            }`}
          >
            <Calculator
              className={`w-4 h-4 mb-0.5 ${
                activeTab === 'alerta' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Alerta Caixa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registar')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
              activeTab === 'registar'
                ? 'bg-[#0B224C] text-white'
                : 'text-slate-600'
            }`}
          >
            <FilePlus2
              className={`w-4 h-4 mb-0.5 ${
                activeTab === 'registar' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Registar Nota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
              activeTab === 'historico'
                ? 'bg-[#0B224C] text-white'
                : 'text-slate-600'
            }`}
          >
            <Archive
              className={`w-4 h-4 mb-0.5 ${
                activeTab === 'historico' ? 'text-[#F97316]' : 'text-slate-500'
              }`}
            />
            <span>Urna ({ledgerSummary.totalCoupons})</span>
            {ledgerSummary.couponsPending > 0 && (
              <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* Notificação Flutuante (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-50 max-w-md bg-[#0B224C] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#F97316]/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-snug">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
