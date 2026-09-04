/**
 * Code.gs — backend do curso "Gerenciamento Empresarial" (DeCastro | O Canal do Conhecimento)
 *
 * O QUE ESTE SCRIPT FAZ
 *  - Identifica o aluno por nome + e-mail, confirmados por um código de 6 dígitos
 *    enviado por e-mail (sem precisar de conta Google nem de nenhuma configuração
 *    no Google Cloud — só o Apps Script, a planilha e o Drive, todos gratuitos).
 *  - Guarda o progresso de cada aluno (quais aulas já assistiu) numa planilha Google Sheets.
 *  - Corrige a Avaliação Final (30 questões) no servidor — o gabarito nunca fica exposto
 *    no site, só aqui.
 *  - Aplica a regra de aprovação (nota >= 7) e o prazo de espera de 10 dias para nova tentativa.
 *  - Salva uma cópia em PDF do certificado aprovado numa pasta do Google Drive.
 *
 * COMO PUBLICAR: siga o "Guia de Configuração e Implantação" que acompanha este arquivo.
 * Depois de colar este código no editor do Apps Script, rode a função configurar() uma
 * única vez (menu "Executar" ▶ escolha "configurar" ▶ Executar) para criar a planilha e a
 * pasta do Drive automaticamente. Depois disso, publique como Web App.
 */

// =====================================================================
// 1) CONFIGURAÇÃO
// =====================================================================
const NOTA_MINIMA_APROVACAO = 7;
const DIAS_ESPERA_NOVA_TENTATIVA = 10;
const TOTAL_AULAS = 23; // aula00 (inaugural) até aula22
const MINUTOS_VALIDADE_CODIGO = 10;
const DIAS_VALIDADE_SESSAO = 30;

const NOME_PLANILHA = "Gerenciamento Empresarial — Dados dos Alunos";
const NOME_PASTA_CERTIFICADOS = "Certificados — Gerenciamento Empresarial";

// Colunas da aba "Alunos" (nesta ordem). Usar os nomes evita erros de "coluna errada"
// se um dia você adicionar ou reordenar colunas na planilha.
const COLUNAS_ALUNOS = [
  "email", "nome", "aulasConcluidas", "ultimaNota", "aprovado",
  "tentativasTotais", "podeTentarEm", "certificadoUrl", "certificadoData", "atualizadoEm",
  "codigoAtual", "codigoExpiraEm", "sessionToken", "sessionExpiraEm",
];

