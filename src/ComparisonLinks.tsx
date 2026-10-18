import { comparisonCatalog } from "./comparisonPhysics";
export function ComparisonLinks({ models }: { models: string[] }) {
  const entries = comparisonCatalog.filter((x) => x.models.some((m) => models.includes(m)));
  return entries.length ? (
    <aside className="comparison-links">
      <strong>进一步比较</strong>
      {entries.map((x) => (
        <a key={x.id} href={"#/compare?experiment=" + x.id}>
          {x.title}
        </a>
      ))}
    </aside>
  ) : null;
}
