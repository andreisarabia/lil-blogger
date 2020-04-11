export const sortByDate = (
  firstDate: string,
  secondDate: string,
  descendingOrder = true
): 1 | 0 | -1 => {
  const aMs = new Date(firstDate).getMilliseconds();
  const bMs = new Date(secondDate).getMilliseconds();

  if (aMs > bMs) return descendingOrder ? 1 : -1;
  if (aMs < bMs) return descendingOrder ? -1 : 1;
  return 0;
};
