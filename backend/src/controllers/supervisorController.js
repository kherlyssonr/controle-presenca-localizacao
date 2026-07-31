export function painelSupervisor(request, response) {
  return response.status(200).json({
    mensagem: "Acesso permitido à área do supervisor.",
    usuarioAutenticado: request.usuario,
  });
}