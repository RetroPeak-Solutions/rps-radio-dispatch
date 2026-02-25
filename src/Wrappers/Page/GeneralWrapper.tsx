import React from "react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import { Radio, LayoutDashboard, House, LogOut, Shield, UserCog } from "lucide-react";
import PageWrapper from "./index";
import { Button } from "../../components/UI/Button";
import Navbar from "../../components/Navbar";

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
