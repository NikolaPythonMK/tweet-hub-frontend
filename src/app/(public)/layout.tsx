import type { ReactNode } from "react";
import AppHeader from "@/components/nav/AppHeader";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
