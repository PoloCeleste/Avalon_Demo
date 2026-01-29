export type BranchOption = { id: number; name: string; code: string }

export const STATIC_BRANCHES: BranchOption[] = [{ id: 1, name: '창원점', code: 'CHANGWON' }]

export function getBranchIdByName(name: string): number {
  const found = STATIC_BRANCHES.find(b => b.name === name)
  return found ? found.id : 1 // 기본값: 창원점
}
