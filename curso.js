/*!
 * curso.js — camada compartilhada do curso "Gerenciamento Empresarial" (DeCastro)
 * Usado por: todas as aula-NN.html, painel.html e avaliacao-final.html
 *
 * Responsabilidades:
 *  - Configuração central (preencher CONFIG.APPS_SCRIPT_URL e CONFIG.GOOGLE_CLIENT_ID
 *    depois de seguir o guia de configuração).
 *  - Login do aluno com a conta Google (Google Identity Services).
 *  - Chamadas ao backend (Google Apps Script) que guarda o progresso na planilha.
 *  - Cache local (localStorage) para a tela responder rápido mesmo com internet lenta.
 *  - Lista das 23 aulas do curso (temas e unidades), usada no Painel.
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------------
  // 1) CONFIGURAÇÃO — edite estes três valores após seguir o guia de configuração
  // ---------------------------------------------------------------------
  const CONFIG = {
    // Cole aqui a URL do Web App publicado no Apps Script (termina em /exec)
    APPS_SCRIPT_URL: "COLE_AQUI_A_URL_DO_APPS_SCRIPT",
    // Cole aqui o Client ID gerado no Google Cloud (termina em .apps.googleusercontent.com)
    GOOGLE_CLIENT_ID: "COLE_AQUI_O_GOOGLE_CLIENT_ID",
    // Dados de suporte (já preenchidos)
    WHATSAPP_NUMERO: "5598988804678", // (98) 98880-4678
    SUPORTE_EMAIL: "lojasdecastro@gmail.com",
    // Regras da avaliação final
    NOTA_MINIMA_APROVACAO: 7,
    DIAS_ESPERA_NOVA_TENTATIVA: 10,
    TOTAL_AULAS: 23, // aula00 (inaugural) até aula22
  };

  function isConfigured() {
    return (
      CONFIG.APPS_SCRIPT_URL &&
      !CONFIG.APPS_SCRIPT_URL.startsWith("COLE_AQUI") &&
      CONFIG.GOOGLE_CLIENT_ID &&
      !CONFIG.GOOGLE_CLIENT_ID.startsWith("COLE_AQUI")
    );
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
    if (global.google && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
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
  // ---------------------------------------------------------------------
  // A maioria das ações (exceto "login") reenvia o idToken do Google obtido no
  // login, para que o servidor confirme a identidade do aluno em vez de confiar
  // apenas no e-mail informado pelo navegador. O idToken dura cerca de 1 hora;
  // quando expira, pedimos ao aluno para entrar novamente.
  function api(action, payload) {
    if (!isConfigured()) {
      return Promise.reject(new Error("SISTEMA_NAO_CONFIGURADO"));
    }
    const aluno = getAluno();
    const withToken = Object.assign({ action: action }, payload || {});
    if (aluno && aluno.idToken && action !== "login") {
      withToken.idToken = aluno.idToken;
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

  function registrarLogin(googleUser, idToken) {
    return api("login", {
      email: googleUser.email,
      nome: googleUser.nome,
      idToken: idToken,
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
  // 5) LOGIN COM GOOGLE (Google Identity Services)
  // ---------------------------------------------------------------------
  function loadGsiScript() {
    return new Promise(function (resolve, reject) {
      if (global.google && global.google.accounts && global.google.accounts.id) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Falha ao carregar o script de login do Google.")); };
      document.head.appendChild(s);
    });
  }

  // Decodifica a parte "payload" de um JWT (id_token) sem depender de biblioteca externa.
  function decodeJwt(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(json);
  }

  // renderButtonEl: elemento onde o botão "Entrar com o Google" deve aparecer
  // onLogin(aluno): chamado quando o login (e o registro no servidor) terminam com sucesso
  // onError(mensagem): chamado se algo falhar
  function initGoogleSignIn(renderButtonEl, onLogin, onError) {
    if (!CONFIG.GOOGLE_CLIENT_ID || CONFIG.GOOGLE_CLIENT_ID.startsWith("COLE_AQUI")) {
      if (onError) onError("O login com Google ainda não foi configurado neste site (falta o Client ID em curso.js).");
      return;
    }
    loadGsiScript()
      .then(function () {
        google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: function (response) {
            let payload;
            try {
              payload = decodeJwt(response.credential);
            } catch (e) {
              if (onError) onError("Não foi possível ler os dados da conta Google.");
              return;
            }
            const googleUser = { email: payload.email, nome: payload.name, foto: payload.picture };
            const idToken = response.credential;
            registrarLogin(googleUser, idToken)
              .then(function (resposta) {
                const aluno = {
                  email: googleUser.email,
                  nome: googleUser.nome,
                  foto: googleUser.foto,
                  idToken: idToken,
                  loginEm: new Date().toISOString(),
                };
                setAluno(aluno);
                if (onLogin) onLogin(aluno, resposta);
              })
              .catch(function (err) {
                // Mesmo se o servidor não responder, deixamos o aluno entrar
                // (modo offline/cache local), avisando que o progresso pode não
                // sincronizar até a conexão com o servidor voltar.
                const aluno = {
                  email: googleUser.email,
                  nome: googleUser.nome,
                  foto: googleUser.foto,
                  idToken: idToken,
                  loginEm: new Date().toISOString(),
                };
                setAluno(aluno);
                if (onLogin) onLogin(aluno, null);
                console.warn("Login local ok, mas o servidor não respondeu:", err.message);
              });
          },
        });
        if (renderButtonEl) {
          google.accounts.id.renderButton(renderButtonEl, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            locale: "pt-BR",
          });
        }
      })
      .catch(function (err) {
        if (onError) onError(err.message);
      });
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
    initGoogleSignIn: initGoogleSignIn,
    renderAlunoTag: renderAlunoTag,
    whatsappLink: function (mensagem) {
      const msg = mensagem || "Olá! Preciso de orientação sobre a Avaliação Final do curso Gerenciamento Empresarial.";
      return "https://wa.me/" + CONFIG.WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
    },
  };
})(window);
