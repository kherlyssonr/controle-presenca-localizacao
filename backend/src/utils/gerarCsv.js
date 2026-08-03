function escaparCampoCsv(valor) {
  if (valor === null || valor === undefined) {
    return '""';
  }

  const texto = String(valor).replaceAll('"', '""');

  return `"${texto}"`;
}

export function gerarCsv(cabecalhos, linhas) {
  const cabecalhoCsv = cabecalhos.map(escaparCampoCsv).join(";");

  const linhasCsv = linhas
    .map((linha) => linha.map(escaparCampoCsv).join(";"))
    .join("\r\n");

  return `\uFEFF${cabecalhoCsv}\r\n${linhasCsv}`;
}
