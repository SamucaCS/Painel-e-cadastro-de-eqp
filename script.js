const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

const urlParams = new URLSearchParams(window.location.search);
const EDIT_ID = urlParams.get("id") ? Number(urlParams.get("id")) : null;

function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return m;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const successAlert = document.getElementById("successAlert");
  const formCadastro = document.getElementById("formCadastro");
  const tabelaContainer = document.getElementById("tabela-container");
  const listaEquipamentos = document.getElementById("lista-equipamentos");
  const btnAdicionarItem = document.getElementById("btnAdicionarItem");
  const templateEquipamento = document.getElementById("template-equipamento");

  function mostrarSucesso(msg) {
    if (!successAlert) return;
    successAlert.textContent = msg;
    successAlert.style.display = "flex";
    successAlert.style.opacity = "1";
    setTimeout(() => {
      successAlert.style.opacity = "0";
      setTimeout(() => {
        successAlert.style.display = "none";
      }, 400);
    }, 3000);
  }

  function adicionarItemNaTela(dados = null) {
    const clone = templateEquipamento.content.cloneNode(true);
    const itemDiv = clone.querySelector(".equipamento-item");
    const radios = itemDiv.querySelectorAll(".radio-resolvido");
    const campoMotivo = itemDiv.querySelector(".campo-motivo");
    const inputMotivo = itemDiv.querySelector(".input-motivo");
    const uniqueName = "resolvido_" + Date.now() + Math.random();

    radios.forEach((radio) => {
      radio.name = uniqueName; 
      radio.addEventListener("change", () => {
        if (radio.value === "nao") campoMotivo.style.display = "block";
        else {
          campoMotivo.style.display = "none";
          inputMotivo.value = "";
        }
      });
    });

    const btnRemover = itemDiv.querySelector(".btn-remover");
    btnRemover.addEventListener("click", () => {
      if (document.querySelectorAll(".equipamento-item").length > 1) {
        itemDiv.remove();
      } else {
        alert("Você precisa manter pelo menos um equipamento.");
      }
    });

    if (dados) {
      itemDiv.querySelector(".input-tipo").value = dados.tipo_equipamento || "";
      itemDiv.querySelector(".input-serie").value = dados.numero_serie || "";
      itemDiv.querySelector(".input-problema").value =
        dados.descricao_problema || "";

      const radioSim = itemDiv.querySelector(`input[value="sim"]`);
      const radioNao = itemDiv.querySelector(`input[value="nao"]`);

      if (dados.resolvido_boolean) {
        radioSim.checked = true;
        campoMotivo.style.display = "none";
      } else {
        radioNao.checked = true;
        campoMotivo.style.display = "block";
        itemDiv.querySelector(".input-motivo").value =
          dados.motivo_nao_resolvido || "";
      }
    }

    listaEquipamentos.appendChild(itemDiv);
  }

  if (btnAdicionarItem) {
    btnAdicionarItem.addEventListener("click", () => adicionarItemNaTela());
  }

  async function carregarRegistroParaEdicao(id) {
    if (!formCadastro) return;
    try {
      const { data, error } = await supabaseClient
        .from("cadastros_equipamentos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar:", error);
        return;
      }

      document.getElementById("escola").value = data.escola_nome || "";
      if (data.data_ocorrencia) {
        document.getElementById("data_ocorrencia").value = new Date(
          data.data_ocorrencia,
        )
          .toISOString()
          .slice(0, 10);
      }

      listaEquipamentos.innerHTML = "";
      adicionarItemNaTela(data);

    
      btnAdicionarItem.style.display = "none";

      const botao = formCadastro.querySelector("button[type='submit']");
      if (botao) botao.textContent = "Salvar alterações";
    } catch (err) {
      console.error("Erro inesperado:", err);
    }
  }

  if (formCadastro && !EDIT_ID) {
    adicionarItemNaTela(); 
  }

  async function handleSubmitCadastro(event) {
    event.preventDefault();

    const escola = document.getElementById("escola").value.trim();
    const dataOcorrencia = document.getElementById("data_ocorrencia").value;

    if (!escola || !dataOcorrencia) {
      alert("Preencha a Escola e a Data.");
      return;
    }

    const itensElements = document.querySelectorAll(".equipamento-item");
    const payloadBatch = [];

    for (let item of itensElements) {
      const tipo = item.querySelector(".input-tipo").value;
      const serie = item.querySelector(".input-serie").value;
      const problema = item.querySelector(".input-problema").value;
      const motivo = item.querySelector(".input-motivo").value;
      const resolvidoBool =
        item.querySelector('input[type="radio"]:checked')?.value === "sim";

      if (!tipo) {
        alert("Por favor, selecione o Tipo de Equipamento em todos os itens.");
        return;
      }

      payloadBatch.push({
        escola_nome: escola,
        data_ocorrencia: dataOcorrencia,
        tipo_equipamento: tipo,
        numero_serie: serie || null,
        descricao_problema: problema || null,
        resolvido_boolean: resolvidoBool,
        motivo_nao_resolvido: resolvidoBool ? null : motivo || null,
      });
    }

    try {
      if (EDIT_ID) {

        const singlePayload = payloadBatch[0];
        const { error } = await supabaseClient
          .from("cadastros_equipamentos")
          .update(singlePayload)
          .eq("id", EDIT_ID);
        if (error) throw error;
        mostrarSucesso("Registro atualizado! ✅");
        setTimeout(() => {
          window.location.href = "lista.html";
        }, 800);
      } else {
        const { error } = await supabaseClient
          .from("cadastros_equipamentos")
          .insert(payloadBatch);
        if (error) throw error;

        mostrarSucesso(`${payloadBatch.length} equipamento(s) salvo(s)! ✅`);
        listaEquipamentos.innerHTML = "";
        adicionarItemNaTela();
      }
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  }

  if (formCadastro) {
    formCadastro.addEventListener("submit", handleSubmitCadastro);
    if (EDIT_ID) carregarRegistroParaEdicao(EDIT_ID);
  }

  async function carregarTabela() {
    if (!tabelaContainer) return;
    tabelaContainer.innerHTML =
      '<div class="empty-state">Carregando registros...</div>';

    const { data, error } = await supabaseClient
      .from("cadastros_equipamentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      tabelaContainer.innerHTML =
        '<div class="empty-state">Erro: ' +
        escapeHTML(error.message) +
        "</div>";
      return;
    }

    if (!data || data.length === 0) {
      tabelaContainer.innerHTML =
        '<div class="empty-state">Nenhum registro encontrado.</div>';
      return;
    }

    const linhas = data
      .map((item) => {
        const dataBr = item.data_ocorrencia
          ? new Date(item.data_ocorrencia).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })
          : "-";
        return `
                <tr>
                    <td>${dataBr}</td>
                    <td>${escapeHTML(item.escola_nome)}</td>
                    <td>${escapeHTML(item.numero_serie || "")}</td>
                    <td>${escapeHTML(item.tipo_equipamento)}</td>
                    <td>${escapeHTML(item.descricao_problema || "")}</td>
                    <td class="${item.resolvido_boolean ? "table-status-sim" : "table-status-nao"}">${item.resolvido_boolean ? "Resolvido" : "Não resolvido"}</td>
                    <td>${escapeHTML(item.motivo_nao_resolvido || "")}</td>
                    <td class="table-actions">
                        <button class="btn-table btn-table--edit" data-id="${item.id}">Editar</button>
                        <button class="btn-table btn-table--danger" data-id="${item.id}">Excluir</button>
                    </td>
                </tr>`;
      })
      .join("");

    tabelaContainer.innerHTML = `<table class="table"><thead><tr><th>Data</th><th>Escola</th><th>Patrimônio</th><th>Equip.</th><th>Descrição</th><th>Status</th><th>Motivo</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table>`;
    inicializarAcoesTabela();
  }

  function inicializarAcoesTabela() {
    document.querySelectorAll(".btn-table--edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = `cadastro.html?id=${btn.dataset.id}`;
      });
    });

    document.querySelectorAll(".btn-table--danger").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Excluir este registro?")) return;
        const { error } = await supabaseClient
          .from("cadastros_equipamentos")
          .delete()
          .eq("id", btn.dataset.id);
        if (error) alert("Erro: " + error.message);
        else carregarTabela();
      });
    });
  }

  if (tabelaContainer) carregarTabela();

  const btnLimparTudo = document.getElementById("btnLimparTudo");
  if (btnLimparTudo) {
    btnLimparTudo.addEventListener("click", async () => {
      if (confirm("ATENÇÃO: Deseja apagar TODOS os registros?")) {
        if (confirm("Tem certeza absoluta?")) {
          const { error } = await supabaseClient
            .from("cadastros_equipamentos")
            .delete()
            .gt("id", 0);
          if (!error) {
            alert("Lista limpa!");
            carregarTabela();
          }
        }
      }
    });
  }
});