// =====================================================================
// 2) GABARITO (30 questões) — fonte única de verdade da correção.
//    Gerado a partir de scripts/questoes_avaliacao_final.js. Nunca é enviado ao navegador.
// =====================================================================
var GABARITO = [
  {
    "n": 1,
    "unidade": 1,
    "enunciado": "Segundo a Administração Científica de Frederick Taylor, apresentada no curso, um dos princípios fundamentais é:",
    "correta": "A",
    "justificativa": "O curso apresenta quatro princípios da Administração Científica de Taylor, entre eles a substituição do empirismo pela ciência (Capítulo 1)."
  },
  {
    "n": 2,
    "unidade": 1,
    "enunciado": "Qual autor, apresentado no curso, propôs as cinco funções administrativas prever, organizar, comandar, coordenar e controlar?",
    "correta": "A",
    "justificativa": "A Teoria Clássica de Henri Fayol é apresentada no Capítulo 1, incluindo as cinco funções administrativas que mais tarde deram origem ao modelo PODC (Capítulo 2)."
  },
  {
    "n": 3,
    "unidade": 1,
    "enunciado": "Qual autor, apresentado no curso, desenvolveu a Teoria da Burocracia, cujas características incluem o caráter legal das normas, a hierarquia e a impessoalidade?",
    "correta": "A",
    "justificativa": "A Teoria da Burocracia de Max Weber é apresentada no Capítulo 1, com nove características listadas, entre elas caráter legal das normas, hierarquia e impessoalidade."
  },
  {
    "n": 4,
    "unidade": 1,
    "enunciado": "No modelo PODC apresentado no curso, qual função administrativa é responsável por estabelecer padrões, mensurar o desempenho realizado, compará-lo ao esperado e promover ações corretivas quando necessário?",
    "correta": "D",
    "justificativa": "O Capítulo 2 descreve as etapas da função Controlar: estabelecimento de padrões, mensuração, comparação e ação corretiva."
  },
  {
    "n": 5,
    "unidade": 1,
    "enunciado": "De acordo com o modelo de Edgar Schein apresentado no curso para explicar a cultura organizacional, qual é o nível mais profundo, menos visível e mais difícil de observar diretamente?",
    "correta": "C",
    "justificativa": "O Capítulo 4 apresenta os três níveis do modelo de Schein (artefatos, valores expostos e pressupostos básicos), sendo os pressupostos básicos o nível mais profundo."
  },
  {
    "n": 6,
    "unidade": 2,
    "enunciado": "Dentre os três níveis de planejamento apresentados no curso, qual deles é conduzido tipicamente por supervisores, coordenadores e líderes de equipe, com horizonte de tempo mais curto (semanas até no máximo um ano)?",
    "correta": "C",
    "justificativa": "O Capítulo 5 descreve os três níveis da pirâmide de planejamento; o nível operacional tem o horizonte mais curto e é conduzido por supervisores/coordenadores/líderes de equipe."
  },
  {
    "n": 7,
    "unidade": 2,
    "enunciado": "O Business Model Canvas, ferramenta apresentada no curso para representar visualmente um modelo de negócios em nove blocos, foi desenvolvido por:",
    "correta": "B",
    "justificativa": "O Capítulo 6 atribui o Business Model Canvas a Alexander Osterwalder, com a colaboração de Yves Pigneur."
  },
  {
    "n": 8,
    "unidade": 2,
    "enunciado": "Na análise SWOT (ou FOFA), apresentada no curso, o cruzamento entre fraquezas internas e ameaças externas indica, em geral:",
    "correta": "B",
    "justificativa": "O Capítulo 7 descreve os quatro cruzamentos da matriz SWOT; o cruzamento Fraquezas × Ameaças representa a situação de maior risco."
  },
  {
    "n": 9,
    "unidade": 2,
    "enunciado": "As cinco forças competitivas de Michael Porter, apresentadas no curso, incluem a rivalidade entre concorrentes, o poder de negociação de clientes, o poder de negociação de fornecedores, a ameaça de novos entrantes e:",
    "correta": "A",
    "justificativa": "O Capítulo 7 lista as cinco forças competitivas de Porter, incluindo a ameaça de produtos/serviços substitutos."
  },
  {
    "n": 10,
    "unidade": 2,
    "enunciado": "O Balanced Scorecard (BSC), desenvolvido por Robert Kaplan e David Norton e apresentado no curso, organiza os indicadores estratégicos em quatro perspectivas. Segundo a lógica de causa e efeito descrita no curso, qual perspectiva está na base, sustentando as demais?",
    "correta": "D",
    "justificativa": "O Capítulo 8 descreve a relação de causa e efeito ascendente entre as quatro perspectivas do BSC, partindo de Aprendizado e crescimento em direção à perspectiva Financeira."
  },
  {
    "n": 11,
    "unidade": 3,
    "enunciado": "Uma vantagem tipicamente associada ao recrutamento interno, segundo o curso, é:",
    "correta": "A",
    "justificativa": "O Capítulo 9 lista as vantagens do recrutamento interno: menor tempo/custo, efeito motivacional e aproveitamento do conhecimento da cultura organizacional."
  },
  {
    "n": 12,
    "unidade": 3,
    "enunciado": "Os três estilos clássicos de liderança apresentados no curso (associados aos estudos de Kurt Lewin) são autocrático, democrático e:",
    "correta": "B",
    "justificativa": "O Capítulo 10 apresenta os três estilos clássicos de liderança: autocrático, democrático e liberal (laissez-faire)."
  },
  {
    "n": 13,
    "unidade": 3,
    "enunciado": "Segundo a Teoria dos Dois Fatores de Frederick Herzberg, apresentada no curso, os fatores higiênicos (como salário e condições físicas de trabalho):",
    "correta": "B",
    "justificativa": "O Capítulo 10 explica que os fatores higiênicos evitam a insatisfação, mas não são, por si só, geradores de motivação — diferentemente dos fatores motivacionais."
  },
  {
    "n": 14,
    "unidade": 3,
    "enunciado": "A avaliação de desempenho de 360 graus, apresentada no curso, se caracteriza por:",
    "correta": "C",
    "justificativa": "O Capítulo 11 descreve os modelos de avaliação 90/180/360 graus; o modelo de 360 graus é o mais completo, envolvendo múltiplas fontes."
  },
  {
    "n": 15,
    "unidade": 3,
    "enunciado": "No modelo de Thomas-Kilmann para gestão de conflitos, apresentado no curso, o estilo caracterizado por alta assertividade e alta cooperação — geralmente considerado o mais desejável, embora demande mais tempo — é chamado de:",
    "correta": "C",
    "justificativa": "O Capítulo 12 apresenta os cinco estilos do modelo de Thomas-Kilmann; a Colaboração combina alta assertividade e alta cooperação."
  },
  {
    "n": 16,
    "unidade": 4,
    "enunciado": "Na Demonstração do Resultado do Exercício (DRE) apresentada no curso, o Lucro Operacional (EBIT) é obtido a partir do Lucro Bruto após a dedução de:",
    "correta": "B",
    "justificativa": "O Capítulo 13 apresenta a sequência da DRE: Lucro Bruto menos Despesas Operacionais resulta no Lucro Operacional (EBIT)."
  },
  {
    "n": 17,
    "unidade": 4,
    "enunciado": "O indicador de liquidez seca, apresentado no curso, se diferencia da liquidez corrente por:",
    "correta": "B",
    "justificativa": "O Capítulo 13 define a liquidez seca como (Ativo circulante − Estoques) ÷ Passivo circulante, diferentemente da liquidez corrente."
  },
  {
    "n": 18,
    "unidade": 4,
    "enunciado": "Diferentemente do custeio por absorção, o custeio variável (ou custeio direto), apresentado no curso:",
    "correta": "B",
    "justificativa": "O Capítulo 14 explica que o custeio variável atribui aos produtos apenas os custos variáveis, tratando os fixos como despesa do período; não é aceito para fins fiscais no Brasil."
  },
  {
    "n": 19,
    "unidade": 4,
    "enunciado": "O ponto de equilíbrio (ou ponto de ruptura), apresentado no curso, corresponde ao volume de vendas em que:",
    "correta": "B",
    "justificativa": "O Capítulo 14 define o ponto de equilíbrio como o volume em que a receita total se iguala aos custos totais."
  },
  {
    "n": 20,
    "unidade": 4,
    "enunciado": "O EBITDA, apresentado no curso, corresponde ao lucro:",
    "correta": "B",
    "justificativa": "O Capítulo 15 define o EBITDA e destaca explicitamente que ele não equivale ao fluxo de caixa real, pois não considera variações no capital de giro."
  },
  {
    "n": 21,
    "unidade": 5,
    "enunciado": "O composto de marketing, também chamado de \"4 Ps\", apresentado no curso, é formado por Produto, Preço, Promoção e:",
    "correta": "B",
    "justificativa": "O Capítulo 16 apresenta o composto de marketing (4 Ps): Produto, Preço, Praça e Promoção."
  },
  {
    "n": 22,
    "unidade": 5,
    "enunciado": "A metodologia Lean (manufatura enxuta), apresentada no curso com origem no Sistema Toyota de Produção, tem como objetivo central:",
    "correta": "B",
    "justificativa": "O Capítulo 17 apresenta a metodologia Lean e os tipos de desperdício que ela busca eliminar sistematicamente."
  },
  {
    "n": 23,
    "unidade": 5,
    "enunciado": "O ciclo PDCA, apresentado no curso como ferramenta de melhoria contínua associada à filosofia do Kaizen, é composto pelas etapas Plan, Do, Check e:",
    "correta": "A",
    "justificativa": "O Capítulo 18 apresenta as quatro etapas do ciclo PDCA: Plan, Do, Check e Act."
  },
  {
    "n": 24,
    "unidade": 5,
    "enunciado": "O Diagrama de Ishikawa (diagrama de causa e efeito, ou \"espinha de peixe\"), apresentado no curso, organiza tipicamente as causas de um problema segundo os chamados \"6 Ms\", que incluem método, mão de obra, material, máquina, medida e:",
    "correta": "B",
    "justificativa": "O Capítulo 18 apresenta os 6 Ms do Diagrama de Ishikawa: método, mão de obra, material, máquina, meio ambiente e medida."
  },
  {
    "n": 25,
    "unidade": 5,
    "enunciado": "O Princípio de Pareto (regra 80-20), apresentado no curso e adaptado à gestão da qualidade pelo consultor Joseph Juran, sugere que, de forma aproximada:",
    "correta": "B",
    "justificativa": "O Capítulo 18 apresenta o Princípio de Pareto, segundo o qual grande parte dos problemas costuma se concentrar em um número menor de causas."
  },
  {
    "n": 26,
    "unidade": 6,
    "enunciado": "Segundo o PMBOK, apresentado no curso, o ciclo de vida de um projeto é dividido em cinco grupos de processos: iniciação, planejamento, execução, encerramento e:",
    "correta": "A",
    "justificativa": "O Capítulo 19 apresenta os cinco grupos de processos do PMBOK: iniciação, planejamento, execução, monitoramento e controle, e encerramento."
  },
  {
    "n": 27,
    "unidade": 6,
    "enunciado": "No método ágil Scrum, apresentado no curso, o papel responsável por priorizar o trabalho de acordo com o valor de negócio é o(a):",
    "correta": "B",
    "justificativa": "O Capítulo 19 apresenta os três papéis do Scrum; o Product Owner é responsável por priorizar o trabalho conforme o valor de negócio."
  },
  {
    "n": 28,
    "unidade": 6,
    "enunciado": "O conceito de inovação disruptiva, apresentado no curso e associado ao autor Clayton Christensen, descreve:",
    "correta": "B",
    "justificativa": "O Capítulo 20 define inovação disruptiva, em contraste com a inovação incremental, associando o conceito a Clayton Christensen."
  },
  {
    "n": 29,
    "unidade": 6,
    "enunciado": "A sigla ESG, apresentada no curso, refere-se às dimensões:",
    "correta": "B",
    "justificativa": "O Capítulo 21 apresenta os três critérios do ESG: Ambiental, Social e Governança."
  },
  {
    "n": 30,
    "unidade": 6,
    "enunciado": "De acordo com o quadro-síntese apresentado no capítulo final do curso, a Unidade 4 (Gestão Financeira e de Custos) corresponde a quais aulas?",
    "correta": "B",
    "justificativa": "O Capítulo 22 apresenta o quadro-síntese das seis unidades do curso; a Unidade 4 corresponde às Aulas 13 a 15."
  }
];

