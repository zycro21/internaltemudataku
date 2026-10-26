import ErdViewer from "@/app/erd/ErdViewer";
import { fetchLiveSchema } from "@/lib/erd/fetch-schema";
import { loadReleaseNotes } from "@/lib/erd/load-release-notes";

// Wajib ditulis langsung di file ini (jangan di-re-export dari erd/page.tsx),
// karena Next.js hanya membaca route config yang tertulis literal di file page.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Internal TemuDataku",
  description:
    "Website internal TemuDataku untuk keperluan bisnis dan operasional tim, termasuk diagram relasi database yang diperbarui langsung dari schema.prisma.",
};

export default async function Home() {
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