import { Suspense } from "react";

import { TimelineExplorerPage } from "@/components/TimelineExplorerPage";

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <TimelineExplorerPage />
    </Suspense>
  );
}
