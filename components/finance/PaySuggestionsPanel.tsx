import Link from "next/link";
import { ArrowRight, Flame, Snowflake, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAvalancheTopPick,
  getNextPaySuggestion,
  getSnowballTopPick,
} from "@/lib/finance/suggestions";
import { formatCurrency } from "@/lib/finance/format";
import type { EnrichedCreditCard, PaySuggestion } from "@/types/finance";

function SuggestionRow({
  icon: Icon,
  label,
  suggestion,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  suggestion: PaySuggestion | null;
}) {
  if (!suggestion) return null;

  return (
    <Link
      href={`/finance/${suggestion.cardId}`}
      className="flex items-center gap-3 rounded-xl bg-muted/35 px-3 py-2.5 ring-1 ring-border/40 transition-colors hover:bg-muted/50"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium">{suggestion.cardName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {suggestion.reason} · {formatCurrency(suggestion.amount)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function PaySuggestionsPanel({
  cards,
}: {
  cards: EnrichedCreditCard[];
}) {
  const nextPay = getNextPaySuggestion(cards);
  const avalanche = getAvalancheTopPick(cards);
  const snowball = getSnowballTopPick(cards);

  if (!nextPay && !avalanche && !snowball) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          What to pay next
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SuggestionRow icon={Target} label="Recommended" suggestion={nextPay} />
        <SuggestionRow icon={Flame} label="Avalanche (highest APR)" suggestion={avalanche} />
        <SuggestionRow icon={Snowflake} label="Snowball (smallest balance)" suggestion={snowball} />
      </CardContent>
    </Card>
  );
}
