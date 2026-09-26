import React from "react";

export interface IllustrationProps {
  className?: string;
  size?: number;
}

/** Transhumans "reflecting" — glasses analyst sitting with tech backpack */
export const LoginAnalystIllustration: React.FC<IllustrationProps> = ({
  className = "",
  size = 320,
}) => (
  <img
    src="/illustrations/reflecting.png"
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{ objectFit: "contain", objectPosition: "bottom center" }}
    className={className}
    draggable={false}
  />
);

/** Transhumans "chillin" — confident figure with prosthetic leg, carrying a device */
export const SignUpCoordinatorIllustration: React.FC<IllustrationProps> = ({
  className = "",
  size = 320,
}) => (
  <img
    src="/illustrations/chillin.png"
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    style={{ objectFit: "contain", objectPosition: "bottom center" }}
    className={className}
    draggable={false}
  />
);
