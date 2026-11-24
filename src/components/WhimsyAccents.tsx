export function SageLogoMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 24C8 14.5 14.5 8 24 8C24 17.5 17.5 24 8 24Z"
        fill="#A7D8C5"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 24C12.5 19.5 17 15 22 10"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="24.5" cy="21.5" r="2.5" fill="#E6E1F5" stroke="#7C9A83" strokeWidth="1.4" />
    </svg>
  );
}

export function NotebookSproutIllustration({ className = 'w-28 h-24' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="70" cy="60" rx="52" ry="38" fill="#E6E1F5" fillOpacity="0.65" />
      <rect
        x="24"
        y="34"
        width="44"
        height="54"
        rx="8"
        fill="#FFFFFF"
        stroke="#E7E2DA"
        strokeWidth="2"
      />
      <rect
        x="72"
        y="34"
        width="44"
        height="54"
        rx="8"
        fill="#FFFFFF"
        stroke="#E7E2DA"
        strokeWidth="2"
      />
      <rect x="33" y="46" width="24" height="4" rx="2" fill="#7C9A83" />
      <rect x="33" y="56" width="18" height="4" rx="2" fill="#E6E1F5" />
      <rect x="33" y="66" width="26" height="4" rx="2" fill="#A7D8C5" />
      <rect x="33" y="76" width="14" height="4" rx="2" fill="#F6C9A8" />
      <rect x="81" y="46" width="26" height="4" rx="2" fill="#E7E2DA" />
      <rect x="81" y="56" width="22" height="4" rx="2" fill="#E7E2DA" />
      <rect x="81" y="66" width="25" height="4" rx="2" fill="#E6E1F5" />
      <rect x="81" y="76" width="16" height="4" rx="2" fill="#E7E2DA" />
      <path d="M70 34V22" stroke="#5F7F68" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M70 24C70 16 77 12 83 14C83 20 77 24 70 24Z"
        fill="#A7D8C5"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M70 26C70 19 63 16 58 18C58 23 64 26 70 26Z"
        fill="#E6E1F5"
        stroke="#7C9A83"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="114" cy="24" r="3" fill="#F6C9A8" />
      <circle cx="28" cy="24" r="2.5" fill="#A7D8C5" />
    </svg>
  );
}

export function MeadowSparkleCluster({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M30 48C30 34 40 24 54 24C54 38 44 48 30 48Z"
        fill="#A7D8C5"
        fillOpacity="0.55"
      />
      <path
        d="M64 60C64 49 72 41 83 41C83 52 75 60 64 60Z"
        fill="#E6E1F5"
        fillOpacity="0.85"
      />
      <circle cx="94" cy="24" r="5" fill="#F6C9A8" fillOpacity="0.6" />
      <circle cx="20" cy="22" r="3.5" fill="#E6E1F5" />
    </svg>
  );
}

export function CodeTeacupIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="34" r="24" fill="#E6E1F5" fillOpacity="0.55" />
      {/* Steam curly brackets */}
      <path
        d="M25 18C23 16 23 13 25 11"
        stroke="#7C9A83"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M34 17C36 15 36 12 34 10"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Cup body */}
      <path
        d="M17 26H43V37C43 44.18 37.18 50 30 50C22.82 50 17 44.18 17 37V26Z"
        fill="#FFFFFF"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Handle */}
      <path
        d="M43 29H46.5C49 29 51 31 51 33.5C51 36 49 38 46.5 38H43"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Tea leaf tag */}
      <circle cx="30" cy="37" r="4.5" fill="#A7D8C5" />
      <path d="M28 37L29.5 38.5L32.5 35.5" stroke="#2F3B34" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Saucer */}
      <rect x="14" y="51" width="32" height="3.5" rx="1.75" fill="#F6C9A8" />
    </svg>
  );
}

export function MagnifyingBugIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="22" fill="#A7D8C5" fillOpacity="0.35" />
      {/* Cute little beetle */}
      <ellipse cx="29" cy="31" rx="7.5" ry="8.5" fill="#F6C9A8" stroke="#2F3B34" strokeWidth="1.6" />
      <path d="M29 22.5V39.5" stroke="#2F3B34" strokeWidth="1.4" />
      <circle cx="26" cy="29" r="1.3" fill="#2F3B34" />
      <circle cx="32" cy="33" r="1.3" fill="#2F3B34" />
      <path d="M26 23L24 20M32 23L34 20" stroke="#2F3B34" strokeWidth="1.4" strokeLinecap="round" />
      {/* Magnifier ring */}
      <circle cx="31" cy="30" r="14" stroke="#5F7F68" strokeWidth="2.2" fill="#FFFFFF" fillOpacity="0.25" />
      <path d="M41 40L51 50" stroke="#5F7F68" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="48" cy="18" r="2.5" fill="#E6E1F5" />
    </svg>
  );
}

