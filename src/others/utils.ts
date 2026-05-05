export function getParams(): Record<string, string | undefined> {
  const args = process.argv.slice(2);
  const params: Record<string, string | undefined> = {};
  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    params[key] = value;
  }
  return params;
}