// =====================================================================
// 3) CONFIGURAÇÃO AUTOMÁTICA (rode uma vez só, pelo editor do Apps Script)
// =====================================================================
function configurar() {
  const props = PropertiesService.getScriptProperties();

  let planilhaId = props.getProperty("SPREADSHEET_ID");
  let ss;
  if (planilhaId) {
    try { ss = SpreadsheetApp.openById(planilhaId); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(NOME_PLANILHA);
    props.setProperty("SPREADSHEET_ID", ss.getId());
    Logger.log("Planilha criada: " + ss.getUrl());
  }

  let alunos = ss.getSheetByName("Alunos");
  if (!alunos) {
    alunos = ss.getSheets()[0].setName("Alunos");
    alunos.appendRow(COLUNAS_ALUNOS);
    alunos.setFrozenRows(1);
  } else {
    // Garante que colunas novas (de uma atualização deste script) existam também
    // em planilhas criadas por uma versão anterior.
    const headerAtual = alunos.getRange(1, 1, 1, alunos.getLastColumn()).getValues()[0];
    COLUNAS_ALUNOS.forEach(function (nomeColuna, i) {
      if (headerAtual[i] !== nomeColuna) {
        alunos.getRange(1, i + 1).setValue(nomeColuna);
      }
    });
  }

  let tentativas = ss.getSheetByName("Tentativas");
  if (!tentativas) {
    tentativas = ss.insertSheet("Tentativas");
    tentativas.appendRow(["timestamp", "email", "nome", "respostas", "acertos", "nota", "aprovado"]);
    tentativas.setFrozenRows(1);
  }

  let pastaId = props.getProperty("DRIVE_FOLDER_ID");
  let pasta;
  if (pastaId) {
    try { pasta = DriveApp.getFolderById(pastaId); } catch (e) { pasta = null; }
  }
  if (!pasta) {
    pasta = DriveApp.createFolder(NOME_PASTA_CERTIFICADOS);
    props.setProperty("DRIVE_FOLDER_ID", pasta.getId());
    Logger.log("Pasta de certificados criada: " + pasta.getUrl());
  }

  Logger.log("Configuração concluída.");
  Logger.log("Planilha: " + ss.getUrl());
  Logger.log("Pasta de certificados: " + pasta.getUrl());
  Logger.log("Agora publique este projeto como Web App (veja o guia de configuração).");
}

// =====================================================================
// 4) PONTO DE ENTRADA HTTP
// =====================================================================
function doPost(e) {
  let dados;
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ erro: "REQUISICAO_INVALIDA" });
  }

  const acao = dados.action;
  try {
    switch (acao) {
      case "solicitarCodigo":
        return jsonResponse(acaoSolicitarCodigo(dados));
      case "confirmarCodigo":
        return jsonResponse(acaoConfirmarCodigo(dados));
      case "marcarAula":
        return jsonResponse(acaoMarcarAula(dados));
      case "status":
        return jsonResponse(acaoStatus(dados));
      case "registrarAvaliacao":
        return jsonResponse(acaoRegistrarAvaliacao(dados));
      case "emitirCertificado":
        return jsonResponse(acaoEmitirCertificado(dados));
      default:
        return jsonResponse({ erro: "ACAO_DESCONHECIDA" });
    }
  } catch (err) {
    Logger.log("Erro em doPost: " + err);
    return jsonResponse({ erro: "ERRO_INTERNO", detalhe: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
// 5) PLANILHA — helpers (colunas acessadas pelo nome, não por número)
// =====================================================================
function getSheets() {
  const props = PropertiesService.getScriptProperties();
  const planilhaId = props.getProperty("SPREADSHEET_ID");
  if (!planilhaId) {
    throw new Error("Script não configurado — rode a função configurar() primeiro.");
  }
  const ss = SpreadsheetApp.openById(planilhaId);
  return { alunos: ss.getSheetByName("Alunos"), tentativas: ss.getSheetByName("Tentativas") };
}

function mapaColunas(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapa = {};
  header.forEach(function (nome, i) { mapa[nome] = i; }); // índice baseado em 0
  return mapa;
}

function encontrarLinhaAluno(sheet, email) {
  const dados = sheet.getDataRange().getValues();
  const col = mapaColunas(sheet);
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][col.email]).toLowerCase() === String(email).toLowerCase()) {
      return { linha: i + 1, valores: dados[i], col: col };
    }
  }
  return null;
}

