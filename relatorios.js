const SUPABASE_URL = "https://aifreazongolahcnvhrp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnJlYXpvbmdvbGFoY252aHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDY0NjIsImV4cCI6MjA4MDk4MjQ2Mn0.QbSVAONBBKFQY51RkIy5iOasdUoX0xyrz3iqFpgrGjs";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE_NAME = "escola_equipamentos";
let escolas = [];
let equipmentChart = null;
const schoolSelect = document.getElementById("schoolSelect");
const viewModeLabel = document.getElementById("viewModeLabel");
const totalEquipEl = document.getElementById("totalEquip");
const totalPositivoEl = document.getElementById("totalPositivo");
const totalLenovoEl = document.getElementById("totalLenovo");
const totalChromebookEl = document.getElementById("totalChromebook");
const totalDesktopEl = document.getElementById("totalDesktop");
const totalTabletEl = document.getElementById("totalTablet");
const totalCelularEl = document.getElementById("totalCelular");
const inputPositivo = document.getElementById("inputPositivo");
const inputLenovo = document.getElementById("inputLenovo");
const inputChromebook = document.getElementById("inputChromebook");
const inputDesktop = document.getElementById("inputDesktop");
const inputTablet = document.getElementById("inputTablet");
const inputCelular = document.getElementById("inputCelular");
const editForm = document.getElementById("editForm");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const editMessage = document.getElementById("editMessage");
const editStatusBadge = document.getElementById("editStatusBadge");
const FIELD_MAP = {
  positivo: ["notebook_positivo"],
  lenovo: ["notebook_lenovo"],
  chromebook: ["notebook_chromebook", "chromebook", "notebook_chrome"],
  desktop: ["desktop"],
  tablet: ["tablet"],
  celular: ["celular"],
};

const DB_KEYS = {
  positivo: null,
  lenovo: null,
  chromebook: null,
  desktop: null,
  tablet: null,
  celular: null,
};

function detectarColunasDoBanco() {
  const sample = escolas[0] || {};
  const keys = new Set(Object.keys(sample));

  Object.keys(FIELD_MAP).forEach((logical) => {
    const aliases = FIELD_MAP[logical];
    DB_KEYS[logical] = aliases.find((a) => keys.has(a)) || null;
  });

  if (!DB_KEYS.chromebook) {
    console.warn(
      "Coluna de Chromebook não encontrada. Crie 'notebook_chromebook' no banco e recarregue o schema cache."
    );

    if (inputChromebook) {
      inputChromebook.disabled = true;
      inputChromebook.placeholder = "Coluna não existe no banco";
    }
  }

  console.log("DB_KEYS detectadas:", DB_KEYS);
}

function getField(esc, logical) {
  const key = DB_KEYS[logical];
  if (!key) return 0;
  return esc[key] ?? 0;
}

function setField(esc, logical, value) {
  const key = DB_KEYS[logical];
  if (!key) return;
  esc[key] = value;
}

async function carregarEscolasDoBanco() {
  editMessage.textContent = "Carregando dados das escolas...";
  btnSaveChanges.disabled = true;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("escola_nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar escolas:", error);
    editMessage.textContent = "Erro ao carregar dados. Veja o console.";
    return;
  }

  escolas = data || [];
  console.log("Escolas carregadas:", escolas);

  detectarColunasDoBanco();

  editMessage.textContent = "";
  btnSaveChanges.disabled = false;
}

async function salvarEscolaNoBanco(escola) {
  const id = escola.id;
  const escola_nome = escola.escola_nome;

  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (DB_KEYS.positivo) payload[DB_KEYS.positivo] = getField(escola, "positivo");
  if (DB_KEYS.lenovo) payload[DB_KEYS.lenovo] = getField(escola, "lenovo");
  if (DB_KEYS.chromebook)
    payload[DB_KEYS.chromebook] = getField(escola, "chromebook");
  if (DB_KEYS.desktop) payload[DB_KEYS.desktop] = getField(escola, "desktop");
  if (DB_KEYS.tablet) payload[DB_KEYS.tablet] = getField(escola, "tablet");
  if (DB_KEYS.celular) payload[DB_KEYS.celular] = getField(escola, "celular");

  console.log("Enviando update para o Supabase:", { id, escola_nome, payload });

  const { data, error, status } = await supabase
    .from(TABLE_NAME) // <<< TABELA CORRETA
    .update(payload)
    .eq("id", id)
    .select();

  console.log("Resposta do update:", { status, data, error });

  if (error) {
    alert(
      "Erro ao atualizar no banco:\n\n" +
        (error.message || "") +
        "\n" +
        (error.details || "") +
        "\n" +
        (error.hint || "")
    );
    throw error;
  }
}

