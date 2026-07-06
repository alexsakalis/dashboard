export function isAuthDisabled(): boolean {
  return (
    process.env.DISABLE_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
