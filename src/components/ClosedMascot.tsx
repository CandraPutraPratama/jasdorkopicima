'use client';

// Panggung animasi layar tutup: duo maskot Jasdor (karakter + kucing oren)
// digambar ulang gaya komik situs. Dua varian sesuai alasan tutup:
// - "tutup": toko tutup sesuai jadwal / luar jam buka (papan TUTUP bergoyang)
// - "istirahat": admin menutup sementara (karakter santai + kucing tidur)
// Animasi murni CSS di SVG (ringan, tanpa JS timer) dan diam total untuk
// pengguna dengan preferensi reduced-motion.

export function ClosedMascot({ variant }: { variant: 'tutup' | 'istirahat' }) {
  return (
    <div className="w-full mb-3.5" aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .cm-swing { transform-box: fill-box; transform-origin: top center; animation: cm-swing 3.2s ease-in-out infinite; }
          .cm-tail { transform-box: fill-box; transform-origin: bottom left; animation: cm-tail 2.4s ease-in-out infinite; }
          .cm-bob { animation: cm-bob 3.6s ease-in-out infinite; }
          .cm-breathe { transform-box: fill-box; transform-origin: bottom center; animation: cm-breathe 3.6s ease-in-out infinite; }
          .cm-steam { animation: cm-steam 2.6s ease-in-out infinite; }
          .cm-zzz { animation: cm-zzz 2.7s ease-out infinite; }
          @keyframes cm-swing { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
          @keyframes cm-tail { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(10deg); } }
          @keyframes cm-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          @keyframes cm-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
          @keyframes cm-steam { 0% { transform: translateY(2px); opacity: 0; } 35% { opacity: 0.9; } 100% { transform: translateY(-8px); opacity: 0; } }
          @keyframes cm-zzz { 0% { transform: translate(0, 4px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(6px, -14px); opacity: 0; } }
        }
      `}</style>
      {variant === 'tutup' ? (
        <svg viewBox="0 0 320 150" className="w-full h-auto" fill="none">
          <ellipse cx="160" cy="140" rx="130" ry="7" fill="#2B1D12" opacity="0.08" />
          {/* Toko */}
          <rect x="150" y="34" width="118" height="100" rx="10" fill="#FFF0C2" stroke="#2B1D12" strokeWidth="2.5" />
          <rect x="150" y="34" width="118" height="18" rx="8" fill="#C67D0A" stroke="#2B1D12" strokeWidth="2.5" />
          <rect x="164" y="34" width="14" height="18" fill="#FFFDF9" />
          <rect x="192" y="34" width="14" height="18" fill="#FFFDF9" />
          <rect x="220" y="34" width="14" height="18" fill="#FFFDF9" />
          <rect x="248" y="34" width="14" height="18" fill="#FFFDF9" />
          {/* Papan TUTUP bergoyang */}
          <g className="cm-swing">
            <line x1="186" y1="52" x2="186" y2="70" stroke="#2B1D12" strokeWidth="2" />
            <line x1="232" y1="52" x2="232" y2="70" stroke="#2B1D12" strokeWidth="2" />
            <rect x="172" y="70" width="74" height="34" rx="9" fill="#FFFDF9" stroke="#2B1D12" strokeWidth="2.5" />
            <text x="209" y="93" textAnchor="middle" fontSize="19" fontWeight="900" letterSpacing="1" fill="#2B1D12" fontFamily="inherit">TUTUP</text>
          </g>
          {/* Karakter */}
          <g className="cm-bob">
            <circle cx="72" cy="62" r="19" fill="#F6C89F" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M53 58 Q52 38 72 38 Q92 38 91 60 Q84 48 72 47 Q60 48 53 58 Z" fill="#2B1D12" />
            <path d="M64 60 Q68 57 72 60" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M78 60 Q82 57 86 60" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M66 70 Q72 75 78 70" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <rect x="52" y="81" width="40" height="52" rx="12" fill="#2B1D12" />
            <rect x="60" y="92" width="24" height="8" rx="4" fill="#C67D0A" />
            <path d="M92 96 Q108 100 104 112" stroke="#2B1D12" strokeWidth="6" strokeLinecap="round" />
            <rect x="100" y="106" width="18" height="20" rx="4" fill="#FFFDF9" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M118 110 h5 a3 3 0 0 1 0 8 h-5" stroke="#2B1D12" strokeWidth="2.5" />
          </g>
          {/* Kucing duduk */}
          <g>
            <ellipse cx="292" cy="122" rx="20" ry="13" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2.5" />
            <circle cx="292" cy="98" r="14" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M282 88 L280 76 L290 82 Z" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2" strokeLinejoin="round" />
            <path d="M302 88 L304 76 L294 82 Z" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2" strokeLinejoin="round" />
            <path d="M286 96 Q289 94 292 96" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M296 96 Q299 94 302 96" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M290 102 h4" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path className="cm-tail" d="M274 124 Q258 118 260 100" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 320 150" className="w-full h-auto" fill="none">
          <ellipse cx="160" cy="140" rx="130" ry="7" fill="#2B1D12" opacity="0.08" />
          {/* Karakter santai + kopi hangat */}
          <g className="cm-breathe">
            <circle cx="66" cy="62" r="19" fill="#F6C89F" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M47 58 Q46 38 66 38 Q86 38 85 60 Q78 48 66 47 Q54 48 47 58 Z" fill="#2B1D12" />
            <path d="M57 60 Q61 63 65 60" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M71 60 Q75 63 79 60" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M62 70 Q66 73 70 70" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <rect x="46" y="81" width="40" height="52" rx="12" fill="#2B1D12" />
            <rect x="54" y="92" width="24" height="8" rx="4" fill="#C67D0A" />
            <path d="M86 96 Q102 100 98 112" stroke="#2B1D12" strokeWidth="6" strokeLinecap="round" />
            <rect x="94" y="106" width="18" height="20" rx="4" fill="#FFFDF9" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M112 110 h5 a3 3 0 0 1 0 8 h-5" stroke="#2B1D12" strokeWidth="2.5" />
          </g>
          {/* Uap kopi */}
          <path className="cm-steam" d="M100 96 Q96 88 100 82 Q104 76 100 70" stroke="#7A6658" strokeWidth="2.5" strokeLinecap="round" />
          <path className="cm-steam" style={{ animationDelay: '1.1s' }} d="M110 96 Q106 88 110 82 Q114 76 110 70" stroke="#7A6658" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bantal + kucing tidur melingkar */}
          <ellipse cx="222" cy="130" rx="58" ry="11" fill="#FFF0C2" stroke="#2B1D12" strokeWidth="2.5" />
          <g className="cm-breathe">
            <ellipse cx="216" cy="112" rx="36" ry="17" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2.5" />
            <circle cx="248" cy="104" r="14" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2.5" />
            <path d="M238 94 L236 82 L246 88 Z" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2" strokeLinejoin="round" />
            <path d="M258 94 L260 82 L250 88 Z" fill="#F59E0B" stroke="#2B1D12" strokeWidth="2" strokeLinejoin="round" />
            <path d="M242 102 Q245 104 248 102" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M246 108 h4" stroke="#2B1D12" strokeWidth="2" strokeLinecap="round" />
            <path d="M184 118 Q196 128 214 126" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
          </g>
          {/* Huruf Z beterbangan */}
          <text className="cm-zzz" x="262" y="82" fontSize="16" fontWeight="900" fill="#7A6658" fontFamily="inherit">Z</text>
          <text className="cm-zzz" style={{ animationDelay: '0.9s' }} x="274" y="64" fontSize="20" fontWeight="900" fill="#7A6658" fontFamily="inherit">Z</text>
          <text className="cm-zzz" style={{ animationDelay: '1.8s' }} x="288" y="44" fontSize="24" fontWeight="900" fill="#7A6658" fontFamily="inherit">Z</text>
        </svg>
      )}
    </div>
  );
}
