export const getDate = (seconds: number) => {
  const now = new Date();
  return new Date(now.getTime() + seconds * 1000);
};
