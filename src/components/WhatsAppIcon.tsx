'use client';

import React from 'react';
import { OFFICIAL_WHATSAPP_PATH, OFFICIAL_WHATSAPP_COLOR } from '@/lib/whatsapp-icon';

export { OFFICIAL_WHATSAPP_PATH, OFFICIAL_WHATSAPP_COLOR };

export interface WhatsAppIconProps {
  className?: string;
  size?: number;
}

/**
 * Glif WhatsApp Resmi dari Simple Icons (SVG path standar resmi)
 */
export function WhatsAppIcon({
  className = 'w-4 h-4 text-[#25D366]',
  size = 24,
}: WhatsAppIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={OFFICIAL_WHATSAPP_PATH} />
    </svg>
  );
}
