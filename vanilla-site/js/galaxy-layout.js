// Keep randomized planets inside the initial camera view, with space for labels.
export function createRandomPositions(count, narrow, random = Math.random) {
  const xLimit = narrow ? 1.05 : 3.1;
  const yLimit = 2.05;
  const xGap = narrow ? 1.45 : 1.75;
  const yGap = 1.45;
  for (let restart = 0; restart < 12; restart++) {
    const positions = [];
    for (let attempt = 0; attempt < 250 && positions.length < count; attempt++) {
      const candidate = [(random() * 2 - 1) * xLimit, (random() * 2 - 1) * yLimit, (random() * 2 - 1) * 0.2];
      if (positions.every(([x, y]) => ((candidate[0] - x) / xGap) ** 2 + ((candidate[1] - y) / yGap) ** 2 >= 1)) {
        positions.push(candidate);
      }
    }
    if (positions.length === count) return positions;
  }
  // A bounded fallback for unusually unlucky random samples (six categories).
  const positions = Array.from({ length: count }, (_, index) => narrow
    ? [index % 2 ? 1 : -1, 1.8 - Math.floor(index / 2) * 1.8, 0]
    : [(index % 3 - 1) * 2, index < 3 ? 1.25 : -1.25, 0]);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
}
