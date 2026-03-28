export function toEnglishDigits(value: string | number): string {
  return String(value).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US-u-nu-latn', { maximumFractionDigits: 0 }).format(value);
}
