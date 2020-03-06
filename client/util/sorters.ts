export const sort_by_date = (firstDate: string, secondDate: string) => {
  const aMilleseconds = new Date(firstDate).getMilliseconds();
  const bMilleseconds = new Date(secondDate).getMilliseconds();

  if (aMilleseconds > bMilleseconds) return 1;
  if (aMilleseconds < bMilleseconds) return -1;
  return 0;
};
