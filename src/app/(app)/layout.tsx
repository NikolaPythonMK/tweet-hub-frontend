import type { ReactNode } from "react";
import AppHeader from "@/components/nav/AppHeader";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
