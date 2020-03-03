export const sort_by_date = (
  firstDate: string,
  secondDate: string,
  descendingOrder = true
) => {
  const aMs = new Date(firstDate).getMilliseconds();
  const bMs = new Date(secondDate).getMilliseconds();

  if (aMs > bMs) return descendingOrder ? 1 : -1;
  if (aMs < bMs) return descendingOrder ? -1 : 1;
  return 0;
};