function lerAulasConcluidas(valor) {
  if (!valor) return [];
  return String(valor)
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ""; })
    .map(Number);
}

function nowIso() {
  return new Date().toISOString();
}
function addMinutosIso(minutos) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutos);
  return d.toISOString();
}
function addDiasIso(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}
function ehBooleano(valor) {
  return valor === true || valor === "TRUE" || valor === "true";
}

// Garante que existe uma linha para este aluno; devolve {linha, valores, col}
function garantirAluno(sheet, email, nome) {
  const existente = encontrarLinhaAluno(sheet, email);
  if (existente) {
    if (nome && existente.valores[existente.col.nome] !== nome) {
      sheet.getRange(existente.linha, existente.col.nome + 1).setValue(nome);
    }
    return existente;
  }
  const col = mapaColunas(sheet);
  const novaLinha = COLUNAS_ALUNOS.map(function (nomeColuna) {
    if (nomeColuna === "email") return email;
    if (nomeColuna === "nome") return nome || "";
    if (nomeColuna === "aprovado") return false;
    if (nomeColuna === "tentativasTotais") return 0;
    if (nomeColuna === "atualizadoEm") return nowIso();
    return "";
  });
  sheet.appendRow(novaLinha);
  return { linha: sheet.getLastRow(), valores: novaLinha, col: col };
}

