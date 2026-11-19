import { FIGURE_FILES, parseSources } from '../../../components/studio/sources';
import { DATA, formatJson, isDev, notFound, readRepo, writeRepo } from '../repoFiles';

/**
 * Dev only: where every figure comes from in the code, read fresh from the
 * figure files. The snapshot the live site uses is refreshed at the same time.
 */
export async function GET() {
  if (!isDev) return notFound();
  const [calisthenics, gym, bouldering] = await Promise.all([readRepo(FIGURE_FILES.calisthenics), readRepo(FIGURE_FILES.gym), readRepo(FIGURE_FILES.bouldering)]);
  const sources = parseSources({ calisthenics, gym, bouldering });
  const sorted = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  await writeRepo(DATA.sources, formatJson(sorted));
  return Response.json({ sources: sorted });
}
