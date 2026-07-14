"use client";

import { useMemo, useState } from "react";
import { DEFAULT_BAR_WEIGHT, PLATE_SETS, calculatePlates, formatPlateLabel } from "@/lib/gym/plates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlateCalculatorProps {
  defaultUnit?: "lbs" | "kg";
  compact?: boolean;
}

export function PlateCalculator({
  defaultUnit = "lbs",
  compact = false,
}: PlateCalculatorProps) {
  const [unit, setUnit] = useState<"lbs" | "kg">(defaultUnit);
  const [targetWeight, setTargetWeight] = useState("");
  const [barWeight, setBarWeight] = useState(String(DEFAULT_BAR_WEIGHT[defaultUnit]));

  const result = useMemo(() => {
    const target = Number.parseFloat(targetWeight);
    const bar = Number.parseFloat(barWeight);
    return calculatePlates(target, bar, unit);
  }, [barWeight, targetWeight, unit]);

  function switchUnit(next: "lbs" | "kg") {
    setUnit(next);
    setBarWeight(String(DEFAULT_BAR_WEIGHT[next]));
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex gap-2">
        {(["lbs", "kg"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={unit === value ? "default" : "outline"}
            className="flex-1"
            onClick={() => switchUnit(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="target-weight">Target weight</Label>
          <Input
            id="target-weight"
            type="number"
            inputMode="decimal"
            min={0}
            step={unit === "kg" ? 1.25 : 2.5}
            placeholder={`Total ${unit}`}
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bar-weight">Bar weight</Label>
          <Input
            id="bar-weight"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={barWeight}
            onChange={(e) => setBarWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(unit === "lbs" ? [135, 185, 225, 315] : [60, 80, 100, 140]).map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setTargetWeight(String(preset))}
          >
            {preset}
          </Button>
        ))}
      </div>

      {result ? (
        <Card className={cn(!result.isExact && "border-amber-500/40")}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Per side
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatPlateLabel(result.perSideWeight, unit)}{" "}
                  <span className="text-base font-normal text-muted-foreground">{unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Loaded</p>
                <p className="font-semibold tabular-nums">
                  {formatPlateLabel(result.loadedWeight, unit)} {unit}
                </p>
              </div>
            </div>

            {result.platesPerSide.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.platesPerSide.map((plate) => (
                  <PlateChip
                    key={plate.weight}
                    weight={plate.weight}
                    count={plate.count}
                    unit={unit}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bar only — no plates needed.</p>
            )}

            {!result.isExact && (
              <p className="text-sm text-amber-600">
                Cannot load exactly {formatPlateLabel(result.targetWeight, unit)} {unit} with
                standard plates. Off by {Math.abs(result.remainder)} {unit}.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Standard plates: {PLATE_SETS[unit].join(", ")} {unit}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Enter a target weight to see plates per side.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlateChip({
  weight,
  count,
  unit,
}: {
  weight: number;
  count: number;
  unit: "lbs" | "kg";
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1">
      <span className="text-sm font-semibold tabular-nums">
        {formatPlateLabel(weight, unit)}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
      {count > 1 && (
        <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
          ×{count}
        </span>
      )}
    </div>
  );
}
