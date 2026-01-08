"use client";

import Link from "next/link";

type BackToFeedLinkProps = {
  className?: string;
  scroll?: boolean;
  label?: string;
};

export default function BackToFeedLink({
  className,
  scroll,
  label = "<- Back to feed",
}: BackToFeedLinkProps) {
  return (
    <Link href="/feed" className={className} scroll={scroll}>
      {label}
    </Link>
  );
}
