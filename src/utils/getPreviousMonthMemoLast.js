let getPreviousMonthMemoKey;
let getPreviousMonthMemoValue;

export default function getPreviousMonthMemoLast(month, momentConfig) {
  if (month !== getPreviousMonthMemoKey) {
    getPreviousMonthMemoKey = month;
    getPreviousMonthMemoValue = month.clone().subtract(1, momentConfig.MonthProp);
  }

  return getPreviousMonthMemoValue;
}
