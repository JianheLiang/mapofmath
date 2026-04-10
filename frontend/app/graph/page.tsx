import { Suspense } from "react";

import { GraphExplorerPage } from "@/components/GraphExplorerPage";

export default function GraphPage() {
  return (
    <Suspense fallback={null}>
      <GraphExplorerPage />
    </Suspense>
  );
}
