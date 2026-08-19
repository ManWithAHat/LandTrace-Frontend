const SQM_PER_ACRE = 4046.8564224;

export function sqmToAcres(sqm) {
  return (sqm ?? 0) / SQM_PER_ACRE;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