function setCampo(sheet, registro, nomeColuna, valor) {
  sheet.getRange(registro.linha, registro.col[nomeColuna] + 1).setValue(valor);
}
function getCampo(registro, nomeColuna) {
  return registro.valores[registro.col[nomeColuna]];
}

// Confirma que o aluno está numa sessão válida (fez login com código de e-mail
// há menos de DIAS_VALIDADE_SESSAO dias). Retorna o registro do aluno, ou null.
function verificarSessao(dados) {
  if (!dados.email || !dados.sessionToken) return null;
  const { alunos } = getSheets();
  const registro = encontrarLinhaAluno(alunos, dados.email);
  if (!registro) return null;
  const token = getCampo(registro, "sessionToken");
  const expira = getCampo(registro, "sessionExpiraEm");
  if (!token || token !== dados.sessionToken) return null;
  if (!expira || new Date(expira) < new Date()) return null;
  return registro;
}

// =====================================================================
// 6) AÇÕES — login por código de e-mail
// =====================================================================
function gerarCodigo6Digitos() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function acaoSolicitarCodigo(dados) {
  const email = String(dados.email || "").trim().toLowerCase();
  const nome = String(dados.nome || "").trim();
  if (!email || email.indexOf("@") === -1) return { erro: "EMAIL_INVALIDO" };
  if (!nome) return { erro: "NOME_AUSENTE" };

  const { alunos } = getSheets();
  const registro = garantirAluno(alunos, email, nome);
  const codigo = gerarCodigo6Digitos();
  setCampo(alunos, registro, "codigoAtual", codigo);
  setCampo(alunos, registro, "codigoExpiraEm", addMinutosIso(MINUTOS_VALIDADE_CODIGO));

  MailApp.sendEmail({
    to: email,
    subject: "Seu código de acesso — Gerenciamento Empresarial (DeCastro)",
    body:
      "Olá, " + nome + "!\n\n" +
      "Seu código de acesso ao curso Gerenciamento Empresarial é: " + codigo + "\n\n" +
      "Esse código é válido por " + MINUTOS_VALIDADE_CODIGO + " minutos. Se você não pediu este código, pode ignorar este e-mail.\n\n" +
      "Um abraço,\nEquipe DeCastro | O Canal do Conhecimento",
  });

  return { ok: true };
}

