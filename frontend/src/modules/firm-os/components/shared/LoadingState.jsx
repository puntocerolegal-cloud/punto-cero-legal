import React from "react";
import { SkeletonCard } from "../feedback/SkeletonCard";

export function LoadingState({ message = "Cargando...", variant = "spinner", skeletonVariant = "card", skeletonCount = 3 }) {
  if (variant === "skeleton") {
    return <SkeletonCard count={skeletonCount} variant={skeletonVariant} />;
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        <p className="text-white/60">{message}</p>
      </div>
    </div>
  );
}
