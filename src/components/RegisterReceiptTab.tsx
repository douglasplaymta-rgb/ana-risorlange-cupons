import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FilePlus2,
  Calendar,
  User,
  DollarSign,
  Camera,
  Sparkles,
  CheckCircle2,
  Clock,
  Ticket,
  Upload,
  Trash2,
  Hash,
  FileText,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { CouponStatus, ReceiptNote } from '../types/coupon';
import {
  formatCurrency,
  formatDateBR,
  readReceiptFileAsDataURL,
} from '../utils/ledger';

interface RegisterReceiptTabProps {
  pendingBalance: number;
  couponThreshold: number;
  existingBuyers: string[];
  prefilledAmount?: number | null;
  prefilledNotes?: string;
  onClearPrefill?: () => void;
  onSaveReceipt: (newNote: Omit<ReceiptNote, 'id' | 'createdAt'>) => void;
  onGoToHistory: () => void;
}

export const RegisterReceiptTab: React.FC<RegisterReceiptTabProps> = ({
  pendingBalance,
  couponThreshold,
  existingBuyers,
  prefilledAmount,
  prefilledNotes,
  onClearPrefill,
  onSaveReceipt,
  onGoToHistory,
}) => {
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [date, setDate] = useState<string>(todayISO);
  const [buyer, setBuyer] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [cooNumber, setCooNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<CouponStatus>('pendente');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string>('');
  const [receiptPhotoName, setReceiptPhotoName] = useState<string>('');
  const [isReadingPhoto, setIsReadingPhoto] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{
    buyer: string;
    amount: number;
    coupons: number;
    hasPhoto: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preenche automaticamente caso o utilizador venha da Aba 1 ("Alerta do Caixa")
  useEffect(() => {
    if (prefilledAmount && prefilledAmount > 0) {
      setAmountStr(prefilledAmount.toFixed(2).replace('.', ','));
      if (prefilledNotes) {
        setNotes(prefilledNotes);
      }
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefilledAmount, prefilledNotes, onClearPrefill]);

  const parsedAmount = useMemo(() => {
    if (!amountStr.trim()) return 0;
    const normalized = amountStr.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [amountStr]);

  // Cálculo em tempo real do impacto desta nota antes mesmo de salvar
  const previewMath = useMemo(() => {
    const thresholdCents = Math.round(couponThreshold * 100);
    const amountCents = Math.round(parsedAmount * 100);
    const prevCents = Math.round(pendingBalance * 100);
    const combinedCents = amountCents + prevCents;

    const couponsGenerated =
      thresholdCents > 0 ? Math.floor(combinedCents / thresholdCents) : 0;
    const newResidualCents =
      thresholdCents > 0 ? combinedCents % thresholdCents : 0;

    return {
      combinedTotal: combinedCents / 100,
      couponsGenerated,
      newResidual: newResidualCents / 100,
    };
  }, [parsedAmount, pendingBalance, couponThreshold]);

  // Processa arquivo de imagem real via FileReader -> DataURL
  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, etc.).');
      return;
    }
    setErrorMsg('');
    setIsReadingPhoto(true);
    try {
      const dataUrl = await readReceiptFileAsDataURL(file);
      setReceiptPhotoUrl(dataUrl);
      setReceiptPhotoName(file.name);
    } catch {
      setErrorMsg('Não foi possível ler a imagem selecionada. Tente novamente.');
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!date) {
      setErrorMsg('Por favor, informe a data da compra.');
      return;
    }
    if (!buyer.trim()) {
      setErrorMsg('Por favor, informe o nome do comprador.');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Por favor, digite um valor válido para a nota fiscal (maior que R$ 0,00).');
      return;
    }

    onSaveReceipt({
      date,
      buyer: buyer.trim(),
      amount: parsedAmount,
      couponsGenerated: previewMath.couponsGenerated,
      status,
      cooNumber: cooNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      receiptPhotoUrl: receiptPhotoUrl || undefined,
      receiptPhotoName: receiptPhotoName || undefined,
    });

    if (previewMath.couponsGenerated > 0) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    setSavedSuccessInfo({
      buyer: buyer.trim(),
      amount: parsedAmount,
      coupons: previewMath.couponsGenerated,
      hasPhoto: Boolean(receiptPhotoUrl),
    });

    // Limpa os campos de valor, observações e foto para o próximo registo real
    setAmountStr('');
    setCooNumber('');
    setNotes('');
    setReceiptPhotoUrl('');
    setReceiptPhotoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLUNA ESQUERDA (7 cols): Formulário Principal de Registo da Nota Real */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0B224C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FilePlus2 className="w-5 h-5 text-[#F97316]" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0B224C]">
                Registar Nota Fiscal / Nota Fiscal Real
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Cadastre sua compra e faça upload da foto real da Nota Fiscal para salvar no histórico local
              </p>
            </div>
          </div>
        </div>

        {/* Banner de Sucesso após salvar */}
        {savedSuccessInfo && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-extrabold text-sm">
                  Nota de {formatCurrency(savedSuccessInfo.amount)} salva com sucesso!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Comprador: <strong>{savedSuccessInfo.buyer}</strong> • Gerou{' '}
                  <strong>+{savedSuccessInfo.coupons} cupões</strong>
                  {savedSuccessInfo.hasPhoto ? ' • Foto da Nota Fiscal salva!' : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToHistory}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              Ver na Urna e Histórico →
            </button>
          </div>
        )}

        {/* Banner de Erro se faltar dado */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Linha 1: Data da Compra + Nº do Talão / COO opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="note-date"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#103D8C]" />
                  Data da Compra *
                </label>
                <button
                  type="button"
                  onClick={() => setDate(todayISO)}
                  className="text-[11px] font-bold text-[#F97316] hover:underline cursor-pointer"
                >
                  Usar Hoje
                </button>
              </div>
              <input
                id="note-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#103D8C] focus:bg-white focus:outline-none text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor="note-coo"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5"
              >
                <Hash className="w-3.5 h-3.5 text-[#103D8C]" />
                Nº da Nota Fiscal / COO (Opcional)
              </label>
              <input
                id="note-coo"
                type="text"
                value={cooNumber}
                onChange={(e) => setCooNumber(e.target.value)}
                placeholder="Ex: 048291"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#103D8C] focus:bg-white focus:outline-none font-mono-num text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Linha 2: Comprador Real */}
          <div>
            <label
              htmlFor="note-buyer"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#103D8C]" />
              Nome do Comprador *
            </label>
            <input
              id="note-buyer"
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="Digite o nome de quem realizou a compra"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#103D8C] focus:bg-white focus:outline-none text-sm font-semibold text-slate-800"
            />
            {existingBuyers.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Compradores anteriores:
                </span>
                {existingBuyers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setBuyer(name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      buyer === name
                        ? 'bg-[#0B224C] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Linha 3: Valor da Nota em R$ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="note-amount"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#F97316]" />
                Valor Total da Nota Fiscal (R$) *
              </label>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono-num text-lg font-extrabold text-[#103D8C]">
                R$
              </span>
              <input
                id="note-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-[#F97316] focus:bg-white focus:outline-none font-mono-num text-xl font-extrabold text-[#0B224C]"
              />
            </div>
          </div>

          {/* Linha 4: Observação opcional */}
          <div>
            <label
              htmlFor="note-obs"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#103D8C]" />
              Observação da Compra (Opcional)
            </label>
            <input
              id="note-obs"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compras do mês, Hortifruti e Padaria..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#103D8C] focus:bg-white focus:outline-none text-xs sm:text-sm text-slate-700"
            />
          </div>

          {/* Linha 5: UPLOAD REAL DA FOTO DO TALÃO (FileReader / DataURL) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <Camera className="w-3.5 h-3.5 text-[#F97316]" />
              Upload Real da Foto da Nota Fiscal / Nota Fiscal
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!receiptPhotoUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition-all space-y-3 cursor-pointer ${
                  isDraggingOver
                    ? 'border-[#F97316] bg-[#FFF7ED]'
                    : 'border-slate-300 hover:border-[#F97316] bg-slate-50/70 hover:bg-orange-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] flex items-center justify-center mx-auto shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0B224C]">
                    {isReadingPhoto
                      ? 'Processando foto do talão...'
                      : 'Clique aqui para enviar ou tirar foto da Nota Fiscal'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Suporta fotos da câmara do celular ou galeria (JPG, PNG, WEBP). A imagem fica salva localmente neste dispositivo.
                  </p>
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B224C] hover:bg-[#103D8C] text-white text-xs font-bold shadow-xs transition-all">
                    <Camera className="w-4 h-4 text-[#F97316]" />
                    Selecionar Foto da Nota Fiscal
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={receiptPhotoUrl}
                    alt="Foto Real da Nota Fiscal"
                    className="w-16 h-20 object-cover rounded-xl border border-slate-300 shadow-xs bg-white shrink-0"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Foto Real Carregada
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#0B224C] mt-1 truncate max-w-[230px]">
                      {receiptPhotoName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Pronta para salvar no histórico local (DataURL)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0B224C] hover:border-[#F97316] cursor-pointer"
                  >
                    Trocar Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptPhotoUrl('');
                      setReceiptPhotoName('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    title="Remover foto do talão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Linha 6: Estado Inicial dos Cupons (Pendente vs Na Urna) */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Situação Atual dos Cupons desta Nota
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  status === 'pendente'
                    ? 'border-amber-400 bg-amber-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'pendente'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    ⏳ Pendente (Em Mãos)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ainda vou preencher e depositar na urna
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('na_urna')}
                className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  status === 'na_urna'
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'na_urna'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    🗳️ Já Depositado Na Urna
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cupons já estão concorrendo no mercado
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Botão Principal Laranja Vibrante */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-display font-extrabold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Ticket className="w-5 h-5" />
            <span>
              Salvar Nota no Histórico
              {parsedAmount > 0
                ? ` (+${previewMath.couponsGenerated} ${
                    previewMath.couponsGenerated === 1 ? 'Cupom' : 'Cupons'
                  })`
                : ''}
            </span>
          </button>
        </form>
      </div>

      {/* COLUNA DIREITA (5 cols): Pré-visualização em Tempo Real do Cálculo e da Foto Anexada */}
      <div className="lg:col-span-5 space-y-5">
        {/* Card de Simulação de Impacto antes de Salvar */}
        <div className="bg-[#0B224C] text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FDBA74] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Cálculo Automático da Nota
            </span>
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full text-blue-200 font-semibold">
              Salvo em localStorage
            </span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-blue-200">
              <span>Valor digitado da nota:</span>
              <span className="font-mono-num font-bold text-white">
                {formatCurrency(parsedAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-blue-200">
              <span>+ Saldo Pendente salvo:</span>
              <span className="font-mono-num font-bold text-emerald-300">
                + {formatCurrency(pendingBalance)}
              </span>
            </div>
            <div className="pt-2.5 border-t border-white/15 flex items-center justify-between font-bold">
              <span className="text-blue-100">Base somada p/ cupões:</span>
              <span className="font-mono-num text-lg text-white">
                {formatCurrency(previewMath.combinedTotal)}
              </span>
            </div>
          </div>

          {/* Resultado de Cupões e Novo Saldo */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Cupons Desta Nota
              </span>
              <span className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#FDBA74] mt-1 block">
                +{previewMath.couponsGenerated}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Novo Saldo Pendente
              </span>
              <span className="font-mono-num text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1.5 block">
                {formatCurrency(previewMath.newResidual)}
              </span>
            </div>
          </div>
        </div>

        {/* Pré-visualização da Foto Real do Talão Fiscal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold text-[#0B224C] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#F97316]" />
              Foto da Nota Fiscal Anexada
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-[#103D8C] hover:text-[#F97316] underline cursor-pointer"
            >
              {receiptPhotoUrl ? 'Alterar Foto' : 'Carregar Foto'}
            </button>
          </div>

          {receiptPhotoUrl ? (
            <div className="rounded-xl bg-slate-100 p-3 flex flex-col items-center justify-center gap-2">
              <img
                src={receiptPhotoUrl}
                alt="Foto Real da Nota Fiscal Fiscal"
                className="w-full max-h-[340px] object-contain rounded-xl shadow-md bg-white"
              />
              <span className="text-[11px] font-medium text-slate-500">
                {receiptPhotoName} • {formatDateBR(date)}
              </span>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center space-y-2 cursor-pointer hover:border-[#F97316] transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600">
                Nenhuma foto selecionada ainda
              </p>
              <p className="text-[11px] text-slate-400">
                Ao fazer o upload da foto da Nota Fiscal, ela aparecerá aqui e ficará disponível no botão “Ver Nota Fiscal” do histórico.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
