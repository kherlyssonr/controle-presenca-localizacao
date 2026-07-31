import jwt from "jsonwebtoken";

export function autenticar(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return response.status(401).json({
      mensagem: "Token de autenticação não informado.",
    });
  }

  const [tipoToken, token] = authorization.split(" ");

  if (tipoToken !== "Bearer" || !token) {
    return response.status(401).json({
      mensagem: "Token de autenticação inválido.",
    });
  }

  try {
    const dadosToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    request.usuario = {
      id: Number(dadosToken.sub),
      tipo: dadosToken.tipo,
    };

    return next();
  } catch (erro) {
    return response.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }
}