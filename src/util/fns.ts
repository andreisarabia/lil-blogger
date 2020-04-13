// helper fns for common JavaScript actions

export const toUniqueArray = <T>(arr: T[]): T[] => [...new Set(arr)];
