import type { CampaignPlan, PlanSpec } from './campaignPlan';
import { evaluateBossesV3, evaluateTowers } from './engineV3';
import { migrateSave, migrateSpec } from './migrateV2';
import { ProtocolSave, evaluateBosses, toIsoDate } from './protocolEngine';

/**
 * Shadow mode for the v3 campaign: converts the loaded campaign in memory and
 * reports what v3 would make of it, without writing anything. Read from the
 * browser console as `window.__auraV3Report`.
 */

function stable(value: unknown): string {
  return JSON.stringify(value, (_key, inner) =>
    inner && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(Object.keys(inner).sort().map((key) => [key, (inner as Record<string, unknown>)[key]]))
      : inner,
  );
}

export function v3ShadowReport(spec: PlanSpec, save: ProtocolSave, plan: CampaignPlan) {
  const today = toIsoDate(new Date());
  const planResult = migrateSpec(spec);
  const saveResult = migrateSave(save, spec, today);
  const v3Plan = planResult.spec;
  const v3Save = saveResult.save;
  const idempotent =
    stable(migrateSpec(v3Plan).spec) === stable(v3Plan) && stable(migrateSave(v3Save, spec, today).save) === stable(v3Save);

  const before = evaluateBosses(save, plan);
  const after = evaluateBossesV3(v3Plan, v3Save);

  return {
    generatedAt: new Date().toISOString(),
    idempotent,
    sizes: { planBytes: stable(v3Plan).length, saveBytes: stable(v3Save).length, planLimit: 256_000, saveLimit: 512_000 },
    accounted: {
      stats: Object.keys(save.stats).length,
      loads: Object.keys(save.loads).length,
      records: Object.keys(v3Save.records).length,
      questsKept: Object.keys(v3Save.quests).length === Object.keys(save.quests).length,
      milestonesKept: Object.keys(v3Save.milestones).length === Object.keys(save.milestones).length,
      skillsBefore: Object.keys(save.skills ?? {}).length,
      skillsAfter: Object.keys(v3Save.skills).length,
      badges: Object.keys(v3Save.badges),
    },
    bosses: before.map((old) => {
      const now = after.find((status) => status.boss.id === old.boss.id);
      return {
        id: old.boss.id,
        name: old.boss.name,
        v2: { defeated: old.defeated, hp: Math.round((1 - old.damage) * 1000) },
        v3: now
          ? { kind: now.boss.kind, defeated: now.defeated, hp: Math.round((1 - now.damage) * 1000), sealed: now.sealed, remaining: now.remaining }
          : null,
      };
    }),
    towers: evaluateTowers(v3Plan, v3Save).map((status) => ({
      id: status.tower.id,
      name: status.tower.name,
      floors: status.floors.length,
      mastered: status.mastered,
      next: status.next?.name ?? null,
    })),
    plan: planResult.report,
    save: saveResult.report,
    converted: { plan: v3Plan, save: v3Save },
  };
}

export type V3ShadowReport = ReturnType<typeof v3ShadowReport>;