export function PaperPlaneChatIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="34" cy="32" r="22" fill="#E6E1F5" fillOpacity="0.65" />
      {/* Dotted trail */}
      <path
        d="M12 46C18 46 21 42 24 38"
        stroke="#7C9A83"
        strokeWidth="1.8"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      {/* Paper plane */}
      <path
        d="M49 18L18 30L29 35L49 18Z"
        fill="#FFFFFF"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M49 18L36 45L29 35L49 18Z"
        fill="#A7D8C5"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="20" r="2.5" fill="#F6C9A8" />
    </svg>
  );
}

export function BookmarkRibbonIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="22" fill="#F6C9A8" fillOpacity="0.35" />
      <rect
        x="17"
        y="15"
        width="30"
        height="34"
        rx="6"
        fill="#FFFFFF"
        stroke="#5F7F68"
        strokeWidth="1.8"
      />
      {/* Bookmark ribbon */}
      <path
        d="M34 15V34L38.5 30.5L43 34V15"
        fill="#E6E1F5"
        stroke="#5F7F68"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="23" y="25" width="7" height="3" rx="1.5" fill="#A7D8C5" />
      <rect x="23" y="32" width="11" height="3" rx="1.5" fill="#E7E2DA" />
      <rect x="23" y="39" width="16" height="3" rx="1.5" fill="#E7E2DA" />
    </svg>
  );
}

export function SeedlingFolderIllustration({ className = 'w-16 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="36" cy="34" r="24" fill="#E6E1F5" fillOpacity="0.6" />
      {/* Sprout behind folder */}
      <path d="M44 26V16" stroke="#5F7F68" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M44 19C44 13 50 10 54 12C54 16 49 19 44 19Z"
        fill="#A7D8C5"
        stroke="#5F7F68"
        strokeWidth="1.5"
      />
      {/* Folder */}
      <path
        d="M14 23C14 20.2 16.2 18 19 18H29L33 22H53C55.8 22 58 24.2 58 27V45C58 47.8 55.8 50 53 50H19C16.2 50 14 47.8 14 45V23Z"
        fill="#FFFFFF"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="23" y="33" width="18" height="3.5" rx="1.75" fill="#E6E1F5" />
      <rect x="23" y="40" width="12" height="3.5" rx="1.75" fill="#F6C9A8" />
    </svg>
  );
}

export function KeySproutIllustration({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="24" fill="#E6E1F5" fillOpacity="0.65" />
      <rect
        x="18"
        y="27"
        width="28"
        height="21"
        rx="6"
        fill="#FFFFFF"
        stroke="#5F7F68"
        strokeWidth="1.8"
      />
      <path
        d="M24 27V21C24 16.6 27.6 13 32 13C36.4 13 40 16.6 40 21V27"
        stroke="#5F7F68"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="32" cy="36.5" r="3" fill="#A7D8C5" stroke="#5F7F68" strokeWidth="1.5" />
      <path d="M32 39.5V43" stroke="#5F7F68" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="48" cy="18" r="2.5" fill="#F6C9A8" />
    </svg>
  );
}

export function PasteCodeIllustration({ className = 'w-14 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="8" y="10" width="38" height="38" rx="8" fill="#FAF7F2" stroke="#E7E2DA" strokeWidth="1.8" />
      <rect x="16" y="19" width="18" height="3.5" rx="1.75" fill="#7C9A83" />
      <rect x="16" y="27" width="22" height="3.5" rx="1.75" fill="#E6E1F5" />
      <rect x="16" y="35" width="14" height="3.5" rx="1.75" fill="#A7D8C5" />
      <circle cx="47" cy="20" r="9" fill="#E6E1F5" stroke="#5F7F68" strokeWidth="1.6" />
      <path d="M44 20H50M47 17V23" stroke="#5F7F68" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChooseDepthIllustration({ className = 'w-14 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="8" y="14" width="48" height="9" rx="4.5" fill="#E6E1F5" stroke="#E7E2DA" strokeWidth="1.5" />
      <circle cx="22" cy="18.5" r="4.5" fill="#5F7F68" />
      <rect x="8" y="27" width="48" height="9" rx="4.5" fill="#A7D8C5" fillOpacity="0.45" stroke="#E7E2DA" strokeWidth="1.5" />
      <circle cx="38" cy="31.5" r="4.5" fill="#5F7F68" />
      <rect x="8" y="40" width="48" height="9" rx="4.5" fill="#F6C9A8" fillOpacity="0.45" stroke="#E7E2DA" strokeWidth="1.5" />
      <circle cx="28" cy="44.5" r="4.5" fill="#7C9A83" />
    </svg>
  );
}
