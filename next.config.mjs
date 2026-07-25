/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdf-parse, mammoth y docx usan APIs de Node; se ejecutan solo en el
    // servidor. Los marcamos como externos para que Next no intente
    // empaquetarlos en el bundle (evita errores de "fs"/"canvas", etc.).
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "docx", "pdfkit"],
  },
};

export default nextConfig;
