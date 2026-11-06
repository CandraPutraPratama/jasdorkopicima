'use client';

import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/currency';
import {
  type BundlePackageConfig,
  getBundlingRemainingTime,
  shouldShowBundlingCountdown,
  getBundleDescription,
} from '@/lib/bundling';

interface BundlePackageCardProps {
  config: BundlePackageConfig;
  onSelect: (config: BundlePackageConfig) => void;
  isOutletClosed?: boolean;
  tierDiff?: number;
}

export function BundlePackageCard({
  config,
  onSelect,
  isOutletClosed = false,
  tierDiff = 0,
}: BundlePackageCardProps) {
  const [countdown, setCountdown] = useState(() => getBundlingRemainingTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getBundlingRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const safeTier = Math.max(0, tierDiff);
  const cardDescription = getBundleDescription(config.id, safeTier);

  // Estimasi harga mulai dari (rentang 50.000 - 60.000)
  const startingPrice =
    config.id === 'bundle-3-reguler'
      ? 29500 // (51k x 50% + 4k = 29.5k)
      : config.id === 'bundle-2-large'
        ? 29500 // (50k x 50% + 4.5k = 29.5k)
        : 32000; // (52k x 50% + 6k = 32k)

  return (
    <div className="bg-[#FFFDF9] border-2 border-[#2B1D12] rounded-2xl p-4 shadow-[3px_3px_0px_#2B1D12] flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#2B1D12] transition-all relative overflow-hidden group">
      {/* Header Badge Terpadu & Rapi */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 px-2 py-0.5 rounded-lg">
            Diskon 50%
          </span>
          <span className="text-[11px] font-bold text-[#2B1D12] bg-[#FFE7D6] border border-[#2B1D12]/20 px-2 py-0.5 rounded-lg">
            {config.badge}
          </span>
        </div>

        {shouldShowBundlingCountdown() && (
          <span className="text-[10px] font-semibold text-[#7A6658] bg-[#FAF4E8] border border-[#2B1D12]/15 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <span>⏳</span>
            <span>{countdown.formatted}</span>
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold font-display text-[#2B1D12] leading-tight group-hover:text-[#C67D0A] transition-colors">
            {config.name}
          </span>
        </div>
        <p className="text-xs text-[#5C4535] font-normal line-clamp-2 leading-relaxed">
          {cardDescription}
        </p>
      </div>

      {/* Rincian Pricing & Action CTA */}
      <div className="mt-3 pt-3 border-t border-[#2B1D12]/10 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-[#7A6658]">Mulai dari</span>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-black text-base text-[#DC2626]">
              {formatRupiah(startingPrice)}
            </span>
          </div>
          <span className="text-[10px] font-medium text-[#5C4535]">
            {`fee jasa ${formatRupiah(config.fee)}/paket`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(config)}
          disabled={isOutletClosed}
          className={`px-4 py-2 rounded-xl font-display font-bold text-xs transition border-2 border-[#2B1D12] flex items-center gap-1.5 shrink-0 ${
            isOutletClosed
              ? 'bg-[#FAF4E8] text-[#7A6658] border-[#2B1D12]/30 cursor-not-allowed opacity-75'
              : 'bg-[#2B1D12] text-[#FAF4E8] hover:bg-[#3D2817] shadow-[2px_2px_0px_#C67D0A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
          }`}
        >
          <span>Pilih Isi</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
