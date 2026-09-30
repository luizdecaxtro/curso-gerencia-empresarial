/*!
 * curso.js — camada compartilhada do curso "Gerenciamento Empresarial" (DeCastro)
 * Usado por: todas as aula-NN.html e painel.html
 *
 * COMO O ACESSO FUNCIONA
 *  O curso é um complemento do livro "Gerenciamento Empresarial". Quem compra o livro
 *  recebe um código de acesso; o mesmo código, digitado no painel, libera as 23 aulas.
 *  Não há e-mail, senha nem servidor: o código fica aqui em CONFIG.CODIGO_ACESSO e o
 *  navegador do aluno lembra que ele já entrou.
 *
 *  Para trocar o código: altere CODIGO_ACESSO abaixo. Quem já tinha entrado com o código
 *  antigo precisará digitar o novo.
 *
 *  Atenção: como o site é estático, o código pode ser lido por quem inspecionar este
 *  arquivo. Ele organiza o acesso dos compradores, mas não é uma proteção à prova de
 *  quem queira burlar.
 */
(function (global) {
  "use strict";

  const CONFIG = {
    CODIGO_ACESSO: "22CGE26",
    WHATSAPP_NUMERO: "5598988804678", // (98) 98880-4678
    SUPORTE_EMAIL: "lojasdecastro@gmail.com",
    TOTAL_AULAS: 23, // aula00 (inaugural) até aula22
  };

  // ---------------------------------------------------------------------
  // LISTA DAS AULAS, UNIDADES E MATERIAL EM PDF (usados no Painel e nas aulas)
  // ---------------------------------------------------------------------
  const LESSONS = [
    { n: 0, unidade: null, titulo: "Aula Inaugural — Boas-vindas ao curso" },
    { n: 1, unidade: 1, titulo: "Introdução à Gestão Empresarial e Evolução do Pensamento Administrativo" },
    { n: 2, unidade: 1, titulo: "Funções Administrativas: Planejar, Organizar, Dirigir e Controlar (PODC)" },
    { n: 3, unidade: 1, titulo: "Estruturas e Modelos Organizacionais" },
    { n: 4, unidade: 1, titulo: "Cultura, Clima e Ambiente Organizacional" },
    { n: 5, unidade: 2, titulo: "Planejamento Estratégico, Tático e Operacional" },
    { n: 6, unidade: 2, titulo: "Missão, Visão, Valores e Modelo de Negócios (Business Model Canvas)" },
    { n: 7, unidade: 2, titulo: "Análise de Ambiente e Vantagem Competitiva" },
    { n: 8, unidade: 2, titulo: "Indicadores de Desempenho e Balanced Scorecard (BSC)" },
    { n: 9, unidade: 3, titulo: "Gestão de Pessoas: Recrutamento, Seleção e Integração" },
    { n: 10, unidade: 3, titulo: "Liderança e Motivação nas Organizações" },
    { n: 11, unidade: 3, titulo: "Desenvolvimento de Equipes e Avaliação de Desempenho" },
    { n: 12, unidade: 3, titulo: "Comunicação Organizacional e Gestão de Conflitos" },
    { n: 13, unidade: 4, titulo: "Fundamentos de Gestão Financeira: Fluxo de Caixa, DRE e Balanço Patrimonial" },
    { n: 14, unidade: 4, titulo: "Gestão de Custos e Formação de Preços" },
    { n: 15, unidade: 4, titulo: "Planejamento Orçamentário e Indicadores Financeiros" },
    { n: 16, unidade: 5, titulo: "Fundamentos de Marketing e Gestão Comercial" },
    { n: 17, unidade: 5, titulo: "Gestão de Processos, Operações e Cadeia de Suprimentos" },
    { n: 18, unidade: 5, titulo: "Gestão da Qualidade e Produtividade" },
    { n: 19, unidade: 6, titulo: "Gestão de Projetos: Fundamentos do PMBOK e Métodos Ágeis" },
    { n: 20, unidade: 6, titulo: "Inovação, Empreendedorismo Corporativo e Transformação Digital" },
    { n: 21, unidade: 6, titulo: "Ética, Responsabilidade Social e Sustentabilidade (ESG)" },
    { n: 22, unidade: 6, titulo: "Tendências em Gestão Empresarial e Plano de Ação Final" },
  ];
  const UNIDADES = {
    1: "Fundamentos da Gestão Empresarial",
    2: "Planejamento Estratégico",
    3: "Gestão de Pessoas",
    4: "Gestão Financeira e de Custos",
    5: "Marketing, Processos e Qualidade",
    6: "Gestão Estratégica Avançada e Tendências",
  };

  function aulaFile(n) {
    return "aula-" + String(n).padStart(2, "0") + ".html";
  }

  // ---------------------------------------------------------------------
  // Material didático (capítulos em PDF, um por aula) — hospedados no
  // Google Drive do professor. Usado no Painel (link "📄 PDF" por aula) e
  // em cada página de aula (link "Baixar o capítulo em PDF").
  // ---------------------------------------------------------------------
  const MATERIAIS = {
    0: "https://drive.google.com/file/d/1NWCegOKDzSwwyi424EqcoO4jbIA6pBjT/view?usp=sharing",
    1: "https://drive.google.com/file/d/1RVgnoJw1ymlHuw_O5qcG1Dv3yAnRfw-x/view?usp=sharing",
    2: "https://drive.google.com/file/d/1Ws6XFHRL1fiWXbnrz_Ims1XJ9GuMjBJG/view?usp=sharing",
    3: "https://drive.google.com/file/d/1IIHxn3rcuakcaUBaWFUoQD7z2uGg8XLw/view?usp=sharing",
    4: "https://drive.google.com/file/d/1i5IZYVUT7380MbHnTeq9OM1dNY3On3-F/view?usp=sharing",
    5: "https://drive.google.com/file/d/1GdksjOQucqVpcscsxqU2a7sXkpuXA0e4/view?usp=sharing",
    6: "https://drive.google.com/file/d/1jafBWfHFTGnjstB-mk_xPuUEQUx3Ko_A/view?usp=sharing",
    7: "https://drive.google.com/file/d/1y0ggxb99k40DQIGp9jCoL0-wum-5HzXf/view?usp=sharing",
    8: "https://drive.google.com/file/d/1ywYauBrHDLXz1LTPatTFTovNsRHjBZKx/view?usp=sharing",
    9: "https://drive.google.com/file/d/1CQ2tT0Ne6mAgDEWDiJb7nN360-GTz5w2/view?usp=sharing",
    10: "https://drive.google.com/file/d/1gyZgxxGwFX8pwflgH-kz4-h9wQdkSenv/view?usp=sharing",
    11: "https://drive.google.com/file/d/12dKlL195eXwX6JYry0zcaQy1QGAfQtJU/view?usp=sharing",
    12: "https://drive.google.com/file/d/1Ilc6vdaMfFUtaMerDjZjE0aS_c7mMUST/view?usp=sharing",
    13: "https://drive.google.com/file/d/1cE8GV8N8xtEbLnhsYH38UP9oupbqciAu/view?usp=sharing",
    14: "https://drive.google.com/file/d/10mFn8D_9_CKcGpaUTmGN7BP6hL7vqM3i/view?usp=sharing",
    15: "https://drive.google.com/file/d/1IQvD719JRiBZudzwOWG-zVSFcWxs3jge/view?usp=sharing",
    16: "https://drive.google.com/file/d/1Fq5UFdRB-JfmSqCokuUhlxtqw4fysFCk/view?usp=sharing",
    17: "https://drive.google.com/file/d/1nedUFyHMsnNNOXesNxkMr7lBfD2if0ue/view?usp=sharing",
    18: "https://drive.google.com/file/d/1QXRiS1iccaZh6zFEGt0011TOezuJodws/view?usp=sharing",
    19: "https://drive.google.com/file/d/1U7nTdO-GnFjvxDcHlYDkHJijSIPW_req/view?usp=sharing",
    20: "https://drive.google.com/file/d/1faBLKPkgvO2fxT4IE7XLJApJdgffp5_E/view?usp=sharing",
    21: "https://drive.google.com/file/d/1lFTB1blAS7JJ7UXLarndG2PL57ONI6z8/view?usp=sharing",
    22: "https://drive.google.com/file/d/1oUHVEEaN5Ri1Cpk5Eoxz141tZcEf5Ume/view?usp=sharing",
  };

  // ---------------------------------------------------------------------
  // ACESSO POR CÓDIGO (guardado no navegador do aluno)
  // ---------------------------------------------------------------------
  const LS_ACESSO = "decastro_acesso_v2";
  const LS_PROGRESSO = "decastro_progresso_v1"; // aulas já assistidas, só neste aparelho

  // Ignora espaços e maiúsculas/minúsculas: "22cge26" e " 22CGE26 " valem igual.
  function normalizar(codigo) {
    return String(codigo || "").replace(/\s+/g, "").toUpperCase();
  }

  function temAcesso() {
    try {
      return normalizar(localStorage.getItem(LS_ACESSO)) === normalizar(CONFIG.CODIGO_ACESSO);
    } catch (e) {
      return false;
    }
  }

  // Devolve "ok", "invalido" (código errado) ou "armazenamento" (navegador não deixou salvar).
  function entrar(codigo) {
    if (normalizar(codigo) !== normalizar(CONFIG.CODIGO_ACESSO)) return "invalido";
    try {
      localStorage.setItem(LS_ACESSO, normalizar(codigo));
    } catch (e) {
      return "armazenamento";
    }
    return temAcesso() ? "ok" : "armazenamento";
  }

  function logout() {
    try {
      localStorage.removeItem(LS_ACESSO);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------
  // PROGRESSO (só neste aparelho — não há servidor)
  // ---------------------------------------------------------------------
  function getProgressoLocal() {
    try {
      const raw = localStorage.getItem(LS_PROGRESSO);
      const p = raw ? JSON.parse(raw) : null;
      return p && Array.isArray(p.aulasConcluidas) ? p : { aulasConcluidas: [] };
    } catch (e) {
      return { aulasConcluidas: [] };
    }
  }
  function marcarAulaConcluidaLocal(n) {
    const p = getProgressoLocal();
    if (p.aulasConcluidas.indexOf(n) === -1) p.aulasConcluidas.push(n);
    try {
      localStorage.setItem(LS_PROGRESSO, JSON.stringify(p));
    } catch (e) {}
    return p;
  }
  // As páginas de aula chamam esta função ao terminar; agora só registra localmente.
  function marcarAulaConcluida(numero) {
    marcarAulaConcluidaLocal(numero);
    return Promise.resolve(null);
  }

  // Primeira aula ainda não assistida, ou null se o aluno já assistiu todas.
  function proximaAula(aulasConcluidas) {
    const feitas = aulasConcluidas || [];
    for (let i = 0; i < LESSONS.length; i++) {
      if (feitas.indexOf(LESSONS[i].n) === -1) return LESSONS[i];
    }
    return null;
  }

  // Botão "Sair" no canto do cabeçalho (aparece só para quem já entrou).
  function renderAlunoTag(elemento, opts) {
    if (!elemento) return;
    opts = opts || {};
    elemento.textContent = "";
    if (!temAcesso()) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "decastro-aluno-sair";
    btn.title = "Sair";
    btn.textContent = "Sair";
    btn.addEventListener("click", function () {
      logout();
      if (opts.onLogout) opts.onLogout();
      else location.reload();
    });
    elemento.appendChild(btn);
  }

  // ---------------------------------------------------------------------
  // TRAVA DAS PÁGINAS DE AULA
  //   Roda sozinha em qualquer aula-NN.html que carregue este arquivo:
  //   sem o código, o aluno é levado ao Painel e volta para a aula depois de entrar.
  // ---------------------------------------------------------------------
  function guardAula() {
    const m = location.pathname.match(/aula-(\d+)\.html$/i);
    if (!m || temAcesso()) return;
    location.replace("painel.html?retorno=" + encodeURIComponent(aulaFile(Number(m[1]))));
  }

  // Limpeza: remove dados do antigo login por e-mail, que não é mais usado.
  try {
    localStorage.removeItem("decastro_aluno_v1");
  } catch (e) {}

  global.Curso = {
    CONFIG: CONFIG,
    LESSONS: LESSONS,
    UNIDADES: UNIDADES,
    MATERIAIS: MATERIAIS,
    aulaFile: aulaFile,
    temAcesso: temAcesso,
    entrar: entrar,
    logout: logout,
    getProgressoLocal: getProgressoLocal,
    marcarAulaConcluidaLocal: marcarAulaConcluidaLocal,
    marcarAulaConcluida: marcarAulaConcluida,
    proximaAula: proximaAula,
    renderAlunoTag: renderAlunoTag,
    whatsappLink: function (mensagem) {
      const msg = mensagem || "Olá! Preciso de ajuda para acessar o curso Gerenciamento Empresarial.";
      return "https://wa.me/" + CONFIG.WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
    },
  };

  guardAula();
})(window);
