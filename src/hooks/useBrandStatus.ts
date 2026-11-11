"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchBootstrap, getCachedBootstrap } from "@/lib/client-bootstrap";

export const DEFAULT_BRAND_STATUS: Record<string, boolean> = {
  "kopi-kenangan": true,
  fore: true,
  tomoro: true,
};

export function useBrandStatus() {
  const [brandStatus, setBrandStatus] = useState<Record<string, boolean>>(() => {
    return getCachedBootstrap()?.siteSettings?.brand_status ?? DEFAULT_BRAND_STATUS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!getCachedBootstrap()?.siteSettings);

  const fetchBrandStatus = useCallback(async (force = false) => {
    try {
      // Nomor 3: Ambil dari endpoint bootstrap terpadu untuk memangkas pemanggilan berulang
      const bootstrap = await fetchBootstrap(force);
      if (bootstrap?.siteSettings?.brand_status) {
        setBrandStatus((prev) => ({
          ...prev,
          ...bootstrap.siteSettings.brand_status,
        }));
        setIsLoading(false);
        return;
      }

      // Fallback ke endpoint individual jika bootstrap tidak tersedia
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
        fetchBrandStatus(true);
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
