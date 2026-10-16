import type { FieldType } from "@/components/admin/resource-form";

/** Convert a wire-format value into a form-input value */
export function toInputValue(v: any, type: FieldType): any {
  if (v == null) {
    if (type === "boolean") return false;
    if (type === "number") return "";
    return "";
  }
  if (type === "tags" || type === "url-list") {
    return Array.isArray(v) ? v.join(", ") : String(v);
  }
  if (type === "json") {
    if (typeof v === "string") return v;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return "";
    }
  }
  if (type === "boolean") return Boolean(v);
  if (type === "number") return v === "" ? "" : Number(v);
  if (type === "date") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === "string") {
      const d = new Date(v);
      return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    }
    return "";
  }
  if (type === "datetime-local") {
    if (v instanceof Date) {
      const tz = v.getTimezoneOffset() * 60000;
      return new Date(v.getTime() - tz).toISOString().slice(0, 16);
    }
    if (typeof v === "string") {
      const d = new Date(v);
      if (isNaN(d.getTime())) return "";
      const tz = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tz).toISOString().slice(0, 16);
    }
    return "";
  }
  return String(v);
}

/** Parse a json-text field safely */
export function tryParseJson(s: string, fallback: any = {}) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
