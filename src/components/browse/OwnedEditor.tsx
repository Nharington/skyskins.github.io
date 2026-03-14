import { useState } from 'react';
import { Calendar, Coins, PackageCheck, PackagePlus } from 'lucide-react';
import type { OwnedCosmeticEntry } from '../../lib/cosmetics';

export interface OwnedEditorProps {
  canViewIn3D: boolean;
  onRemove: () => void;
  onSave: (draft: { quantity: number; acquiredDate?: string; pricePaid?: number }) => void;
  onViewIn3D: () => void;
  selectedOwned?: OwnedCosmeticEntry;
}

export function OwnedEditor({ canViewIn3D, onRemove, onSave, onViewIn3D, selectedOwned }: OwnedEditorProps) {
  const [quantity, setQuantity] = useState(selectedOwned?.quantity ?? 1);
  const [acquiredDate, setAcquiredDate] = useState(selectedOwned?.acquiredDate ?? '');
  const [pricePaid, setPricePaid] = useState(selectedOwned?.pricePaid != null ? String(selectedOwned.pricePaid) : '');

  return (
    <div className="flex flex-col gap-3 border border-[#222] bg-[#111111] p-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">Owned details</div>
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#666]">
          {canViewIn3D ? '3D preview ready' : 'Browse-only preview'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 border-y border-[#1a1a1a] py-3 -mx-3 px-3 bg-[#0a0a0a]">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#666]">Quantity</span>
          <input
            type="number"
            min={0}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border border-[#222] bg-[#151515] px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#666]">
            <Calendar className="h-3 w-3 text-[#555]" />
            Acquired date
          </span>
          <input
            type="date"
            value={acquiredDate}
            onChange={(e) => setAcquiredDate(e.target.value)}
            className="w-full border border-[#222] bg-[#151515] px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#666]">
            <Coins className="h-3 w-3 text-[#555]" />
            Price paid
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="Optional"
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value)}
            className="w-full border border-[#222] bg-[#151515] px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[#444]"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <button
          onClick={() =>
            onSave({
              quantity,
              acquiredDate: acquiredDate.trim() === '' ? undefined : acquiredDate,
              pricePaid: pricePaid.trim() === '' ? undefined : Number(pricePaid),
            })
          }
          className="flex w-full items-center justify-center gap-1.5 border-b-2 border-emerald-700 bg-emerald-500 py-2 text-[9px] font-black uppercase tracking-widest text-[#052e16] transition-all hover:bg-emerald-400 active:translate-y-[1px] active:border-b-0"
        >
          {selectedOwned ? <PackageCheck className="h-3.5 w-3.5" /> : <PackagePlus className="h-3.5 w-3.5" />}
          {selectedOwned ? 'Save owned changes' : 'Add to owned'}
        </button>

        {selectedOwned && (
          <button
            onClick={onRemove}
            className="w-full border border-[#333] bg-[#1a1a1a] py-2 text-[9px] font-black uppercase tracking-widest text-[#bbb] transition-colors hover:border-[#555] hover:bg-[#202020] hover:text-white"
          >
            Remove from owned
          </button>
        )}

        <button
          onClick={onViewIn3D}
          disabled={!canViewIn3D}
          className={`w-full border py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
            canViewIn3D
              ? 'border-emerald-900/50 bg-[#0f251c] text-emerald-400 hover:border-emerald-600 hover:bg-[#123828] hover:text-emerald-300'
              : 'cursor-not-allowed border-[#1a1a1a] bg-[#0b0b0b] text-[#555]'
          }`}
        >
          {canViewIn3D ? 'View in 3D' : '3D preview unavailable'}
        </button>
      </div>
    </div>
  );
}
