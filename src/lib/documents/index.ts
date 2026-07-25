export { buildContractDocx } from "./docx";
export { buildContractPdf } from "./pdf";
export { buildAnnotatedDocx } from "./report-docx";

/** Convierte un nombre en un slug ASCII apto para nombre de archivo. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita tildes/diéresis (marcas combinadas)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nombre de archivo sugerido para descargar el contrato. */
export function contractFilename(
  contractName: string,
  ext: "docx" | "pdf",
): string {
  return `contrato-${slugify(contractName)}.${ext}`;
}
