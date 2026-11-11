import React from "react";

export type MascotVariant = "advisor" | "empty" | "welcome" | "sticker" | "bep";

interface CuteBananaMascotProps {
  variant?: MascotVariant;
  className?: string;
  size?: number;
}

export function CuteBananaMascot({
  variant = "advisor",
  className = "",
  size = 64,
}: CuteBananaMascotProps) {
  // Render vector SVG chibi characters with pastel sakura palette & micro-animations
  if (variant === "advisor") {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="overflow-visible animate-bounce-subtle"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bananaGrad" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="60%" stopColor="#FEE440" />
              <stop offset="100%" stopColor="#FBC02D" />
            </radialGradient>
            <linearGradient id="blushPink" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="apronGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF1F3" />
              <stop offset="100%" stopColor="#FFE4E9" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F43F5E" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Sparkles */}
          <path
            d="M 18,22 Q 22,20 20,16 Q 18,20 14,22 Q 18,24 20,28 Q 22,24 26,22 Z"
            fill="#F59E0B"
            className="animate-pulse"
          />
          <path
            d="M 98,28 Q 102,26 100,22 Q 98,26 94,28 Q 98,30 100,34 Q 102,30 106,28 Z"
            fill="#EC4899"
            className="animate-pulse"
          />

          {/* Main Body - Kawaii curved Banana Chibi */}
          <path
            d="M 32,88 C 22,72 24,42 42,28 C 58,16 84,20 92,38 C 100,56 94,84 66,94 C 50,100 38,98 32,88 Z"
            fill="url(#bananaGrad)"
            filter="url(#softGlow)"
          />

          {/* Banana Stem Tip with cute green cap */}
          <path d="M 40,29 C 36,25 36,18 42,16 C 45,15 48,18 47,24 Z" fill="#84CC16" />

          {/* Soft Cheeks Blush */}
          <ellipse cx="44" cy="58" rx="7" ry="4" fill="url(#blushPink)" opacity="0.65" />
          <ellipse cx="80" cy="60" rx="7" ry="4" fill="url(#blushPink)" opacity="0.65" />

          {/* Kawaii Eyes */}
          <circle cx="48" cy="50" r="4.5" fill="#2D1B2D" />
          <circle cx="50" cy="48" r="1.5" fill="#FFFFFF" />
          <circle cx="76" cy="52" r="4.5" fill="#2D1B2D" />
          <circle cx="78" cy="50" r="1.5" fill="#FFFFFF" />

          {/* Smart Advisor Glasses (Round Gold Specs) */}
          <circle cx="48" cy="50" r="10" fill="none" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="76" cy="52" r="10" fill="none" stroke="#D97706" strokeWidth="2.5" />
          <path d="M 58,50 Q 62,48 66,51" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

          {/* Happy Mouth */}
          <path
            d="M 58,60 Q 63,67 68,60"
            fill="none"
            stroke="#9F1239"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Cute Pink Apron */}
          <path
            d="M 42,70 Q 62,68 80,72 L 77,90 Q 60,94 45,88 Z"
            fill="url(#apronGrad)"
            stroke="#FDE8ED"
            strokeWidth="1.5"
          />
          {/* Strawberry icon on apron */}
          <circle cx="61" cy="79" r="4" fill="#F43F5E" />
          <path d="M 59,75 L 63,75" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />

          {/* Little Hands holding calculator */}
          <circle cx="34" cy="68" r="4.5" fill="#FEE440" />
          {/* Mini Calculator */}
          <rect
            x="76"
            y="65"
            width="18"
            height="22"
            rx="4"
            fill="#FFFFFF"
            stroke="#F472B6"
            strokeWidth="1.5"
            transform="rotate(10 85 76)"
          />
          <rect x="79" y="68" width="12" height="5" rx="1.5" fill="#EC4899" transform="rotate(10 85 76)" />
          <circle cx="82" cy="78" r="1.2" fill="#7A6273" />
          <circle cx="87" cy="79" r="1.2" fill="#7A6273" />
          <circle cx="83" cy="83" r="1.2" fill="#7A6273" />
          <circle cx="88" cy="84" r="1.2" fill="#F43F5E" />
        </svg>
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="overflow-visible animate-wiggle"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="emptyGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="65%" stopColor="#FEE440" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>

          {/* Sleeping / Relaxing Zzz bubbles */}
          <text x="85" y="28" fill="#F472B6" fontSize="14" fontWeight="bold" className="animate-pulse">
            ✦
          </text>
          <text x="96" y="18" fill="#FB7185" fontSize="10" fontWeight="bold">
            z
          </text>

          {/* Main Chibi Form */}
          <path
            d="M 30,82 C 18,65 24,35 45,26 C 65,18 85,26 90,48 C 94,68 84,88 60,92 C 45,94 34,92 30,82 Z"
            fill="url(#emptyGrad)"
          />

          {/* Green Stem */}
          <path d="M 42,28 C 38,22 40,16 45,15 C 48,15 49,19 48,24 Z" fill="#84CC16" />

          {/* Happy Closed Eyes (Arc) */}
          <path d="M 44,52 Q 49,46 54,52" fill="none" stroke="#2D1B2D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 70,54 Q 75,48 80,54" fill="none" stroke="#2D1B2D" strokeWidth="2.5" strokeLinecap="round" />

          {/* Blush */}
          <circle cx="42" cy="58" r="5" fill="#FDA4AF" opacity="0.7" />
          <circle cx="82" cy="60" r="5" fill="#FDA4AF" opacity="0.7" />

          {/* Sweet Smile */}
          <path d="M 58,62 Q 62,67 66,62" fill="none" stroke="#9F1239" strokeWidth="2.2" strokeLinecap="round" />

          {/* Holding a Cup of Asinan */}
          <g transform="translate(46, 68)">
            {/* Cup */}
            <path d="M 4,6 L 24,6 L 21,24 Q 14,26 7,24 Z" fill="#FFF1F3" stroke="#F43F5E" strokeWidth="1.5" />
            {/* Asinan Fruit chunks inside */}
            <circle cx="10" cy="11" r="3" fill="#F59E0B" />
            <circle cx="17" cy="10" r="3.5" fill="#EF4444" />
            <circle cx="14" cy="15" r="2.5" fill="#84CC16" />
            {/* Straw */}
            <path d="M 18,10 L 25,0" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === "welcome") {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="overflow-visible animate-bounce-subtle"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="welcGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="60%" stopColor="#FEE440" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>

          {/* Chef / Bakery Beret Hat */}
          <ellipse cx="60" cy="22" rx="20" ry="8" fill="#FFFFFF" stroke="#FDE8ED" strokeWidth="1.5" />
          <path
            d="M 44,22 C 40,8 80,8 76,22 Z"
            fill="#FFF1F3"
            stroke="#FDE8ED"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="10" r="3" fill="#F43F5E" />

          {/* Body */}
          <path
            d="M 32,86 C 20,70 24,38 45,28 C 65,18 88,24 92,44 C 96,66 86,88 64,94 C 48,98 36,96 32,86 Z"
            fill="url(#welcGrad)"
          />

          {/* Blushing cheeks */}
          <circle cx="44" cy="56" r="6" fill="#FDA4AF" opacity="0.7" />
          <circle cx="80" cy="58" r="6" fill="#FDA4AF" opacity="0.7" />

          {/* Sparkly Winking Eyes */}
          <circle cx="48" cy="48" r="5" fill="#2D1B2D" />
          <circle cx="50" cy="46" r="1.8" fill="#FFFFFF" />
          {/* Wink on right */}
          <path d="M 72,50 Q 77,44 82,50" fill="none" stroke="#2D1B2D" strokeWidth="3" strokeLinecap="round" />

          {/* Big Cheerful Smile with pink tongue */}
          <path
            d="M 56,58 Q 63,70 70,58 Z"
            fill="#F43F5E"
            stroke="#9F1239"
            strokeWidth="1.5"
          />
          <path d="M 59,64 Q 63,62 67,64" fill="#FDA4AF" />

          {/* Waving Hand on left */}
          <path
            d="M 30,52 C 20,44 14,36 18,32 C 22,28 26,38 32,46 Z"
            fill="#FEE440"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          {/* Star sparkle above waving hand */}
          <path d="M 12,24 Q 15,22 13,19 Q 12,22 9,24 Q 12,25 13,29 Q 15,25 18,24 Z" fill="#F43F5E" />

          {/* Ribbon Bowtie */}
          <path d="M 54,74 L 66,80 L 66,74 L 54,80 Z" fill="#F43F5E" />
          <circle cx="60" cy="77" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // Fallback: sticker / bep variant
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible animate-bounce-subtle"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="44" fill="#FFF8F6" stroke="#FDE8ED" strokeWidth="3" />
        <path
          d="M 32,70 C 22,56 26,34 42,26 C 56,18 74,22 78,38 C 82,52 74,70 56,76 C 44,79 35,78 32,70 Z"
          fill="#FEE440"
        />
        <circle cx="42" cy="46" r="3.5" fill="#2D1B2D" />
        <circle cx="64" cy="48" r="3.5" fill="#2D1B2D" />
        <circle cx="38" cy="52" r="4" fill="#FDA4AF" opacity="0.7" />
        <circle cx="68" cy="54" r="4" fill="#FDA4AF" opacity="0.7" />
        <path d="M 50,54 Q 53,59 56,54" fill="none" stroke="#9F1239" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
