"use client";

import { useState, useEffect, useCallback } from "react";

export const DEFAULT_BRAND_STATUS: Record<string, boolean> = {
  "kopi-kenangan": true,
  fore: true,
  tomoro: true,
};

export function useBrandStatus() {
  const [brandStatus, setBrandStatus] =
    useState<Record<string, boolean>>(DEFAULT_BRAND_STATUS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBrandStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings", {
        next: { revalidate: 30 },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.brand_status && typeof data.brand_status === "object") {
        setBrandStatus((prev) => ({
          ...prev,
          ...data.brand_status,
        }));
      }
    } catch (err) {
      console.warn("[useBrandStatus] Gagal memuat status brand:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBrandStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling setiap 3 menit (hemat CPU Worker Free); lewati bila tab tersembunyi
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchBrandStatus();
    }, 180000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchBrandStatus]);

  const isBrandActive = useCallback(
    (slug: string): boolean => {
      if (typeof brandStatus[slug] === "boolean") {
        return brandStatus[slug];
      }
      return true;
    },
    [brandStatus],
  );

  return {
    brandStatus,
    isBrandActive,
    isLoading,
    refetch: fetchBrandStatus,
  };
}
