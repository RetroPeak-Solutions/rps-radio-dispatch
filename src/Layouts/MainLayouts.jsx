import React from "react";
import { Outlet } from "react-router";
import GeneralPageWrapper from '../Wrappers/Page/GeneralWrapper';
import { LoadingOverlay } from "../components/UI/LoadingOverlay";

function MainLayouts() {
  return (
    <GeneralPageWrapper>
      <LoadingOverlay />
      <Outlet />
    </GeneralPageWrapper>
  );
}

export default MainLayouts;
