import { WikiArticleView } from "@/components/WikiArticleView";
import { getTimeline, getWiki } from "@/lib/api";
import { buildLocalTimelineWindow } from "@/lib/timeline";

export default async function WikiPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = await getWiki(params.slug);
  const areaTimeline = await getTimeline({
    type: "",
    area: entry.area,
    from: "",
    to: "",
  });
  const localTimeline = buildLocalTimelineWindow(areaTimeline, entry.slug, 5);

  return (
    <WikiArticleView entry={entry} timelineItems={localTimeline} />
  );
}
