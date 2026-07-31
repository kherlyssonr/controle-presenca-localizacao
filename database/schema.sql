-- =============================================
-- Sistema de Controle de Presença por Localização
-- Estrutura inicial do banco de dados
-- =============================================


-- Usuários que poderão acessar o sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT verificar_tipo_usuario
    CHECK (tipo IN ('ALUNO', 'SUPERVISOR'))
);


-- Informações específicas dos alunos
CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE,
  matricula VARCHAR(50) NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT alunos_usuario_fk
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT
);


-- Configuração da instituição
CREATE TABLE IF NOT EXISTS instituicao (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  raio_permitido NUMERIC(10, 2) NOT NULL,
  precisao_maxima NUMERIC(10, 2) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT verificar_raio_permitido
    CHECK (raio_permitido > 0),

  CONSTRAINT verificar_precisao_maxima
    CHECK (precisao_maxima > 0)
);


-- Presenças registradas pelos alunos
CREATE TABLE IF NOT EXISTS presencas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aluno_id INTEGER NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario TIME NOT NULL DEFAULT CURRENT_TIME,
  precisao NUMERIC(10, 2),
  distancia NUMERIC(10, 2),
  tipo_registro VARCHAR(20) NOT NULL,
  justificativa TEXT,
  registrado_por INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT presencas_aluno_fk
    FOREIGN KEY (aluno_id)
    REFERENCES alunos(id)
    ON DELETE RESTRICT,

  CONSTRAINT presencas_usuario_fk
    FOREIGN KEY (registrado_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,

  CONSTRAINT verificar_tipo_registro
    CHECK (tipo_registro IN ('AUTOMATICO', 'MANUAL')),

  CONSTRAINT verificar_precisao
    CHECK (precisao IS NULL OR precisao >= 0),

  CONSTRAINT verificar_distancia
    CHECK (distancia IS NULL OR distancia >= 0),

  CONSTRAINT verificar_justificativa_manual
    CHECK (
      (
        tipo_registro = 'AUTOMATICO'
        AND justificativa IS NULL
      )
      OR
      (
        tipo_registro = 'MANUAL'
        AND NULLIF(BTRIM(justificativa), '') IS NOT NULL
      )
    ),

  CONSTRAINT presenca_unica_por_dia
    UNIQUE (aluno_id, data)
);


-- Índice para consultas das presenças de um dia
CREATE INDEX IF NOT EXISTS presencas_data_idx
  ON presencas(data);