function acaoConfirmarCodigo(dados) {
  const email = String(dados.email || "").trim().toLowerCase();
  const codigo = String(dados.codigo || "").trim();
  if (!email || !codigo) return { erro: "DADOS_AUSENTES" };

  const { alunos } = getSheets();
  const registro = encontrarLinhaAluno(alunos, email);
  if (!registro) return { erro: "CODIGO_INVALIDO" };

  const codigoAtual = getCampo(registro, "codigoAtual");
  const codigoExpiraEm = getCampo(registro, "codigoExpiraEm");
  if (!codigoAtual || codigoAtual !== codigo) return { erro: "CODIGO_INVALIDO" };
  if (!codigoExpiraEm || new Date(codigoExpiraEm) < new Date()) return { erro: "CODIGO_EXPIRADO" };

  const sessionToken = Utilities.getUuid() + Utilities.getUuid();
  setCampo(alunos, registro, "sessionToken", sessionToken);
  setCampo(alunos, registro, "sessionExpiraEm", addDiasIso(DIAS_VALIDADE_SESSAO));
  setCampo(alunos, registro, "codigoAtual", ""); // código de uso único
  setCampo(alunos, registro, "codigoExpiraEm", "");
  if (dados.nome) setCampo(alunos, registro, "nome", dados.nome);

  return { ok: true, sessionToken: sessionToken };
}

