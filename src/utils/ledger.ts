import { EnrichedReceiptNote, LedgerSummary, ReceiptNote } from '../types/coupon';

export const DEFAULT_COUPON_THRESHOLD = 100; // R$ 100,00 = 1 Cupom

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDateBR(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Calcula o histórico sequencial de todas as notas registadas,
 * acumulando o saldo residual pendente REAL de uma compra para a seguinte
 * utilizando múltiplos de R$ 100,00 (ou o valor configurado da campanha)
 * com precisão absoluta em centavos.
 */
export function computeLedgerSummary(
  notes: ReceiptNote[],
  couponThreshold: number = DEFAULT_COUPON_THRESHOLD
): LedgerSummary {
  const thresholdCents = Math.round(couponThreshold * 100);

  // Ordenar cronologicamente (mais antigas primeiro) para calcular o saldo progressivo real
  const chronological = [...notes].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt - b.createdAt;
  });

  let runningCarryOverCents = 0;
  let totalSpentCents = 0;
  let totalCoupons = 0;
  let couponsInUrna = 0;
  let couponsPending = 0;

  const enrichedChronological: EnrichedReceiptNote[] = chronological.map((note) => {
    const amountCents = Math.round(note.amount * 100);
    const previousCarryOverCents = runningCarryOverCents;
    const effectiveTotalCents = previousCarryOverCents + amountCents;

    const couponsFromThisNote =
      thresholdCents > 0 ? Math.floor(effectiveTotalCents / thresholdCents) : 0;
    const residualAfterNoteCents =
      thresholdCents > 0 ? effectiveTotalCents % thresholdCents : 0;

    runningCarryOverCents = residualAfterNoteCents;
    totalSpentCents += amountCents;
    totalCoupons += couponsFromThisNote;

    if (note.status === 'na_urna') {
      couponsInUrna += couponsFromThisNote;
    } else {
      couponsPending += couponsFromThisNote;
    }

    return {
      ...note,
      couponsGenerated: couponsFromThisNote,
      previousCarryOver: previousCarryOverCents / 100,
      effectiveTotal: effectiveTotalCents / 100,
      couponsFromThisNote,
      residualAfterNote: residualAfterNoteCents / 100,
    };
  });

  // Retornar na ordem inversa (mais recentes no topo da tabela)
  const enrichedDescending = [...enrichedChronological].reverse();

  const pendingBalance = runningCarryOverCents / 100;
  const missingCents =
    thresholdCents > 0 ? thresholdCents - runningCarryOverCents : 0;
  const amountMissingForNextCoupon = missingCents / 100;
  const progressPercentage =
    thresholdCents > 0
      ? Math.min(100, Math.round((runningCarryOverCents / thresholdCents) * 100))
      : 0;

  return {
    totalSpent: totalSpentCents / 100,
    totalCoupons,
    couponsInUrna,
    couponsPending,
    pendingBalance,
    amountMissingForNextCoupon,
    progressPercentage,
    couponThreshold,
    enrichedNotes: enrichedDescending,
  };
}

/**
 * Lê um arquivo de imagem real (foto da nota fiscal) via FileReader
 * e gera uma DataURL otimizada para persistência segura no localStorage.
 */
export function readReceiptFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1100;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
