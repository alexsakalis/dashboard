/** Standard gym plate denominations per side (largest first). */
export const PLATE_SETS = {
  lbs: [45, 35, 25, 10, 5, 2.5],
  kg: [20, 15, 10, 5, 2.5, 1.25],
} as const;

export const DEFAULT_BAR_WEIGHT = {
  lbs: 45,
  kg: 20,
} as const;

export interface PlateCount {
  weight: number;
  count: number;
}

export interface PlateCalculation {
  targetWeight: number;
  barWeight: number;
  unit: "lbs" | "kg";
  perSideWeight: number;
  platesPerSide: PlateCount[];
  loadedWeight: number;
  isExact: boolean;
  remainder: number;
}

export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  unit: "lbs" | "kg" = "lbs",
  availablePlates: readonly number[] = PLATE_SETS[unit],
): PlateCalculation | null {
  if (!Number.isFinite(targetWeight) || targetWeight <= 0) return null;
  if (!Number.isFinite(barWeight) || barWeight < 0) return null;

  const perSideWeight = (targetWeight - barWeight) / 2;
  if (perSideWeight < 0) {
    return {
      targetWeight,
      barWeight,
      unit,
      perSideWeight: 0,
      platesPerSide: [],
      loadedWeight: barWeight,
      isExact: targetWeight === barWeight,
      remainder: targetWeight - barWeight,
    };
  }

  let remaining = Math.round(perSideWeight * 100) / 100;
  const platesPerSide: PlateCount[] = [];

  for (const plate of availablePlates) {
    if (remaining < plate - 0.001) continue;
    const count = Math.floor((remaining + 0.001) / plate);
    if (count > 0) {
      platesPerSide.push({ weight: plate, count });
      remaining = Math.round((remaining - count * plate) * 100) / 100;
    }
  }

  const loadedPerSide = platesPerSide.reduce(
    (sum, p) => sum + p.weight * p.count,
    0,
  );
  const loadedWeight = barWeight + loadedPerSide * 2;
  const remainder = Math.round((targetWeight - loadedWeight) * 100) / 100;

  return {
    targetWeight,
    barWeight,
    unit,
    perSideWeight,
    platesPerSide,
    loadedWeight,
    isExact: Math.abs(remainder) < 0.01,
    remainder,
  };
}

export function formatPlateLabel(weight: number, unit: "lbs" | "kg"): string {
  return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1);
}
