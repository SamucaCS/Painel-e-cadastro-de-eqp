
const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let escolas = [];

const schoolSelect = document.getElementById("schoolSelect");
const viewModeLabel = document.getElementById("viewModeLabel");
const totalEquipEl = document.getElementById("totalEquip");
const totalPositivoEl = document.getElementById("totalPositivo");
const totalLenovoEl = document.getElementById("totalLenovo");
const totalDesktopEl = document.getElementById("totalDesktop");
const totalTabletEl = document.getElementById("totalTablet");
const totalCelularEl = document.getElementById("totalCelular");
const inputPositivo = document.getElementById("inputPositivo");
const inputLenovo = document.getElementById("inputLenovo");
const inputDesktop = document.getElementById("inputDesktop");
const inputTablet = document.getElementById("inputTablet");
const inputCelular = document.getElementById("inputCelular");
const editForm = document.getElementById("editForm");
const btnSaveChanges = document.getElementById("btnSaveChanges");
const editMessage = document.getElementById("editMessage");
const editStatusBadge = document.getElementById("editStatusBadge");


let equipmentChart = null;

async function carregarEscolasDoBanco() {
    editMessage.textContent = "Carregando dados das escolas...";
    btnSaveChanges.disabled = true;

    const { data, error } = await supabase
        .from("equipamentos_escola")
        .select("*")
        .order("escola_nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar escolas:", error);
        editMessage.textContent = "Erro ao carregar dados. Veja o console.";
        return;
    }

    escolas = data || [];
    editMessage.textContent = "";
    btnSaveChanges.disabled = false;
}


async function salvarEscolaNoBanco(escola) {
    const {
        id,
        escola_nome,
        notebook_positivo,
        notebook_lenovo,
        desktop,
        tablet,
        celular
    } = escola;

    const { error } = await supabase
        .from("equipamentos_escola")
        .update({
            escola_nome,
            notebook_positivo,
            notebook_lenovo,
            desktop,
            tablet,
            celular,
            updated_at: new Date().toISOString()
        })
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar escola:", error);
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
    let notebook_positivo = 0;
    let notebook_lenovo = 0;
    let desktop = 0;
    let tablet = 0;
    let celular = 0;

    if (idEscola === "all") {
        escolas.forEach((esc) => {
            notebook_positivo += esc.notebook_positivo || 0;
            notebook_lenovo += esc.notebook_lenovo || 0;
            desktop += esc.desktop || 0;
            tablet += esc.tablet || 0;
            celular += esc.celular || 0;
        });
    } else {
        const escola = escolas.find((e) => String(e.id) === String(idEscola));
        if (escola) {
            notebook_positivo = escola.notebook_positivo || 0;
            notebook_lenovo = escola.notebook_lenovo || 0;
            desktop = escola.desktop || 0;
            tablet = escola.tablet || 0;
            celular = escola.celular || 0;
        }
    }

    const total = notebook_positivo + notebook_lenovo + desktop + tablet + celular;

    return {
        total,
        notebook_positivo,
        notebook_lenovo,
        desktop,
        tablet,
        celular
    };
}

function atualizarCardsResumo(idEscola) {
    const t = calcularTotais(idEscola);

    totalEquipEl.textContent = t.total;
    totalPositivoEl.textContent = t.notebook_positivo;
    totalLenovoEl.textContent = t.notebook_lenovo;
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
            labels: ["Notebook Positivo", "Notebook Lenovo", "Desktop", "Tablet", "Celular"],
            datasets: [
                {
                    label: "Quantidade de equipamentos",
                    data: [
                        t.notebook_positivo,
                        t.notebook_lenovo,
                        t.desktop,
                        t.tablet,
                        t.celular
                    ],
                    borderWidth: 1,
                    borderRadius: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "rgba(148, 163, 184, 0.25)" }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    labels: { font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.parsed.y} equipamentos`
                    }
                }
            }
        }
    });
}

function atualizarGrafico(idEscola) {
    if (!equipmentChart) return;

    const t = calcularTotais(idEscola);

    equipmentChart.data.datasets[0].data = [
        t.notebook_positivo,
        t.notebook_lenovo,
        t.desktop,
        t.tablet,
        t.celular
    ];
    equipmentChart.update();
}

function preencherFormularioEdicao(idEscola) {
    if (idEscola === "all") {
        inputPositivo.value = "";
        inputLenovo.value = "";
        inputDesktop.value = "";
        inputTablet.value = "";
        inputCelular.value = "";

        [inputPositivo, inputLenovo, inputDesktop, inputTablet, inputCelular].forEach(
            (inp) => (inp.disabled = true)
        );
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

    inputPositivo.disabled = false;
    inputLenovo.disabled = false;
    inputDesktop.disabled = false;
    inputTablet.disabled = false;
    inputCelular.disabled = false;
    btnSaveChanges.disabled = false;

    inputPositivo.value = escola.notebook_positivo ?? 0;
    inputLenovo.value = escola.notebook_lenovo ?? 0;
    inputDesktop.value = escola.desktop ?? 0;
    inputTablet.value = escola.tablet ?? 0;
    inputCelular.value = escola.celular ?? 0;

    editStatusBadge.textContent = escola.escola_nome;
    editMessage.textContent = "";
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
    const novoDesktop = parseInt(inputDesktop.value || "0", 10);
    const novoTablet = parseInt(inputTablet.value || "0", 10);
    const novoCelular = parseInt(inputCelular.value || "0", 10);

    escola.notebook_positivo = Math.max(0, novoPositivo);
    escola.notebook_lenovo = Math.max(0, novoLenovo);
    escola.desktop = Math.max(0, novoDesktop);
    escola.tablet = Math.max(0, novoTablet);
    escola.celular = Math.max(0, novoCelular);

    editMessage.textContent = "Salvando alterações...";
    btnSaveChanges.disabled = true;

    try {
        await salvarEscolaNoBanco(escola);

        atualizarCardsResumo(idEscola);
        atualizarGrafico(idEscola);

        editMessage.textContent = "Alterações salvas ✅";
    } catch (err) {
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
