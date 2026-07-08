const SUMMARY_NAME_PATTERN =
  /^(money owed|total|total owed|summary|grand total)$/i;

export function isSummaryCardName(name: string): boolean {
  return SUMMARY_NAME_PATTERN.test(name.trim());
}

export function filterCreditCards<T extends { card_name: string }>(cards: T[]): T[] {
  return cards.filter((card) => !isSummaryCardName(card.card_name));
}
