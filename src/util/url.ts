export const is_url = (url: string): boolean => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

export const extract_slug = (url: string): string => {
  const { pathname } = new URL(url); // easier to parse URLs with queries
  const lastPartOfUrl = pathname.substring(pathname.lastIndexOf('/'));

  return lastPartOfUrl;
};
