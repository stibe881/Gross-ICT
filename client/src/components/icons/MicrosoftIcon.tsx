import React from "react";

interface MicrosoftIconProps {
  className?: string;
}

export const MicrosoftIcon: React.FC<MicrosoftIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 23 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="12" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
};
