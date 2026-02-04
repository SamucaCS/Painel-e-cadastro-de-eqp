const SUPABASE_URL = "https://aifreazongolahcnvhrp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnJlYXpvbmdvbGFoY252aHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDY0NjIsImV4cCI6MjA4MDk4MjQ2Mn0.QbSVAONBBKFQY51RkIy5iOasdUoX0xyrz3iqFpgrGjs";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
const TABLE_NAME = "escola_equipamentos";

let escolas = [];
let equipmentChart = null;
const schoolSelect = document.getElementById("schoolSelect");
const viewModeLabel = document.getElementById("viewModeLabel");
const editInfoBox = document.getElementById("editInfoBox");
const totalEquipEl = document.getElementById("totalEquip");
const labels = {
  positivo: document.getElementById("totalPositivo"),
  lenovo: document.getElementById("totalLenovo"),
  chromebook: document.getElementById("totalChromebook"),
  multilaser: document.getElementById("totalMultilaser"),
  desktop: document.getElementById("totalDesktop"),
  tablet: document.getElementById("totalTablet"),
  celular: document.getElementById("totalCelular"),
};

const inputs = {
  positivo: document.getElementById("inputPositivo"),
  lenovo: document.getElementById("inputLenovo"),
  chromebook: document.getElementById("inputChromebook"),
  multilaser: document.getElementById("inputMultilaser"),
  desktop: document.getElementById("inputDesktop"),
  tablet: document.getElementById("inputTablet"),
  celular: document.getElementById("inputCelular"),
};

const editForm = document.getElementById("editForm");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const editMessage = document.getElementById("editMessage");
const FIELD_MAP = {
  positivo: ["notebook_positivo"],
  lenovo: ["notebook_lenovo"],
  chromebook: ["notebook_chromebook", "chromebook", "notebook_chrome"],
  multilaser: ["notebook_multilaser"],
  desktop: ["desktop"],
  tablet: ["tablet"],
  celular: ["celular"],
};

const DB_KEYS = {
  positivo: null,
  lenovo: null,
  chromebook: null,
  multilaser: null,
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
}

function getField(esc, logical) {
  const key = DB_KEYS[logical];
  return key && esc[key] ? esc[key] : 0;
}

function setField(esc, logical, value) {
  const key = DB_KEYS[logical];
  if (key) esc[key] = value;
}

async function carregarEscolasDoBanco() {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("*")
    .order("escola_nome", { ascending: true });
  if (error) {
    console.error("Erro:", error);
    return;
  }
  escolas = data || [];
  detectarColunasDoBanco();
}

async function salvarEscolaNoBanco(escola) {
  const id = escola.id;
  const payload = { updated_at: new Date().toISOString() };
  Object.keys(DB_KEYS).forEach((key) => {
    if (DB_KEYS[key]) payload[DB_KEYS[key]] = getField(escola, key);
  });
  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", id);
  if (error) throw error;
}

function preencherSelectEscolas() {
  schoolSelect.innerHTML = '<option value="all">Todas as escolas</option>';
  escolas.forEach((esc) => {
    const opt = document.createElement("option");
    opt.value = String(esc.id);
    opt.textContent = esc.escola_nome;
    schoolSelect.appendChild(opt);
  });
}

function calcularTotais(idEscola = "all") {
  const totais = {
    positivo: 0,
    lenovo: 0,
    chromebook: 0,
    multilaser: 0,
    desktop: 0,
    tablet: 0,
    celular: 0,
    total: 0,
  };

  const lista =
    idEscola === "all"
      ? escolas
      : escolas.filter((e) => String(e.id) === String(idEscola));

  lista.forEach((esc) => {
    totais.positivo += getField(esc, "positivo");
    totais.lenovo += getField(esc, "lenovo");
    totais.chromebook += getField(esc, "chromebook");
    totais.multilaser += getField(esc, "multilaser");
    totais.desktop += getField(esc, "desktop");
    totais.tablet += getField(esc, "tablet");
    totais.celular += getField(esc, "celular");
  });

  totais.total =
    totais.positivo +
    totais.lenovo +
    totais.chromebook +
    totais.multilaser +
    totais.desktop +
    totais.tablet +
    totais.celular;
  return totais;
}

