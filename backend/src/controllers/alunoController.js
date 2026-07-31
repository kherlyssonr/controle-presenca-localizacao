export function painelAluno(request, response) {
  return response.status(200).json({
    mensagem: "Acesso permitido à área do aluno.",
    usuarioAutenticado: request.usuario,
  });
}