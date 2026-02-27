import React from "react";
import type { ReactNode } from "react";
import PageWrapper from "@wrappers/Page/index";
import Navbar from "@components/Navbar";

type GeneralPageWrapperProps = {
  children: ReactNode;
};

export default function GeneralPageWrapper({ children }: GeneralPageWrapperProps) {
  return (
    <PageWrapper>
      <Navbar />

      <main className="pt-24">{children}</main>
    </PageWrapper>
  );
}
