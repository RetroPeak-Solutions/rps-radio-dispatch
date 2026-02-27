import React from "react";
import { Outlet, type MetaFunction } from "react-router";
import AuthPageWrapper from '@wrappers/Page/AuthPageWrapper';
import { LoadingOverlay } from "@components/UI/LoadingOverlay";

export default function AuthLayoutRoute() {
  return (
    <AuthPageWrapper>
      <LoadingOverlay />
      <Outlet />
    </AuthPageWrapper>
  )
  // return <Outlet />;
}

export const meta: MetaFunction = () => {
  const title = "RetroRadio Dispatch - Auth";
  const description = "RetroPeak Solutions!";
  const url = "https://rto.retropeak.solutions";
  const image = "https://rto.retropeak.solutions/assets/core/img/logo.png";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
};