"use client";

import type { ReactNode } from "react";
import BackToFeedLink from "./BackToFeedLink";

type BackToFeedHeaderProps = {
  className?: string;
  backClassName?: string;
  metaClassName?: string;
  scroll?: boolean;
  label?: string;
  children: ReactNode;
};

export default function BackToFeedHeader({
  className,
  backClassName,
  metaClassName,
  scroll,
  label,
  children,
}: BackToFeedHeaderProps) {
  return (
    <header className={className}>
      <BackToFeedLink
        className={backClassName}
        scroll={scroll}
        label={label}
      />
      <div className={metaClassName}>{children}</div>
    </header>
  );
}
