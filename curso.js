/*!
 * curso.js — camada compartilhada do curso "Gerenciamento Empresarial" (DeCastro)
 * Usado por: todas as aula-NN.html, painel.html e avaliacao-final.html
 *
 * Responsabilidades:
 *  - Configuração central (preencher CONFIG.APPS_SCRIPT_URL depois de seguir o guia).
 *  - Login simples do aluno: nome + e-mail, confirmados por um código de 6 dígitos
 *    enviado por e-mail (sem precisar de conta Google nem de configuração no
 *    Google Cloud — só o Apps Script, que é gratuito).
 *  - Chamadas ao backend (Google Apps Script) que guarda o progresso na planilha.
 *  - Cache local (localStorage) para a tela responder rápido mesmo com internet lenta.
 *  - Lista das 23 aulas do curso (temas e unidades), usada no Painel.
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------------
  // 1) CONFIGURAÇÃO — edite este valor após seguir o guia de configuração
  // ---------------------------------------------------------------------
  const CONFIG = {
    // Cole aqui a URL do Web App publicado no Apps Script (termina em /exec)
    APPS_SCRIPT_URL: "COLE_AQUI_A_URL_DO_APPS_SCRIPT",
    // Dados de suporte (já preenchidos)
    WHATSAPP_NUMERO: "5598988804678", // (98) 98880-4678
    SUPORTE_EMAIL: "lojasdecastro@gmail.com",
    // Regras da avaliação final
    NOTA_MINIMA_APROVACAO: 7,
    DIAS_ESPERA_NOVA_TENTATIVA: 10,
    TOTAL_AULAS: 23, // aula00 (inaugural) até aula22
  };

  function isConfigured() {
    return CONFIG.APPS_SCRIPT_URL && !CONFIG.APPS_SCRIPT_URL.startsWith("COLE_AQUI");
  }

  // ---------------------------------------------------------------------
  // 2) LISTA DAS AULAS (tema e unidade de cada uma) — usada no Painel
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
  // 3) IDENTIDADE DO ALUNO (localStorage) — cache local, a planilha é a fonte oficial
  // ---------------------------------------------------------------------
  const LS_ALUNO = "decastro_aluno_v1";
  const LS_PROGRESSO = "decastro_progresso_v1";

  function getAluno() {
    try {
      const raw = localStorage.getItem(LS_ALUNO);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function setAluno(aluno) {
    try {
      localStorage.setItem(LS_ALUNO, JSON.stringify(aluno));
    } catch (e) {
      /* navegador sem localStorage disponível — segue sem cache */
    }
  }
  function logout() {
    try {
      localStorage.removeItem(LS_ALUNO);
      localStorage.removeItem(LS_PROGRESSO);
    } catch (e) {}
  }

  function getProgressoLocal() {
    try {
      const raw = localStorage.getItem(LS_PROGRESSO);
      return raw ? JSON.parse(raw) : { aulasConcluidas: [] };
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

  // ---------------------------------------------------------------------
  // 4) CHAMADAS AO BACKEND (Google Apps Script)
  //    Observação técnica: usamos Content-Type "text/plain" de propósito.
  //    Isso evita o preflight OPTIONS do CORS, que o Apps Script não
  //    responde corretamente — é o padrão recomendado para integrar
  //    Apps Script com fetch() a partir de um site estático.
  //
  //    A maioria das ações reenvia o "sessionToken" obtido depois que o aluno
  //    confirma o código recebido por e-mail, para que o servidor confirme a
  //    identidade em vez de confiar apenas no e-mail informado pelo navegador.
  //    A sessão dura vários dias; quando expira, pedimos para o aluno entrar
  //    de novo (com um novo código).
  // ---------------------------------------------------------------------
  function api(action, payload) {
    if (!isConfigured()) {
      return Promise.reject(new Error("SISTEMA_NAO_CONFIGURADO"));
    }
    const aluno = getAluno();
    const withToken = Object.assign({ action: action }, payload || {});
    if (aluno && aluno.sessionToken && action !== "solicitarCodigo" && action !== "confirmarCodigo") {
      withToken.sessionToken = aluno.sessionToken;
    }
    const body = JSON.stringify(withToken);
    return fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body,
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP_" + resp.status);
        return resp.json();
      })
      .then(function (data) {
        if (data && data.erro === "SESSAO_EXPIRADA") {
          logout();
        }
        if (data && data.erro) throw new Error(data.erro);
        return data;
      });
  }

  function marcarAulaConcluida(numero) {
    marcarAulaConcluidaLocal(numero); // resposta visual imediata, mesmo se a rede falhar
    const aluno = getAluno();
    if (!aluno) return Promise.resolve(null);
    return api("marcarAula", { email: aluno.email, nome: aluno.nome, aula: numero }).catch(function (err) {
      console.warn("Não foi possível registrar a conclusão da aula no servidor:", err.message);
      return null;
    });
  }

  function getStatus(email) {
    const aluno = email ? { email: email } : getAluno();
    if (!aluno) return Promise.reject(new Error("SEM_ALUNO"));
    return api("status", { email: aluno.email });
  }

  function enviarAvaliacao(respostas) {
    const aluno = getAluno();
    if (!aluno) return Promise.reject(new Error("SEM_ALUNO"));
    return api("registrarAvaliacao", { email: aluno.email, nome: aluno.nome, respostas: respostas });
  }

  function emitirCertificado(pdfBase64) {
    const aluno = getAluno();
    if (!aluno) return Promise.reject(new Error("SEM_ALUNO"));
    return api("emitirCertificado", { email: aluno.email, nome: aluno.nome, pdfBase64: pdfBase64 });
  }

  // ---------------------------------------------------------------------
  // 5) LOGIN POR E-MAIL COM CÓDIGO DE 6 DÍGITOS (sem Google Cloud)
  // ---------------------------------------------------------------------
  // Passo 1: o aluno informa nome + e-mail; o servidor gera um código e envia
  // por e-mail (válido por 10 minutos).
  function solicitarCodigo(nome, email) {
    if (!isConfigured()) return Promise.reject(new Error("SISTEMA_NAO_CONFIGURADO"));
    return api("solicitarCodigo", { nome: nome, email: email });
  }

  // Passo 2: o aluno digita o código recebido. Se estiver certo, o servidor
  // devolve um "sessionToken" que passa a identificar o aluno nas próximas
  // chamadas (fica guardado no navegador, não precisa digitar de novo).
  function confirmarCodigo(nome, email, codigo) {
    if (!isConfigured()) return Promise.reject(new Error("SISTEMA_NAO_CONFIGURADO"));
    return api("confirmarCodigo", { nome: nome, email: email, codigo: codigo }).then(function (resposta) {
      const aluno = {
        email: email,
        nome: nome,
        sessionToken: resposta.sessionToken,
        loginEm: new Date().toISOString(),
      };
      setAluno(aluno);
      return aluno;
    });
  }

  // ---------------------------------------------------------------------
  // 5b) FORMULÁRIO DE LOGIN (compartilhado entre painel.html e avaliacao-final.html)
  //     Duas etapas: (1) nome + e-mail → pede o código; (2) código → confirma.
  //     Usa estilo inline para não depender do CSS específico de cada página.
  // ---------------------------------------------------------------------
  const ESTILO_BOTAO =
    "display:inline-block;background:#b08d2b;color:#2a2107;font-weight:700;font-size:.86rem;" +
    "padding:10px 22px;border-radius:999px;border:none;cursor:pointer;";
  const ESTILO_INPUT =
    "width:100%;box-sizing:border-box;padding:10px 12px;border-radius:9px;border:1px solid #dfe7e3;" +
    "font-size:.9rem;margin-bottom:10px;font-family:inherit;";
  const ESTILO_ERRO = "color:#a5342a;font-size:.8rem;margin:8px 0 0;min-height:1em;";
  const ESTILO_AJUDA = "font-size:.76rem;color:#4b5b56;margin:0 0 12px;line-height:1.5;";

  const MENSAGENS_ERRO = {
    SISTEMA_NAO_CONFIGURADO: "O sistema de login ainda não foi configurado neste site.",
    EMAIL_INVALIDO: "Digite um e-mail válido.",
    NOME_AUSENTE: "Digite seu nome.",
    DADOS_AUSENTES: "Preencha todos os campos.",
    CODIGO_INVALIDO: "Código incorreto. Confira o código recebido por e-mail e tente de novo.",
    CODIGO_EXPIRADO: "Esse código expirou. Peça um novo código.",
  };
  function mensagemErro(err) {
    return MENSAGENS_ERRO[err.message] || ("Não foi possível continuar (" + err.message + "). Verifique sua internet e tente novamente.");
  }

  function renderLoginForm(container, opts) {
    if (!container) return;
    opts = opts || {};
    let nomeDigitado = "";
    let emailDigitado = "";

    function passo1() {
      container.innerHTML =
        '<p style="' + ESTILO_AJUDA + '">Digite seu nome e e-mail. Vamos enviar um código de 6 dígitos para confirmar que é você — sem precisar de senha.</p>' +
        '<input type="text" id="campoNome" placeholder="Seu nome completo" style="' + ESTILO_INPUT + '" value="' + nomeDigitado.replace(/"/g, "&quot;") + '">' +
        '<input type="email" id="campoEmail" placeholder="Seu e-mail" style="' + ESTILO_INPUT + '" value="' + emailDigitado.replace(/"/g, "&quot;") + '">' +
        '<button type="button" id="btnEnviarCodigo" style="' + ESTILO_BOTAO + '">Enviar código de confirmação</button>' +
        '<div id="erroLogin" style="' + ESTILO_ERRO + '"></div>';

      document.getElementById("btnEnviarCodigo").addEventListener("click", function () {
        const btn = this;
        const nome = document.getElementById("campoNome").value.trim();
        const email = document.getElementById("campoEmail").value.trim();
        const erroEl = document.getElementById("erroLogin");
        erroEl.textContent = "";
        if (!nome) { erroEl.textContent = "Digite seu nome."; return; }
        if (!email || email.indexOf("@") === -1) { erroEl.textContent = "Digite um e-mail válido."; return; }
        btn.disabled = true;
        btn.textContent = "Enviando…";
        solicitarCodigo(nome, email)
          .then(function () {
            nomeDigitado = nome;
            emailDigitado = email;
            passo2();
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = "Enviar código de confirmação";
            erroEl.textContent = mensagemErro(err);
          });
      });
    }

    function passo2() {
      container.innerHTML =
        '<p style="' + ESTILO_AJUDA + '">Enviamos um código de 6 dígitos para <strong>' + emailDigitado + '</strong>. ' +
        'Confira sua caixa de entrada (e o spam, por garantia) e digite o código abaixo.</p>' +
        '<input type="text" inputmode="numeric" maxlength="6" id="campoCodigo" placeholder="Código de 6 dígitos" style="' + ESTILO_INPUT + 'letter-spacing:4px;font-size:1.1rem;text-align:center;">' +
        '<button type="button" id="btnConfirmarCodigo" style="' + ESTILO_BOTAO + '">Confirmar e entrar</button>' +
        '<div id="erroLogin" style="' + ESTILO_ERRO + '"></div>' +
        '<p style="margin-top:14px;font-size:.78rem;">' +
        '<a href="#" id="linkReenviar" style="color:#1f6f63;">Reenviar código</a> · ' +
        '<a href="#" id="linkCorrigir" style="color:#4b5b56;">Corrigir nome/e-mail</a>' +
        "</p>";

      document.getElementById("linkCorrigir").addEventListener("click", function (e) { e.preventDefault(); passo1(); });
      document.getElementById("linkReenviar").addEventListener("click", function (e) {
        e.preventDefault();
        const erroEl = document.getElementById("erroLogin");
        erroEl.style.color = "#1f6f63";
        erroEl.textContent = "Reenviando…";
        solicitarCodigo(nomeDigitado, emailDigitado)
          .then(function () { erroEl.textContent = "Novo código enviado!"; })
          .catch(function (err) { erroEl.style.color = "#a5342a"; erroEl.textContent = mensagemErro(err); });
      });

      document.getElementById("btnConfirmarCodigo").addEventListener("click", function () {
        const btn = this;
        const codigo = document.getElementById("campoCodigo").value.trim();
        const erroEl = document.getElementById("erroLogin");
        erroEl.style.color = "#a5342a";
        erroEl.textContent = "";
        if (!codigo) { erroEl.textContent = "Digite o código recebido por e-mail."; return; }
        btn.disabled = true;
        btn.textContent = "Confirmando…";
        confirmarCodigo(nomeDigitado, emailDigitado, codigo)
          .then(function (aluno) {
            if (opts.onLogin) opts.onLogin(aluno);
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = "Confirmar e entrar";
            erroEl.textContent = mensagemErro(err);
          });
      });
    }

    passo1();
  }

  // ---------------------------------------------------------------------
  // 6) Pequeno helper de UI reaproveitado em várias páginas: a "pílula"
  //    de identidade no canto do cabeçalho ("Olá, Fulano · Sair")
  // ---------------------------------------------------------------------
  function renderAlunoTag(el, opts) {
    if (!el) return;
    const aluno = getAluno();
    opts = opts || {};
    if (!aluno) {
      el.innerHTML = "";
      return;
    }
    const primeiroNome = (aluno.nome || "").split(" ")[0];
    el.innerHTML =
      '<span class="decastro-aluno-nome">Olá, ' +
      (primeiroNome || aluno.email) +
      '</span> <button type="button" class="decastro-aluno-sair" title="Sair">Sair</button>';
    const btn = el.querySelector(".decastro-aluno-sair");
    if (btn) {
      btn.addEventListener("click", function () {
        logout();
        if (opts.onLogout) opts.onLogout();
        else location.reload();
      });
    }
  }

  global.Curso = {
    CONFIG: CONFIG,
    isConfigured: isConfigured,
    LESSONS: LESSONS,
    UNIDADES: UNIDADES,
    MATERIAIS: MATERIAIS,
    aulaFile: aulaFile,
    getAluno: getAluno,
    setAluno: setAluno,
    logout: logout,
    getProgressoLocal: getProgressoLocal,
    marcarAulaConcluidaLocal: marcarAulaConcluidaLocal,
    api: api,
    marcarAulaConcluida: marcarAulaConcluida,
    getStatus: getStatus,
    enviarAvaliacao: enviarAvaliacao,
    emitirCertificado: emitirCertificado,
    solicitarCodigo: solicitarCodigo,
    confirmarCodigo: confirmarCodigo,
    renderAlunoTag: renderAlunoTag,
    renderLoginForm: renderLoginForm,
    whatsappLink: function (mensagem) {
      const msg = mensagem || "Olá! Preciso de orientação sobre a Avaliação Final do curso Gerenciamento Empresarial.";
      return "https://wa.me/" + CONFIG.WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
    },
  };
})(window);
