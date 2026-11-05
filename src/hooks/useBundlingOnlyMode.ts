"use client";

import { useState, useEffect, useCallback } from "react";
import { isBundlingOnlyMode } from "@/lib/feature-flags";

export function useBundlingOnlyMode(): boolean {
  // Fallback awal membaca dari env var (default: false atau nilai build-time)
  const [isBundlingOnly, setIsBundlingOnly] =
    useState<boolean>(isBundlingOnlyMode());

  const fetchSetting = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings", {
        // Cache revalidation akan diatur oleh header HTTP s-maxage=30, stale-while-revalidate=60
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
        fetchSetting();
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
