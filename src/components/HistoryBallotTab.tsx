import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Search,
  Ticket,
  Trash2,
  Eye,
  X,
  ArrowLeftRight,
  Sparkles,
  FilePlus2,
  Inbox,
  CheckCheck,
  RotateCcw,
  Upload,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { EnrichedReceiptNote } from '../types/coupon';
import {
  formatCurrency,
  formatDateBR,
  readReceiptFileAsDataURL,
} from '../utils/ledger';

interface HistoryBallotTabProps {
  notes: EnrichedReceiptNote[];
  totalCoupons: number;
  couponsInUrna: number;
  couponsPending: number;
  onToggleStatus: (id: string) => void;
  onMarkAllInUrna: () => void;
  onDeleteNote: (id: string) => void;
  onClearAllData: () => void;
  onUpdateNotePhoto: (id: string, photoDataUrl: string, photoName: string) => void;
  onGoToRegister: () => void;
}

export const HistoryBallotTab: React.FC<HistoryBallotTabProps> = ({
  notes,
  totalCoupons,
  couponsInUrna,
  couponsPending,
  onToggleStatus,
  onMarkAllInUrna,
  onDeleteNote,
  onClearAllData,
  onUpdateNotePhoto,
  onGoToRegister,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'na_urna'>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNoteModal, setSelectedNoteModal] =
    useState<EnrichedReceiptNote | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  const urnaPercentage =
    totalCoupons > 0 ? Math.round((couponsInUrna / totalCoupons) * 100) : 0;

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (statusFilter !== 'todos' && note.status !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        note.buyer.toLowerCase().includes(q) ||
        formatDateBR(note.date).includes(q) ||
        (note.cooNumber && note.cooNumber.toLowerCase().includes(q)) ||
        (note.notes && note.notes.toLowerCase().includes(q)) ||
        formatCurrency(note.amount).toLowerCase().includes(q)
      );
    });
  }, [notes, statusFilter, searchTerm]);

  const handleInteractiveToggle = (note: EnrichedReceiptNote) => {
    const switchingToUrna = note.status === 'pendente';
    onToggleStatus(note.id);

    if (switchingToUrna) {
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleDepositAll = () => {
    onMarkAllInUrna();
    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleModalPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNoteModal) return;
    try {
      const dataUrl = await readReceiptFileAsDataURL(file);
      onUpdateNotePhoto(selectedNoteModal.id, dataUrl, file.name);
      setSelectedNoteModal({
        ...selectedNoteModal,
        receiptPhotoUrl: dataUrl,
        receiptPhotoName: file.name,
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior de Controlo da Urna + Botão de Limpar/Zerar Todos os Dados */}
      <div className="bg-gradient-to-r from-[#0B224C] via-[#103D8C] to-[#0B224C] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F97316] text-white text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Controlo de Urna e Histórico Real • Rede Parceria
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold">
              {notes.length === 0
                ? 'Histórico Pronto para Uso (R$ 0,00 • 0 Cupons)'
                : couponsPending === 0 && totalCoupons > 0
                ? '🎉 Todos os seus cupons já estão depositados Na Urna!'
                : couponsPending > 0
                ? `Atenção: Você tem ${couponsPending} ${
                    couponsPending === 1 ? 'cupão pendente' : 'cup pendentes'
                  } para colocar na Urna!`
                : 'Histórico de Notas e Controlo de Urna'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90">
              alterne o estado de cada nota entre{' '}
              <strong className="text-amber-300">“Pendente”</strong> e{' '}
              <strong className="text-emerald-300">“Na Urna”</strong>, visualize a foto real da Nota Fiscal ou zere os dados quando desejar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Cupons Depositados na Urna
              </span>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="font-mono-num text-2xl font-extrabold text-emerald-300">
                  {couponsInUrna}
                </span>
                <span className="text-xs text-blue-200">
                  / {totalCoupons} cupons ({urnaPercentage}%)
                </span>
              </div>
            </div>

            {couponsPending > 0 && (
              <button
                type="button"
                onClick={handleDepositAll}
                className="px-4 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar Todos “Na Urna”
              </button>
            )}
          </div>
        </div>

        {/* Barra de progresso de cupons na urna */}
        <div className="mt-4 w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-[#F97316] transition-all duration-500 rounded-full"
            style={{ width: `${urnaPercentage}%` }}
          />
        </div>
      </div>

      {/* Barra de Filtros, Pesquisa e Botão Visível para Limpar/Zerar Todos os Dados */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Abas de Filtro Rápido */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-[#0B224C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Notas ({notes.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pendente')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'pendente'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendentes ({notes.filter((n) => n.status === 'pendente').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('na_urna')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'na_urna'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Na Urna ({notes.filter((n) => n.status === 'na_urna').length})
          </button>
        </div>

        {/* Busca + Botão Visível "Limpar/Zerar todos os dados" */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comprador, data, valor..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#103D8C] focus:bg-white focus:outline-none text-xs sm:text-sm text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botão Visível no Histórico para Limpar / Zerar Todos os Dados */}
          {!confirmClearAll ? (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
              title="Apagar todas as notas e zerar gasto, cupons e saldo pendente"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar/Zerar todos os dados
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-xs font-bold text-rose-800">
                Confirmar zerar tudo?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setConfirmClearAll(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Sim, Zerar
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-2 py-1 rounded-lg bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estado Vazio Limpo (Zero Dados Mockados) */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/90 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-[#0B224C]">
            {notes.length === 0
              ? 'Nenhuma nota registada ainda (Histórico 100% Limpo)'
              : 'Nenhuma nota encontrada para este filtro'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {notes.length === 0
              ? 'O aplicativo está inicializado com R$ 0,00 de gasto, 0 cupões e R$ 0,00 de saldo pendente. Registe sua primeira compra real para começar!'
              : 'Tente limpar os filtros de busca ou selecione "Todas as Notas" para visualizar seus registos.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToRegister}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              Registar Primeira Nota Real
            </button>
          </div>
        </div>
      ) : (
        /* Tabela Detalhada (Desktop) e Cards (Mobile) */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* TABELA DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Data &amp; Nota Fiscal</th>
                  <th className="py-3.5 px-4">Comprador</th>
                  <th className="py-3.5 px-4">Valor da Nota (R$)</th>
                  <th className="py-3.5 px-4 text-center">Cupons Gerados</th>
                  <th className="py-3.5 px-4 text-center">Foto da Nota Fiscal</th>
                  <th className="py-3.5 px-5 text-center">
                    Estado na Urna (Clique p/ Alternar)
                  </th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredNotes.map((note) => {
                  const isInUrna = note.status === 'na_urna';
                  const initials = note.buyer
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={note.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Coluna 1: Data & COO */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono-num font-bold text-[#0B224C]">
                          {formatDateBR(note.date)}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {note.cooNumber && <span>COO #{note.cooNumber}</span>}
                          {note.notes && (
                            <span
                              className="truncate max-w-[160px]"
                              title={note.notes}
                            >
                              • {note.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Coluna 2: Comprador */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0B224C] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="font-bold text-slate-800">
                            {note.buyer}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 3: Valor da Nota + Saldo Residual */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono-num text-base font-extrabold text-[#0B224C]">
                          {formatCurrency(note.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-num">
                          {note.previousCarryOver > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              +{formatCurrency(note.previousCarryOver)} ant.
                            </span>
                          ) : (
                            <span>Sem saldo ant.</span>
                          )}{' '}
                          → sobra{' '}
                          <strong className="text-[#EA580C]">
                            {formatCurrency(note.residualAfterNote)}
                          </strong>
                        </div>
                      </td>

                      {/* Coluna 4: Cupons Gerados */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF7ED] border border-[#F97316]/35 text-[#EA580C] font-mono-num font-extrabold text-sm shadow-2xs">
                          <Ticket className="w-4 h-4 text-[#F97316]" />+
                          {note.couponsFromThisNote}{' '}
                          <span className="text-xs font-bold">
                            {note.couponsFromThisNote === 1 ? 'cupão' : 'cupões'}
                          </span>
                        </span>
                      </td>

                      {/* Coluna 5: Visualizar Foto Real da Nota Fiscal */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedNoteModal(note)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            note.receiptPhotoUrl
                              ? 'bg-[#0B224C] hover:bg-[#103D8C] text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Nota Fiscal
                          {note.receiptPhotoUrl && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      </td>

                      {/* Coluna 6: Botão Interativo de Estado (Pendente <-> Na Urna) */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleInteractiveToggle(note)}
                          title="Clique para alternar entre Pendente e Na Urna"
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-extrabold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                            isInUrna
                              ? 'bg-emerald-100/90 hover:bg-emerald-200/80 text-emerald-900 border-emerald-400'
                              : 'bg-amber-100/90 hover:bg-amber-200/80 text-amber-900 border-amber-400'
                          }`}
                        >
                          {isInUrna ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Na Urna</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Pendente</span>
                            </>
                          )}
                          <ArrowLeftRight className="w-3 h-3 opacity-55 ml-0.5" />
                        </button>
                      </td>

                      {/* Coluna 7: Excluir */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir nota do histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* LISTA DE CARDS RESPONSIVA (MOBILE) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredNotes.map((note) => {
              const isInUrna = note.status === 'na_urna';
              return (
                <div key={note.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono-num text-xs font-bold text-slate-500">
                        {formatDateBR(note.date)}
                        {note.cooNumber ? ` • COO #${note.cooNumber}` : ''}
                      </span>
                      <h4 className="font-display font-extrabold text-base text-[#0B224C]">
                        {note.buyer}
                      </h4>
                      {note.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {note.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono-num text-lg font-extrabold text-[#0B224C] block">
                        {formatCurrency(note.amount)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF7ED] text-[#EA580C] border border-[#F97316]/30 font-mono-num text-xs font-extrabold">
                        <Ticket className="w-3 h-3" />+{note.couponsFromThisNote}{' '}
                        {note.couponsFromThisNote === 1 ? 'cupão' : 'cupões'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center justify-between font-mono-num">
                    <span>
                      Saldo ant.: +{formatCurrency(note.previousCarryOver)}
                    </span>
                    <span>
                      Sobra: <strong>{formatCurrency(note.residualAfterNote)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInteractiveToggle(note)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isInUrna
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}
                    >
                      {isInUrna ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Na Urna</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNoteModal(note)}
                      className="px-3 py-2 rounded-xl bg-[#0B224C] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Ver foto do talão"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Nota Fiscal
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Inspecionar a Foto Real da Nota Fiscal (DataURL) */}
      {selectedNoteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedNoteModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={modalFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleModalPhotoUpload}
              className="hidden"
            />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] block">
                  Foto do Talão Fiscal • Supermercado Ana Risorlange
                </span>
                <h3 className="font-display text-base font-extrabold text-[#0B224C]">
                  {selectedNoteModal.buyer} • {formatDateBR(selectedNoteModal.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoteModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center max-h-[420px] overflow-y-auto">
              {selectedNoteModal.receiptPhotoUrl ? (
                <img
                  src={selectedNoteModal.receiptPhotoUrl}
                  alt="Foto Real do Talão Fiscal"
                  className="w-full max-h-[380px] object-contain rounded-xl shadow bg-white"
                />
              ) : (
                <div className="py-10 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#0B224C]">
                      Esta nota foi registada sem foto da Nota Fiscal
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você pode enviar a foto real da Nota Fiscal agora mesmo para deixá-la salva no histórico:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Enviar Foto da Nota Fiscal Agora
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs">
                <span className="text-slate-500 block">Valor / Cupões:</span>
                <strong className="font-mono-num text-sm text-[#0B224C]">
                  {formatCurrency(selectedNoteModal.amount)} (+
                  {selectedNoteModal.couponsFromThisNote} cupões)
                </strong>
              </div>

              <div className="flex items-center gap-2">
                {selectedNoteModal.receiptPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Trocar Foto
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = notes.find(
                      (n) => n.id === selectedNoteModal.id
                    );
                    if (target) {
                      handleInteractiveToggle(target);
                      setSelectedNoteModal({
                        ...target,
                        status:
                          target.status === 'na_urna' ? 'pendente' : 'na_urna',
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer ${
                    selectedNoteModal.status === 'na_urna'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-amber-100 text-amber-900 border-amber-400'
                  }`}
                >
                  {selectedNoteModal.status === 'na_urna'
                    ? '🗳️ Na Urna (Mudar p/ Pendente)'
                    : '⏳ Pendente (Colocar Na Urna)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
