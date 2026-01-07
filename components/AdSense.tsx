
import React, { useEffect, useRef } from 'react';

interface AdSenseProps {
  slot: string;
  style?: React.CSSProperties;
  format?: string;
  layoutKey?: string;
  className?: string;
}

export const AdSense: React.FC<AdSenseProps> = ({ slot, style, format = 'auto', layoutKey, className }) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Evita inicialização dupla em React Strict Mode ou re-renders rápidos
    if (initialized.current) return;

    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        initialized.current = true;
      }
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className={`adsense-container w-full flex justify-center my-4 ${className || ''}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '250px', ...style }}
        data-ad-client="ca-pub-9008898113062079"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-ad-layout-key={layoutKey}
      />
    </div>
  );
};
