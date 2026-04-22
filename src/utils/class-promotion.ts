export type ClassRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
};

export const GRADE_NEXT: Record<string, string | null> = {
  X: "XI",
  XI: "XII",
  XII: "Alumni",
  Alumni: null,
};

export function suggestNextClassId(currentClassId: string | null, classList: ClassRow[]) {
  if (!currentClassId) return "";
  const currentClass = classList.find((item) => item.id === currentClassId);
  if (!currentClass) return currentClassId;
  const nextGrade = GRADE_NEXT[currentClass.grade];
  if (!nextGrade) return currentClassId;
  const nextClass = classList.find((item) => item.grade === nextGrade && item.section === currentClass.section);
  return nextClass?.id ?? currentClassId;
}

export function resolvePromotableTarget(currentClassId: string | null, classList: ClassRow[]) {
  const targetClassId = suggestNextClassId(currentClassId, classList);
  const currentClass = classList.find((item) => item.id === currentClassId) ?? null;
  const targetClass = classList.find((item) => item.id === targetClassId) ?? null;

  return { currentClass, targetClass, targetClassId };
}
