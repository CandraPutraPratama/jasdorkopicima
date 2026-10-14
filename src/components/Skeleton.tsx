export function OutletCardSkeleton() {
  return (
    <div className="p-4 bg-white border border-[#EFE5D8] rounded-2xl shadow-xs animate-pulse">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="h-5 bg-[#EFE5D8] rounded-md w-3/4" />
        <div className="h-5 bg-[#EFE5D8] rounded-full w-14" />
      </div>
      <div className="h-3.5 bg-[#F7F1E8] rounded w-full mb-1.5" />
      <div className="h-3.5 bg-[#F7F1E8] rounded w-2/3 mb-3" />
      <div className="flex justify-between items-center pt-2 border-t border-[#F2EAE0]">
        <div className="h-3 bg-[#F7F1E8] rounded w-24" />
        <div className="h-9 bg-[#EFE5D8] rounded-xl w-28" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="p-3.5 bg-white border border-[#EFE5D8] rounded-2xl shadow-xs animate-pulse flex gap-3">
      <div className="w-20 h-20 bg-[#EFE5D8] rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="h-4 bg-[#EFE5D8] rounded w-4/5 mb-1.5" />
          <div className="h-3 bg-[#F7F1E8] rounded w-full mb-1" />
          <div className="h-3 bg-[#F7F1E8] rounded w-2/3" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-4 bg-[#EFE5D8] rounded w-16" />
          <div className="h-3 bg-[#F7F1E8] rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function CategoryTabSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-hidden p-3 bg-[#FBF8F4] border-b border-[#EFE5D8]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 bg-[#EFE5D8] rounded-full w-20 shrink-0 animate-pulse" />
      ))}
    </div>
  );
}
