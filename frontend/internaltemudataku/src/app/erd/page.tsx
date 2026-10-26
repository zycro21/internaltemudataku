import ErdViewer from "./ErdViewer";
import { fetchLiveSchema } from "@/lib/erd/fetch-schema";
import { loadReleaseNotes } from "@/lib/erd/load-release-notes";

// fetchLiveSchema() calls fetch(..., { cache: "no-store" }) internally, which
// already opts this route out of static generation -- this export just makes
// that explicit: every visit re-fetches schema.prisma from GitHub, parses it
// fresh, and renders. No rebuild/redeploy needed when the upstream schema
// changes.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERD | Internal TemuDataku",
  description: "Diagram relasi database TemuDataku, live dari schema.prisma.",
};

export default async function ErdPage() {
  const [result, releaseNotes] = await Promise.all([
    fetchLiveSchema(),
    loadReleaseNotes(),
  ]);
  return (
    <ErdViewer
      initialTables={result.tables}
      initialFetchedAt={result.fetchedAt}
      initialSource={result.source}
      initialError={result.error}
      releaseNotes={releaseNotes}
    />
  );
}