function preencherSelectEscolas() {
  schoolSelect.innerHTML = "";

  const optionAll = document.createElement("option");
  optionAll.value = "all";
  optionAll.textContent = "Todas as escolas";
  schoolSelect.appendChild(optionAll);

  escolas.forEach((esc) => {
    const opt = document.createElement("option");
    opt.value = String(esc.id);
    opt.textContent = esc.escola_nome;
    schoolSelect.appendChild(opt);
  });
}

function calcularTotais(idEscola = "all") {
  let positivo = 0;
  let lenovo = 0;
  let chromebook = 0;
  let desktop = 0;
  let tablet = 0;
  let celular = 0;

  if (idEscola === "all") {
    escolas.forEach((esc) => {
      positivo += getField(esc, "positivo");
      lenovo += getField(esc, "lenovo");
      chromebook += getField(esc, "chromebook");
      desktop += getField(esc, "desktop");
      tablet += getField(esc, "tablet");
      celular += getField(esc, "celular");
    });
  } else {
    const escola = escolas.find((e) => String(e.id) === String(idEscola));
    if (escola) {
      positivo = getField(escola, "positivo");
      lenovo = getField(escola, "lenovo");
      chromebook = getField(escola, "chromebook");
      desktop = getField(escola, "desktop");
      tablet = getField(escola, "tablet");
      celular = getField(escola, "celular");
    }
  }

  const total = positivo + lenovo + chromebook + desktop + tablet + celular;

  return {
    total,
    notebook_positivo: positivo,
    notebook_lenovo: lenovo,
    notebook_chromebook: chromebook,
    desktop,
    tablet,
    celular,
  };
}

function atualizarCardsResumo(idEscola) {
  const t = calcularTotais(idEscola);

  totalEquipEl.textContent = t.total;
  totalPositivoEl.textContent = t.notebook_positivo;
  totalLenovoEl.textContent = t.notebook_lenovo;
  totalChromebookEl.textContent = t.notebook_chromebook;
  totalDesktopEl.textContent = t.desktop;
  totalTabletEl.textContent = t.tablet;
  totalCelularEl.textContent = t.celular;
}

