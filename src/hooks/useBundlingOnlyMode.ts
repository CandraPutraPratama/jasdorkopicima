"use client";

import { useState, useEffect, useCallback } from "react";
import { isBundlingOnlyMode } from "@/lib/feature-flags";
import { fetchBootstrap, getCachedBootstrap } from "@/lib/client-bootstrap";

export function useBundlingOnlyMode(): boolean {
  // Fallback awal membaca dari cache bootstrap atau env var (default: false atau nilai build-time)
  const [isBundlingOnly, setIsBundlingOnly] = useState<boolean>(() => {
    const cached = getCachedBootstrap();
    if (typeof cached?.siteSettings?.min_order_50k_mode === 'boolean') {
      return cached.siteSettings.min_order_50k_mode;
    }
    return isBundlingOnlyMode();
  });

  const fetchSetting = useCallback(async (force = false) => {
    try {
      // Nomor 3: Ambil dari endpoint bootstrap terpadu untuk memangkas pemanggilan berulang
      const bootstrap = await fetchBootstrap(force);
      if (typeof bootstrap?.siteSettings?.min_order_50k_mode === 'boolean') {
        setIsBundlingOnly(bootstrap.siteSettings.min_order_50k_mode);
        return;
      }

      // Fallback ke endpoint individual jika bootstrap belum tersedia
      const res = await fetch("/api/site-settings", {
        next: { revalidate: 30 },
      });
      if (!res.ok) return;
      const data = await res.json();
      const modeValue =
        typeof data?.min_order_50k_mode === "boolean"
          ? data.min_order_50k_mode
          : typeof data?.bundling_only_mode === "boolean"
            ? data.bundling_only_mode
            : undefined;
      if (typeof modeValue === "boolean") {
        setIsBundlingOnly(modeValue);
      }
    } catch {
      // Fallback diam (graceful fallback) jika offline atau API gagal
    }
  }, []);

  useEffect(() => {
    // Ambil nilai terbaru saat komponen dimount
    fetchSetting();

    // Re-fetch saat tab kembali aktif
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSetting(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Polling setiap 3 menit (hemat CPU Worker Free); lewati bila tab tersembunyi.
    // Perubahan admin tetap tercermin saat tab kembali aktif (visibilitychange).
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchSetting();
    }, 180000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchSetting]);

  return isBundlingOnly;
}

export const useMinOrder50kMode = useBundlingOnlyMode;
