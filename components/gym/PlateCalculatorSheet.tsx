"use client";

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlateCalculator } from "@/components/gym/PlateCalculator";

export function PlateCalculatorSheet({
  defaultUnit = "lbs",
  triggerClassName,
}: {
  defaultUnit?: "lbs" | "kg";
  triggerClassName?: string;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={triggerClassName}
          >
            <Calculator className="mr-1.5 h-3.5 w-3.5" />
            Plates
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>Plate calculator</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <PlateCalculator defaultUnit={defaultUnit} compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
