import React from "react";
import { ThreeDot } from 'react-loading-indicators';

export default function Loading() {
  return (
    <div className={`fixed w-full h-screen flex z-50 items-center justify-center bg-[#f9fafb] bg-opacity-80`}>
      <ThreeDot variant="bob" color="#32cd32" size="large" text="抽出中" textColor="#32cd32" />
    </div>
  );
}