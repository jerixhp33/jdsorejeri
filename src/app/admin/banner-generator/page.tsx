"use client";

import BannerCollageGenerator from "@/components/admin/BannerCollageGenerator";

export default function BannerGeneratorPage() {
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <BannerCollageGenerator />
    </div>
  );
}
