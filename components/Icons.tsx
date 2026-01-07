
import React from 'react';

interface IconProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  isBoss?: boolean;
}

export const Icon = {
  Player: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "22"} height={props.height || "22"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 11v4" strokeOpacity="0.5" />
    </svg>
  ),
  Enemy: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.isBoss ? (props.width || "22") : (props.width || "18")} height={props.isBoss ? (props.height || "22") : (props.height || "18")} fill="none" stroke="currentColor" strokeWidth="2.5" className={props.isBoss ? "animate-pulse" : ""}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><circle cx="12" cy="7" r="2" fill="currentColor" opacity="0.5"/><path d="M12 12v4" strokeLinecap="round"/></svg>
  ),
  Chest: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 7H2v14h20V7z"/><path d="M2 7l10-5 10 5"/><path d="M12 22V7"/></svg>
  ),
  Key: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  Stairs: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 20h4v-4h4v-4h4v-4h4"/><path d="M2 20h4"/></svg>
  ),
  Potion: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2"/><path d="M8.5 2h7M7 13h10"/></svg>
  ),
  Merchant: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Altar: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 22h14"/><path d="M7 22v-3a5 5 0 0 1 10 0v3"/><path d="M12 2v5"/><circle cx="12" cy="11" r="2"/></svg>
  ),
  Gold: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "14"} height={props.height || "14"} fill="none" stroke="currentColor" strokeWidth="3" className="text-yellow-500"><circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
  ),
  Sword: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
    </svg>
  ),
  Swords: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
    </svg>
  ),
  Shield: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Boot: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 18l2-1 1-5 1.11-2.23a2 2 0 0 1 1.79-1.11H15a2 2 0 0 1 2 2v1l1 5-1 1-1 1H4z"/></svg>
  ),
  Heart: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  ),
  Wolf: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L9 7H6l2 4-3 5h4l3 5 3-5h4l-3-5 2-4h-3l-3-4z" fill="currentColor" fillOpacity="0.2"/>
      <path d="M9 7l-1-2M15 7l1-2" strokeWidth="2"/>
    </svg>
  ),
  Dog: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M11.25 16.25h1.5L12 17z"/>
      <path d="M16 14v.5"/>
      <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/>
      <path d="M8 14v.5"/>
      <path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>
    </svg>
  ),
  Panda: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
        <path d="M11.25 17.25h1.5L12 18z"/>
        <path d="m15 12 2 2"/>
        <path d="M18 6.5a.5.5 0 0 0-.5-.5"/>
        <path d="M20.69 9.67a4.5 4.5 0 1 0-7.04-5.5 8.35 8.35 0 0 0-3.3 0 4.5 4.5 0 1 0-7.04 5.5C2.49 11.2 2 12.88 2 14.5 2 19.47 6.48 22 12 22s10-2.53 10-7.5c0-1.62-.48-3.3-1.3-4.83"/>
        <path d="M6 6.5a.495.495 0 0 1 .5-.5"/>
        <path d="m9 12-2 2"/>
    </svg>
  ),
  Puma: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c0-3 2-5 5-5s5 2 5 5v2h2c2 0 3 1 3 3s-1 3-3 3h-12c-2 0-3-1-3-3s1-3 3-3h2v-2z" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="10" cy="8" r="1" fill="currentColor"/>
    </svg>
  ),
  Corvo: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7h.01" />
      <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
      <path d="m20 7 2 .5-2 .5" />
      <path d="M10 18v3" />
      <path d="M14 17.75V21" />
      <path d="M7 18a6 6 0 0 0 3.84-10.61" />
    </svg>
  ),
  Owl: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 4 7 7v4c0 4 3 7 5 7s5-3 5-7V7c0-3-2-5-5-5z" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="10" cy="7" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="7" r="1.5" fill="currentColor"/>
      <path d="M12 10l-1 1h2l-1-1z" fill="currentColor"/>
    </svg>
  ),
  Horse: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "20"} height={props.height || "20"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20l3-4h4l3 4" />
      <path d="M17 14s2-2 2-5-3-5-3-5l-4 3-4-3s-3 2-3 5 2 5 2 5h10z" fill="currentColor" fillOpacity="0.2" />
      <path d="M10 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM14 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
    </svg>
  ),
  Backpack: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
      <path d="M8 10h8" />
      <path d="M8 18h8" />
    </svg>
  ),
  Trees: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 5.3-2.1" />
        <path d="M7 16v6" />
        <path d="M13 19v3" />
        <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .9-1.7l-2-3a1 1 0 0 0-1.7 0l-2 3a1 1 0 0 0 .9 1.7L14 9" />
    </svg>
  ),
  Droplets: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z"/></svg>
  ),
  ShieldAlert: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  Eye: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Zap: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  Hourglass: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
  ),
  FlaskConical: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2"/><path d="M8.5 2h7"/></svg>
  ),
  RefreshCcw: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
  ),
  Brain: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5 5 0 0 1 12 7.3V12h4.5a5 5 0 0 1 0 10H12v-5a5 5 0 0 0-5-5H2a5 5 0 0 1 7.5-3.3"/><path d="M14.5 2A5 5 0 0 0 12 7.3V12H7.5a5 5 0 0 0 0 10H12v-5a5 5 0 0 1 5-5H22a5 5 0 0 0-7.5-3.3"/></svg>
  ),
  Sparkles: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/><path d="M5 3 4 4"/><path d="M19 3l1 1"/><path d="M5 21l-1-1"/><path d="M19 21l1-1"/></svg>
  ),
  Skull: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v1a2 2 0 0 0 2 2 1 1 0 0 1 1 1v3a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-3a1 1 0 0 1 1-1 2 2 0 0 0 2-2v-1a8 8 0 0 0-8-8z"/><path d="M10 16h4"/></svg>
  ),
  Coins: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18.06"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
  ),
  CircleDollarSign: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
  ),
  HeartOff: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21l-7-7c-3-3-3-8.5 1-11.5l1 1"/><path d="M19 14c1.5-1.5 3-3.2 3-5.5a5.5 5.5 0 0 0-4.5-5.4"/><path d="M12 7.5L3 12"/><path d="M2 2l20 20"/></svg>
  ),
  Flame: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.291 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  ),
  Ghost: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>
  ),
  Volume2: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
  ),
  VolumeX: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
  ),
  MessageCircle: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "14"} height={props.height || "14"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  ),
  Share: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
  ),
  Users: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  FlagBR: () => (
    <svg viewBox="0 0 32 24" width="24" height="18"><rect width="32" height="24" fill="#009c3b"/><path d="M16 3l13 9-13 9L3 12z" fill="#ffdf00"/><circle cx="16" cy="12" r="5" fill="#002776"/></svg>
  ),
  FlagUS: () => (
    <svg viewBox="0 0 32 24" width="24" height="18"><rect width="32" height="24" fill="#b22234"/><path d="M0 0h14v13H0z" fill="#3c3b6e"/><path d="M0 2h32M0 5.3h32M0 8.6h32M0 12h32M0 15.3h32M0 18.6h32M0 22h32" stroke="#fff" strokeWidth="1.6"/><path d="M0 0h14v13H0z" fill="#3c3b6e"/></svg>
  ),
  FlagES: () => (
    <svg viewBox="0 0 32 24" width="24" height="18"><rect width="32" height="24" fill="#aa151b"/><rect y="6" width="32" height="12" fill="#ffc400"/><rect y="18" width="32" height="6" fill="#aa151b"/></svg>
  ),
  Compass: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
  ),
  Map: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "16"} height={props.height || "16"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
  ),
  Antidote: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31" />
        <path d="M14 2v7.31" />
        <path d="M8.5 2h7" />
        <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
    </svg>
  ),
  Trap: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.5"/></svg>
  ),
  Egg: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z" /><path d="M9.5 10a2.5 2.5 0 0 1 0 5" opacity="0.5"/></svg>
  ),
  Lock: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  ChevronRight: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  ),
  Music: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
  ),
  Headphones: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3" /><path d="M2 19h3a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H2a2 2 0 0 0-2 2v4a1 1 0 0 0 2 1z" /><path d="M22 19h-3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h3a2 2 0 0 1 2 2v4a1 1 0 0 1-2 1z" /></svg>
  ),
  TriangleAlert: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  Ladder: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v20" />
        <path d="M16 2v20" />
        <path d="M8 6h8" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
        <path d="M8 18h8" />
    </svg>
  ),
  Activity: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  ShoppingBag: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Play: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  HelpCircle: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width={props.width || "18"} height={props.height || "18"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
    </svg>
  ),
};
