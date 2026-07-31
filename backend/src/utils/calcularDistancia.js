const RAIO_TERRA_METROS = 6371000;

function grausParaRadianos(graus) {
  return graus * (Math.PI / 180);
}

export function calcularDistancia(
  latitudeOrigem,
  longitudeOrigem,
  latitudeDestino,
  longitudeDestino
) {
  const coordenadas = [
    latitudeOrigem,
    longitudeOrigem,
    latitudeDestino,
    longitudeDestino,
  ];

  const possuiCoordenadaInvalida = coordenadas.some(
    (coordenada) => !Number.isFinite(coordenada)
  );

  if (possuiCoordenadaInvalida) {
    throw new Error("As coordenadas devem ser números válidos.");
  }

  if (
    latitudeOrigem < -90 ||
    latitudeOrigem > 90 ||
    latitudeDestino < -90 ||
    latitudeDestino > 90
  ) {
    throw new Error("A latitude deve estar entre -90 e 90.");
  }

  if (
    longitudeOrigem < -180 ||
    longitudeOrigem > 180 ||
    longitudeDestino < -180 ||
    longitudeDestino > 180
  ) {
    throw new Error("A longitude deve estar entre -180 e 180.");
  }

  const latitudeOrigemRad = grausParaRadianos(latitudeOrigem);
  const latitudeDestinoRad = grausParaRadianos(latitudeDestino);

  const diferencaLatitude = grausParaRadianos(
    latitudeDestino - latitudeOrigem
  );

  const diferencaLongitude = grausParaRadianos(
    longitudeDestino - longitudeOrigem
  );

  const calculo =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(latitudeOrigemRad) *
      Math.cos(latitudeDestinoRad) *
      Math.sin(diferencaLongitude / 2) ** 2;

  const angulo = 2 * Math.atan2(
    Math.sqrt(calculo),
    Math.sqrt(1 - calculo)
  );

  return RAIO_TERRA_METROS * angulo;
}