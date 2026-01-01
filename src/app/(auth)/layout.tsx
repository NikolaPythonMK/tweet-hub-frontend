import type { ReactNode } from "react";
import AppHeader from "@/components/nav/AppHeader";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
