export const isUrl = (url: string): boolean => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

export const extractSlug = (url: string): string => {
  const { pathname } = new URL(url); // easier to parse URLs with queries

  return pathname.substring(pathname.lastIndexOf('/'));
};