// =====================================================================
// 7) AÇÕES — progresso, avaliação e certificado (exigem sessão válida)
// =====================================================================
function acaoMarcarAula(dados) {
  const registroSessao = verificarSessao(dados);
  if (!registroSessao) return { erro: "SESSAO_EXPIRADA" };

  const aulaNumero = Number(dados.aula);
  if (isNaN(aulaNumero) || aulaNumero < 0 || aulaNumero >= TOTAL_AULAS) {
    return { erro: "AULA_INVALIDA" };
  }
  const { alunos } = getSheets();
  const aulas = new Set(lerAulasConcluidas(getCampo(registroSessao, "aulasConcluidas")));
  aulas.add(aulaNumero);
  const listaOrdenada = Array.from(aulas).sort(function (a, b) { return a - b; });
  setCampo(alunos, registroSessao, "aulasConcluidas", listaOrdenada.join(","));
  setCampo(alunos, registroSessao, "atualizadoEm", nowIso());
  return { ok: true, aulasConcluidas: listaOrdenada };
}

function montarStatus(registro) {
  const aulasConcluidas = lerAulasConcluidas(getCampo(registro, "aulasConcluidas"));
  const ultimaNotaValor = getCampo(registro, "ultimaNota");
  const ultimaNota = ultimaNotaValor === "" ? null : Number(ultimaNotaValor);
  const aprovado = ehBooleano(getCampo(registro, "aprovado"));
  const tentativasTotais = Number(getCampo(registro, "tentativasTotais") || 0);
  const podeTentarEm = getCampo(registro, "podeTentarEm") || null;
  const certificadoUrl = getCampo(registro, "certificadoUrl") || null;
  return {
    nome: getCampo(registro, "nome"),
    email: getCampo(registro, "email"),
    aulasConcluidas: aulasConcluidas,
    avaliacao: tentativasTotais > 0 || aprovado
      ? {
          ultimaNota: ultimaNota,
          aprovado: aprovado,
          tentativasTotais: tentativasTotais,
          podeTentarEm: podeTentarEm,
          certificadoUrl: certificadoUrl,
        }
      : null,
  };
}

function acaoStatus(dados) {
  const registroSessao = verificarSessao(dados);
  if (!registroSessao) return { erro: "SESSAO_EXPIRADA" };
  return montarStatus(registroSessao);
}

