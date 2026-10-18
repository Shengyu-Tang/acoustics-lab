import type { P1Lecture } from "./p1";
const modules = import.meta.glob<{ default: P1Lecture }>("./lectures/*.ts", { eager: true });
export const p1Lectures = Object.values(modules)
  .map((m) => m.default)
  .filter((l) => l.defaults);