function inicializarGrafico() {
  const canvas = document.getElementById("equipmentChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const t = calcularTotais("all");

  equipmentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Notebook Positivo",
        "Notebook Lenovo",
        "Notebook Chromebook",
        "Desktop",
        "Tablet",
        "Celular",
      ],
      datasets: [
        {
          label: "Quantidade de equipamentos",
          data: [
            t.notebook_positivo,
            t.notebook_lenovo,
            t.notebook_chromebook,
            t.desktop,
            t.tablet,
            t.celular,
          ],
          borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(148, 163, 184, 0.25)" },
        },
        x: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: {
          labels: { font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.y} equipamentos`,
          },
        },
      },
    },
  });
}

function atualizarGrafico(idEscola) {
  if (!equipmentChart) return;

  const t = calcularTotais(idEscola);

  equipmentChart.data.datasets[0].data = [
    t.notebook_positivo,
    t.notebook_lenovo,
    t.notebook_chromebook,
    t.desktop,
    t.tablet,
    t.celular,
  ];
  equipmentChart.update();
}

function preencherFormularioEdicao(idEscola) {
  const inputs = [
    inputPositivo,
    inputLenovo,
    inputChromebook,
    inputDesktop,
    inputTablet,
    inputCelular,
  ];

  if (idEscola === "all") {
    inputs.forEach((inp) => {
      inp.value = "";
      inp.disabled = true;
    });

    btnSaveChanges.disabled = true;
    editStatusBadge.textContent = "Visão geral";
    editMessage.textContent = "Selecione uma escola para editar.";
    return;
  }

  const escola = escolas.find((e) => String(e.id) === String(idEscola));
  if (!escola) {
    editMessage.textContent = "Escola não encontrada.";
    return;
  }

  inputPositivo.disabled = !DB_KEYS.positivo;
  inputLenovo.disabled = !DB_KEYS.lenovo;
  inputChromebook.disabled = !DB_KEYS.chromebook;
  inputDesktop.disabled = !DB_KEYS.desktop;
  inputTablet.disabled = !DB_KEYS.tablet;
  inputCelular.disabled = !DB_KEYS.celular;

  btnSaveChanges.disabled = false;

  inputPositivo.value = getField(escola, "positivo");
  inputLenovo.value = getField(escola, "lenovo");
  inputChromebook.value = getField(escola, "chromebook");
  inputDesktop.value = getField(escola, "desktop");
  inputTablet.value = getField(escola, "tablet");
  inputCelular.value = getField(escola, "celular");

  editStatusBadge.textContent = escola.escola_nome;
  editMessage.textContent = DB_KEYS.chromebook
    ? ""
    : "Atenção: coluna de Chromebook não existe no banco.";
}

function atualizarPillViewLabel(idEscola) {
  if (idEscola === "all") {
    viewModeLabel.textContent = "Visão geral – Todas as escolas";
  } else {
    const escola = escolas.find((e) => String(e.id) === String(idEscola));
    viewModeLabel.textContent = escola
      ? `Visão detalhada – ${escola.escola_nome}`
      : "Visão detalhada";
  }
}
schoolSelect.addEventListener("change", () => {
  const idEscola = schoolSelect.value;

  atualizarCardsResumo(idEscola);
  atualizarGrafico(idEscola);
  preencherFormularioEdicao(idEscola);
  atualizarPillViewLabel(idEscola);
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const idEscola = schoolSelect.value;
  if (idEscola === "all") {
    editMessage.textContent =
      "Não é possível editar na visão geral. Selecione uma escola específica.";
    return;
  }

  const escola = escolas.find((e) => String(e.id) === String(idEscola));
  if (!escola) {
    editMessage.textContent = "Escola não encontrada.";
    return;
  }

  const novoPositivo = parseInt(inputPositivo.value || "0", 10);
  const novoLenovo = parseInt(inputLenovo.value || "0", 10);
  const novoChromebook = parseInt(inputChromebook.value || "0", 10);
  const novoDesktop = parseInt(inputDesktop.value || "0", 10);
  const novoTablet = parseInt(inputTablet.value || "0", 10);
  const novoCelular = parseInt(inputCelular.value || "0", 10);

  setField(escola, "positivo", Math.max(0, novoPositivo));
  setField(escola, "lenovo", Math.max(0, novoLenovo));
  setField(escola, "chromebook", Math.max(0, novoChromebook));
  setField(escola, "desktop", Math.max(0, novoDesktop));
  setField(escola, "tablet", Math.max(0, novoTablet));
  setField(escola, "celular", Math.max(0, novoCelular));

  editMessage.textContent = "Salvando alterações...";
  btnSaveChanges.disabled = true;

  try {
    await salvarEscolaNoBanco(escola);

    atualizarCardsResumo(idEscola);
    atualizarGrafico(idEscola);

    editMessage.textContent = "Alterações salvas ✅";
  } catch (err) {
    console.error("Erro ao atualizar escola:", err);
    editMessage.textContent = "Erro ao salvar. Veja o console.";
  } finally {
    btnSaveChanges.disabled = false;
    setTimeout(() => {
      if (editMessage.textContent.startsWith("Alterações salvas")) {
        editMessage.textContent = "";
      }
    }, 2500);
  }
});
async function inicializarRelatorios() {
  if (!document.getElementById("equipmentChart")) return;

  await carregarEscolasDoBanco();
  preencherSelectEscolas();
  atualizarCardsResumo("all");
  inicializarGrafico();
  preencherFormularioEdicao("all");
  atualizarPillViewLabel("all");
}

document.addEventListener("DOMContentLoaded", inicializarRelatorios);
