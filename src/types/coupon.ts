export type CouponStatus = 'pendente' | 'na_urna';

export interface ReceiptNote {
  id: string;
  date: string; // YYYY-MM-DD
  buyer: string;
  amount: number; // Valor da Nota em R$
  couponsGenerated: number; // Calculado sequencialmente com o saldo acumulado
  status: CouponStatus;
  receiptPhotoUrl?: string; // DataURL real gerada via FileReader
  receiptPhotoName?: string;
  cooNumber?: string;
  notes?: string;
  createdAt: number;
}

export interface EnrichedReceiptNote extends ReceiptNote {
  previousCarryOver: number; // Saldo real que veio da nota anterior
  effectiveTotal: number; // amount + previousCarryOver
  couponsFromThisNote: number; // Cupons efetivamente gerados ao somar com o saldo anterior
  residualAfterNote: number; // Saldo pendente que sobrou para a próxima compra
}

export interface LedgerSummary {
  totalSpent: number;
  totalCoupons: number;
  couponsInUrna: number;
  couponsPending: number;
  pendingBalance: number; // Saldo Pendente REAL (acumula para a próxima compra)
  amountMissingForNextCoupon: number;
  progressPercentage: number;
  couponThreshold: number;
  enrichedNotes: EnrichedReceiptNote[];
}

export interface LowCostItemSuggestion {
  id: string;
  name: string;
  category: 'Caixa & Padaria' | 'Mercearia' | 'Limpeza & Higiene' | 'Laticínios & Bebidas';
  price: number;
  imageUrl: string;
  unit: string;
  popularTag?: string;
}

export interface SimulatedCartExtra {
  item: LowCostItemSuggestion;
  quantity: number;
}
