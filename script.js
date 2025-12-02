const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    const radiosResolvido = document.querySelectorAll('input[name="resolvido"]');
    const campoMotivo = document.getElementById("campoMotivo");
    const inputMotivo = document.getElementById("motivo_nao_resolvido");
    const tabelaContainer = document.getElementById("tabela-container");

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
    function atualizarVisibilidadeMotivo() {
        if (!campoMotivo || !radiosResolvido.length) return;
        const selecionado = document.querySelector(
            'input[name="resolvido"]:checked'
        );
        if (!selecionado) return;

        if (selecionado.value === "nao") {
            campoMotivo.style.display = "block";
        } else {
            campoMotivo.style.display = "none";
            if (inputMotivo) inputMotivo.value = "";
        }
    }

    if (radiosResolvido.length && campoMotivo) {
        radiosResolvido.forEach((radio) => {
            radio.addEventListener("change", atualizarVisibilidadeMotivo);
        });
        atualizarVisibilidadeMotivo();
    }

    async function carregarRegistroParaEdicao(id) {
        if (!formCadastro) return;

        try {
            const { data, error } = await supabase
                .from("cadastros_equipamentos")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Erro ao carregar registro para edição:", error);
                alert("Erro ao carregar registro para edição.");
                return;
            }

            if (!data) return;

            const campoEscola = document.getElementById("escola");
            const campoTipo = document.getElementById("tipo_equipamento");
            const campoData = document.getElementById("data_ocorrencia");
            const campoDesc = document.getElementById("descricao_problema");
            const campoNumeroSerie = document.getElementById("numero_serie");

            if (campoEscola) campoEscola.value = data.escola_nome || "";
            if (campoTipo) campoTipo.value = data.tipo_equipamento || "";

            if (campoData && data.data_ocorrencia) {
                const dt = new Date(data.data_ocorrencia);
                campoData.value = dt.toISOString().slice(0, 10); 
            }

            if (campoDesc) campoDesc.value = data.descricao_problema || "";
            if (campoNumeroSerie) campoNumeroSerie.value = data.numero_serie || "";

            const valorResolvido = data.resolvido_boolean ? "sim" : "nao";
            const radio = document.querySelector(
                `input[name="resolvido"][value="${valorResolvido}"]`
            );
            if (radio) radio.checked = true;

            if (inputMotivo) {
                inputMotivo.value = data.motivo_nao_resolvido || "";
            }

            atualizarVisibilidadeMotivo();

            const botao = formCadastro.querySelector("button[type='submit']");
            if (botao) botao.textContent = "Salvar alterações";
        } catch (err) {
            console.error("Erro inesperado ao preencher edição:", err);
            alert("Erro inesperado ao preencher edição.");
        }
    }
    async function handleSubmitCadastro(event) {
        event.preventDefault();

        const escola = document.getElementById("escola").value.trim();
        const tipo = document.getElementById("tipo_equipamento").value.trim();
        const data = document.getElementById("data_ocorrencia").value;
        const descricao = document
            .getElementById("descricao_problema")
            .value.trim();
        const numeroSerie = document
            .getElementById("numero_serie")
            .value.trim();

        const motivo = inputMotivo ? inputMotivo.value.trim() : "";

        const resolvidoSelecionado = document.querySelector(
            'input[name="resolvido"]:checked'
        );
        const resolvidoValue = resolvidoSelecionado
            ? resolvidoSelecionado.value
            : "sim";
        const resolvido_boolean = resolvidoValue === "sim";

        if (!escola || !tipo) {
            alert("Selecione a escola e o tipo de equipamento.");
            return;
        }

        const payload = {
            escola_nome: escola,
            tipo_equipamento: tipo,
            data_ocorrencia: data || null,
            descricao_problema: descricao || null,
            resolvido_boolean,
            motivo_nao_resolvido: resolvido_boolean
                ? null
                : motivo !== ""
                    ? motivo
                    : null,
            numero_serie: numeroSerie || null,
        };

        try {
            if (EDIT_ID) {
               
                const { error } = await supabase
                    .from("cadastros_equipamentos")
                    .update(payload)
                    .eq("id", EDIT_ID);

                if (error) {
                    console.error("Erro ao atualizar registro:", error);
                    alert("Erro ao atualizar registro: " + error.message);
                    return;
                }

                mostrarSucesso("Registro atualizado com sucesso ✅");

                setTimeout(() => {
                    window.location.href = "lista.html";
                }, 800);
            } else {
           
                const { error } = await supabase
                    .from("cadastros_equipamentos")
                    .insert(payload);

                if (error) {
                    console.error("Erro ao salvar no Supabase:", error);
                    alert("Erro ao salvar no Supabase: " + error.message);
                    return;
                }

                formCadastro.reset();
                atualizarVisibilidadeMotivo();
                mostrarSucesso("Registro salvo com sucesso ✅");
            }
        } catch (err) {
            console.error("Erro inesperado ao salvar:", err);
            alert("Erro inesperado ao salvar registro.");
        }
    }

    if (formCadastro) {
        formCadastro.addEventListener("submit", handleSubmitCadastro);

        if (EDIT_ID) {
            carregarRegistroParaEdicao(EDIT_ID);
        }
    }
    async function carregarTabela() {
        if (!tabelaContainer) return;

        tabelaContainer.innerHTML =
            '<div class="empty-state">Carregando registros...</div>';

        const { data, error } = await supabase
            .from("cadastros_equipamentos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar registros:", error);
            tabelaContainer.innerHTML =
                '<div class="empty-state">Erro ao carregar registros: ' +
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

                const statusClasse = item.resolvido_boolean
                    ? "table-status-sim"
                    : "table-status-nao";
                const statusTexto = item.resolvido_boolean
                    ? "Resolvido"
                    : "Não resolvido";

                return `
          <tr data-id="${item.id}">
            <td data-label="Data">${dataBr}</td>
            <td data-label="Escola">${escapeHTML(item.escola_nome)}</td>
            <td data-label="Patrimônio">${escapeHTML(item.numero_serie || "")}</td>
            <td data-label="Equip.">${escapeHTML(item.tipo_equipamento)}</td>
            <td data-label="Descrição do problema">${escapeHTML(item.descricao_problema || "")}</td>
            <td data-label="Status" class="${statusClasse}">${statusTexto}</td>
            <td data-label="Motivo">${escapeHTML(item.motivo_nao_resolvido || "")}</td>
            <td data-label="Ações" class="table-actions">
              <button class="btn-table btn-table--edit" data-id="${item.id}">Editar</button>
              <button class="btn-table btn-table--danger" data-id="${item.id}">Excluir</button>
            </td>
          </tr>
        `;
            })
            .join("");

        tabelaContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Escola</th>
            <th>Patrimônio</th>
            <th>Equip.</th>
            <th>Descrição do problema</th>
            <th>Status</th>
            <th>Motivo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    `;

        inicializarAcoesTabela();
    }
    function inicializarAcoesTabela() {
        const botoesEditar = document.querySelectorAll(".btn-table--edit");
        const botoesExcluir = document.querySelectorAll(".btn-table--danger");

        botoesEditar.forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.getAttribute("data-id"));
                if (!id) return;
                window.location.href = `cadastro.html?id=${id}`;
            });
        });

        botoesExcluir.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.getAttribute("data-id"));
                if (!id) return;

                const ok = confirm("Tem certeza que deseja excluir este registro?");
                if (!ok) return;

                const { error } = await supabase
                    .from("cadastros_equipamentos")
                    .delete()
                    .eq("id", id);

                if (error) {
                    console.error("Erro ao excluir registro:", error);
                    alert("Erro ao excluir registro: " + error.message);
                    return;
                }

                carregarTabela();
            });
        });
    }

    if (tabelaContainer) {
        carregarTabela();
    }
    const navLinks = document.querySelectorAll(".nav-links a");
    if (navLinks.length) {
        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            if (href && window.location.pathname.endsWith(href)) {
                link.classList.add("active");
            }
        });
    }
});
