function generateRandomString(length: number) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const charSetLength = chars.length;
  const buf = new Uint8Array(charSetLength * 2);

  const bufLength = buf.length;
  let result = "";
  let bufIndex = bufLength;
  let rand;
  while (result.length < length) {
    if (bufIndex >= bufLength) {
      crypto.getRandomValues(buf);
      bufIndex = 0;
    }
    rand = buf[bufIndex++];
    result += chars[rand % charSetLength];
  }
  return result;
}

export { generateRandomString };
