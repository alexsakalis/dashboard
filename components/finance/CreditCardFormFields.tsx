"use client";

import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CardStatus, CreditCard } from "@/types/finance";

interface CreditCardFormFieldsProps {
  cardStatus: CardStatus;
  onStatusChange: (value: CardStatus) => void;
  defaultValues?: Partial<CreditCard> & { effective_balance?: number };
  showEffectiveBalance?: boolean;
}

export function CreditCardFormFields({
  cardStatus,
  onStatusChange,
  defaultValues,
  showEffectiveBalance = false,
}: CreditCardFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="card_name">Card name</Label>
        <Input
          id="card_name"
          name="card_name"
          required
          defaultValue={defaultValues?.card_name ?? ""}
          placeholder="e.g. Chase Sapphire"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="provider">Bank / provider</Label>
          <Input
            id="provider"
            name="provider"
            defaultValue={defaultValues?.provider ?? ""}
            placeholder="Chase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_four">Last 4 digits</Label>
          <Input
            id="last_four"
            name="last_four"
            inputMode="numeric"
            maxLength={4}
            pattern="\d{4}"
            defaultValue={defaultValues?.last_four ?? ""}
            placeholder="1234"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="opening_balance">
            {showEffectiveBalance ? "Opening balance" : "Current balance"}
          </Label>
          <Input
            id="opening_balance"
            name="opening_balance"
            type="number"
            step="0.01"
            min="0"
            required={!showEffectiveBalance}
            defaultValue={
              defaultValues?.opening_balance != null
                ? String(defaultValues.opening_balance)
                : ""
            }
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit_limit">Credit limit</Label>
          <Input
            id="credit_limit"
            name="credit_limit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              defaultValues?.credit_limit != null
                ? String(defaultValues.credit_limit)
                : ""
            }
            placeholder="0.00"
          />
        </div>
      </div>

      {showEffectiveBalance && (
        <div className="space-y-2">
          <Label htmlFor="effective_balance">Current balance (after payments)</Label>
          <Input
            id="effective_balance"
            name="effective_balance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              defaultValues?.effective_balance != null
                ? String(defaultValues.effective_balance)
                : ""
            }
            placeholder="Adjust to match your statement"
          />
          <p className="text-xs text-muted-foreground">
            Updating this recalculates the baseline so payments stay accurate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="apr">APR (%)</Label>
          <Input
            id="apr"
            name="apr"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={
              defaultValues?.apr != null ? String(defaultValues.apr) : ""
            }
            placeholder="24.99"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statement_day">Statement day</Label>
          <Input
            id="statement_day"
            name="statement_day"
            type="number"
            min="1"
            max="28"
            defaultValue={
              defaultValues?.statement_day != null
                ? String(defaultValues.statement_day)
                : ""
            }
            placeholder="15"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minimum_payment">Minimum payment</Label>
          <Input
            id="minimum_payment"
            name="minimum_payment"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              defaultValues?.minimum_payment != null
                ? String(defaultValues.minimum_payment)
                : ""
            }
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Payment due date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={
              defaultValues?.due_date ??
              format(new Date(), "yyyy-MM-dd")
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={cardStatus}
          onValueChange={(v) => onStatusChange((v ?? "active") as CardStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paid_off">Paid off</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="card_status" value={cardStatus} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={defaultValues?.tags?.join(", ") ?? ""}
          placeholder="travel, rewards"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Optional notes about this card"
        />
      </div>
    </>
  );
}