function atualizarInterface(idEscola) {
  const t = calcularTotais(idEscola);
  totalEquipEl.textContent = t.total;
  labels.positivo.textContent = t.positivo;
  labels.lenovo.textContent = t.lenovo;
  labels.chromebook.textContent = t.chromebook;
  labels.multilaser.textContent = t.multilaser;
  labels.desktop.textContent = t.desktop;
  labels.tablet.textContent = t.tablet;
  labels.celular.textContent = t.celular;
  inputs.positivo.value = t.positivo;
  inputs.lenovo.value = t.lenovo;
  inputs.chromebook.value = t.chromebook;
  inputs.multilaser.value = t.multilaser;
  inputs.desktop.value = t.desktop;
  inputs.tablet.value = t.tablet;
  inputs.celular.value = t.celular;

  if (idEscola === "all") {
    document.body.classList.remove("editing-mode");
    viewModeLabel.textContent = "Visão Geral";
    editInfoBox.textContent =
      "Selecione uma escola acima para habilitar a edição.";
    btnSaveChanges.disabled = true;
  } else {
    document.body.classList.add("editing-mode");
    const escolaNome =
      escolas.find((e) => String(e.id) === idEscola)?.escola_nome || "Escola";
    viewModeLabel.textContent = "Modo Edição: " + escolaNome;
    editInfoBox.textContent = `Editando inventário de: ${escolaNome}`;
    btnSaveChanges.disabled = false;
  }

  atualizarGrafico(t);
}

function inicializarGrafico() {
  const ctx = document.getElementById("equipmentChart").getContext("2d");
  equipmentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Positivo",
        "Lenovo",
        "Chrome",
        "Multi",
        "Desk",
        "Tablet",
        "Celular",
      ],
      datasets: [
        {
          label: "Qtd",
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "#2563eb",
          borderRadius: 6,
          barThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function atualizarGrafico(t) {
  if (!equipmentChart) return;
  equipmentChart.data.datasets[0].data = [
    t.positivo,
    t.lenovo,
    t.chromebook,
    t.multilaser,
    t.desktop,
    t.tablet,
    t.celular,
  ];
  equipmentChart.update();
}

schoolSelect.addEventListener("change", () =>
  atualizarInterface(schoolSelect.value),
);

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idEscola = schoolSelect.value;
  if (idEscola === "all") return;

  const escola = escolas.find((e) => String(e.id) === String(idEscola));
  if (!escola) return;


  setField(escola, "positivo", parseInt(inputs.positivo.value) || 0);
  setField(escola, "lenovo", parseInt(inputs.lenovo.value) || 0);
  setField(escola, "chromebook", parseInt(inputs.chromebook.value) || 0);
  setField(escola, "multilaser", parseInt(inputs.multilaser.value) || 0);
  setField(escola, "desktop", parseInt(inputs.desktop.value) || 0);
  setField(escola, "tablet", parseInt(inputs.tablet.value) || 0);
  setField(escola, "celular", parseInt(inputs.celular.value) || 0);

  btnSaveChanges.innerHTML =
    '<i class="ph ph-spinner ph-spin"></i> Salvando...';

  try {
    await salvarEscolaNoBanco(escola);
    atualizarInterface(idEscola); 
    editMessage.textContent = "Salvo com sucesso!";
    setTimeout(() => (editMessage.textContent = ""), 3000);
  } catch (err) {
    alert("Erro ao salvar.");
  } finally {
    btnSaveChanges.innerHTML =
      '<i class="ph-bold ph-floppy-disk"></i> Salvar Alterações';
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  inicializarGrafico();
  await carregarEscolasDoBanco();
  preencherSelectEscolas();
  atualizarInterface("all");
});
