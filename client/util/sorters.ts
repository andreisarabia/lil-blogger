export const sortByDate = (
  firstDate: string,
  secondDate: string
): 1 | 0 | -1 => {
  const aMilleseconds = new Date(firstDate).getMilliseconds();
  const bMilleseconds = new Date(secondDate).getMilliseconds();

  if (aMilleseconds > bMilleseconds) return 1;
  if (aMilleseconds < bMilleseconds) return -1;
  return 0;
};
