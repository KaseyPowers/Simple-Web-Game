export default function isObject(input: unknown): input is object {
  return typeof input === "object" && input !== null;
}
