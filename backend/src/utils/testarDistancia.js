import "dotenv/config";

import { calcularDistancia } from "./calcularDistancia.js";

const latitudeInstituicao = Number(process.env.INSTITUICAO_LATITUDE);

const longitudeInstituicao = Number(process.env.INSTITUICAO_LONGITUDE);

// Teste 1: aluno exatamente na instituição
const distanciaMesmaLocalizacao = calcularDistancia(
  latitudeInstituicao,
  longitudeInstituicao,
  latitudeInstituicao,
  longitudeInstituicao,
);

// Teste 2: aluno aproximadamente 111 metros distante
const distanciaOutraLocalizacao = calcularDistancia(
  latitudeInstituicao + 0.001,
  longitudeInstituicao,
  latitudeInstituicao,
  longitudeInstituicao,
);

console.log(
  "Mesma localização:",
  distanciaMesmaLocalizacao.toFixed(2),
  "metros",
);

console.log(
  "Outra localização:",
  distanciaOutraLocalizacao.toFixed(2),
  "metros",
);
