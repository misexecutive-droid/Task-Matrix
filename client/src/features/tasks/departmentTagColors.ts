// Deterministic tag-pill color per department name, so the same department always
// renders with the same color across cards (no color stored on the Department model).
const TAG_PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

export const departmentTagClass = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
};
