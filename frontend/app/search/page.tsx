import { Suspense } from "react";

import { SearchExplorerPage } from "@/components/SearchExplorerPage";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchExplorerPage />
    </Suspense>
  );
}
