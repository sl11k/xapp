export function toEnglishNumbers(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => {
    return String(arabicNumbers.indexOf(w));
  });
}