function acaoRegistrarAvaliacao(dados) {
  const registroSessao = verificarSessao(dados);
  if (!registroSessao) return { erro: "SESSAO_EXPIRADA" };

  const { alunos, tentativas } = getSheets();
  const email = getCampo(registroSessao, "email");
  const aulasConcluidas = lerAulasConcluidas(getCampo(registroSessao, "aulasConcluidas"));

  if (aulasConcluidas.length < TOTAL_AULAS) {
    return { erro: "CURSO_INCOMPLETO" };
  }
  if (ehBooleano(getCampo(registroSessao, "aprovado"))) {
    return { erro: "JA_APROVADO" };
  }
  const podeTentarEm = getCampo(registroSessao, "podeTentarEm");
  if (podeTentarEm && new Date(podeTentarEm) > new Date()) {
    return { erro: "BLOQUEADO", podeTentarEm: podeTentarEm };
  }

  const respostas = Array.isArray(dados.respostas) ? dados.respostas : [];
  let acertos = 0;
  const revisao = GABARITO.map(function (q, i) {
    const suaResposta = respostas[i] || null;
    const acertou = suaResposta === q.correta;
    if (acertou) acertos++;
    return {
      n: q.n,
      enunciado: q.enunciado,
      suaResposta: suaResposta,
      correta: q.correta,
      acertou: acertou,
      justificativa: q.justificativa,
    };
  });
  const total = GABARITO.length;
  const nota = Math.round((acertos / total) * 10 * 10) / 10; // 1 casa decimal
  const aprovado = nota >= NOTA_MINIMA_APROVACAO;
  const tentativasTotais = Number(getCampo(registroSessao, "tentativasTotais") || 0) + 1;
  const novoPodeTentarEm = aprovado ? "" : addDiasIso(DIAS_ESPERA_NOVA_TENTATIVA);
  const nome = getCampo(registroSessao, "nome");

  tentativas.appendRow([nowIso(), email, nome, JSON.stringify(respostas), acertos, nota, aprovado]);

  setCampo(alunos, registroSessao, "ultimaNota", nota);
  setCampo(alunos, registroSessao, "aprovado", aprovado);
  setCampo(alunos, registroSessao, "tentativasTotais", tentativasTotais);
  setCampo(alunos, registroSessao, "podeTentarEm", novoPodeTentarEm);
  setCampo(alunos, registroSessao, "atualizadoEm", nowIso());

  return {
    nota: nota,
    acertos: acertos,
    total: total,
    aprovado: aprovado,
    tentativasTotais: tentativasTotais,
    podeTentarEm: aprovado ? null : novoPodeTentarEm,
    certificadoUrl: null,
    revisao: revisao,
  };
}

function acaoEmitirCertificado(dados) {
  const registroSessao = verificarSessao(dados);
  if (!registroSessao) return { erro: "SESSAO_EXPIRADA" };
  if (!dados.pdfBase64) return { erro: "PDF_AUSENTE" };
  if (!ehBooleano(getCampo(registroSessao, "aprovado"))) return { erro: "NAO_APROVADO" };

  const { alunos } = getSheets();
  const props = PropertiesService.getScriptProperties();
  const pastaId = props.getProperty("DRIVE_FOLDER_ID");
  if (!pastaId) return { erro: "SCRIPT_NAO_CONFIGURADO" };
  const pasta = DriveApp.getFolderById(pastaId);

  const email = getCampo(registroSessao, "email");
  const nome = dados.nome || getCampo(registroSessao, "nome") || email;
  const bytes = Utilities.base64Decode(dados.pdfBase64);
  const blob = Utilities.newBlob(bytes, "application/pdf", "Certificado - " + nome + ".pdf");
  const arquivo = pasta.createFile(blob);
  arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = arquivo.getUrl();

  setCampo(alunos, registroSessao, "certificadoUrl", url);
  setCampo(alunos, registroSessao, "certificadoData", nowIso());
  setCampo(alunos, registroSessao, "atualizadoEm", nowIso());

  // Envia uma cópia por e-mail ao aluno (opcional — não impede o retorno em caso de falha)
  try {
    MailApp.sendEmail({
      to: email,
      subject: "Seu certificado — Gerenciamento Empresarial (DeCastro)",
      body:
        "Olá, " + nome + "!\n\n" +
        "Parabéns pela conclusão do curso Gerenciamento Empresarial. Seu certificado está anexado a este e-mail " +
        "e também disponível em: " + url + "\n\n" +
        "Um abraço,\nEquipe DeCastro | O Canal do Conhecimento",
      attachments: [blob],
    });
  } catch (err) {
    Logger.log("Não foi possível enviar o e-mail do certificado: " + err);
  }

  return { ok: true, certificadoUrl: url };
}
