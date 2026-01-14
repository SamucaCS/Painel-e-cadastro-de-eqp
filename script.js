const SUPABASE_URL = "https://thcxlfpxjokvegkzcjuh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoY3hsZnB4am9rdmVna3pjanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjc0OTQsImV4cCI6MjA3OTcwMzQ5NH0.rv_qmpcdx-OU01bz1NPw3pGRTntAh389XwSZ3G59xRM";

// Renomeado para supabaseClient para evitar conflito com a biblioteca global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const urlParams = new URLSearchParams(window.location.search);
const EDIT_ID = urlParams.get("id") ? Number(urlParams.get("id")) : null;

function escapeHTML(str = "") {
    return String(str).replace(/[&<>"']/g, (m) => {
        switch (m) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#39;";
            default: return m;
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
            setTimeout(() => { successAlert.style.display = "none"; }, 400);
        }, 3000);
    }

    function atualizarVisibilidadeMotivo() {
        if (!campoMotivo || !radiosResolvido.length) return;
        const selecionado = document.querySelector('input[name="resolvido"]:checked');
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
            // Alterado para supabaseClient
            const { data, error } = await supabaseClient
                .from("cadastros_equipamentos")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Erro ao carregar registro:", error);
                return;
            }
            if (!data) return;

            document.getElementById("escola").value = data.escola_nome || "";
            document.getElementById("tipo_equipamento").value = data.tipo_equipamento || "";
            if (data.data_ocorrencia) {
                document.getElementById("data_ocorrencia").value = new Date(data.data_ocorrencia).toISOString().slice(0, 10);
            }
            document.getElementById("descricao_problema").value = data.descricao_problema || "";
            document.getElementById("numero_serie").value = data.numero_serie || "";

            const radio = document.querySelector(`input[name="resolvido"][value="${data.resolvido_boolean ? "sim" : "nao"}"]`);
            if (radio) radio.checked = true;
            if (inputMotivo) inputMotivo.value = data.motivo_nao_resolvido || "";

            atualizarVisibilidadeMotivo();
            const botao = formCadastro.querySelector("button[type='submit']");
            if (botao) botao.textContent = "Salvar alterações";
        } catch (err) {
            console.error("Erro inesperado:", err);
        }
    }

    async function handleSubmitCadastro(event) {
        event.preventDefault();
        const escola = document.getElementById("escola").value.trim();
        const tipo = document.getElementById("tipo_equipamento").value.trim();
        const data = document.getElementById("data_ocorrencia").value;
        const descricao = document.getElementById("descricao_problema").value.trim();
        const numeroSerie = document.getElementById("numero_serie").value.trim();
        const motivo = inputMotivo ? inputMotivo.value.trim() : "";
        const resolvido_boolean = document.querySelector('input[name="resolvido"]:checked')?.value === "sim";

        if (!escola || !tipo) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        const payload = {
            escola_nome: escola,
            tipo_equipamento: tipo,
            data_ocorrencia: data || null,
            descricao_problema: descricao || null,
            resolvido_boolean,
            motivo_nao_resolvido: resolvido_boolean ? null : (motivo || null),
            numero_serie: numeroSerie || null,
        };

        try {
            if (EDIT_ID) {
                // Alterado para supabaseClient
                const { error } = await supabaseClient.from("cadastros_equipamentos").update(payload).eq("id", EDIT_ID);
                if (error) throw error;
                mostrarSucesso("Registro atualizado com sucesso ✅");
                setTimeout(() => { window.location.href = "lista.html"; }, 800);
            } else {
                // Alterado para supabaseClient
                const { error } = await supabaseClient.from("cadastros_equipamentos").insert(payload);
                if (error) throw error;
                formCadastro.reset();
                atualizarVisibilidadeMotivo();
                mostrarSucesso("Registro salvo com sucesso ✅");
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
        tabelaContainer.innerHTML = '<div class="empty-state">Carregando registros...</div>';

        // Alterado para supabaseClient
        const { data, error } = await supabaseClient
            .from("cadastros_equipamentos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            tabelaContainer.innerHTML = '<div class="empty-state">Erro: ' + escapeHTML(error.message) + '</div>';
            return;
        }

        if (!data || data.length === 0) {
            tabelaContainer.innerHTML = '<div class="empty-state">Nenhum registro encontrado.</div>';
            return;
        }

        const linhas = data.map((item) => {
            const dataBr = item.data_ocorrencia ? new Date(item.data_ocorrencia).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-";
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
        }).join("");

        tabelaContainer.innerHTML = `<table class="table"><thead><tr><th>Data</th><th>Escola</th><th>Patrimônio</th><th>Equip.</th><th>Descrição</th><th>Status</th><th>Motivo</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table>`;
        inicializarAcoesTabela();
    }

    function inicializarAcoesTabela() {
        document.querySelectorAll(".btn-table--edit").forEach(btn => {
            btn.addEventListener("click", () => { window.location.href = `cadastro.html?id=${btn.dataset.id}`; });
        });

        document.querySelectorAll(".btn-table--danger").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Excluir este registro?")) return;
                // Alterado para supabaseClient
                const { error } = await supabaseClient.from("cadastros_equipamentos").delete().eq("id", btn.dataset.id);
                if (error) alert("Erro: " + error.message);
                else carregarTabela();
            });
        });
    }

    if (tabelaContainer) carregarTabela();
    // --- CÓDIGO PARA LIMPAR TUDO ---
    const btnLimparTudo = document.getElementById("btnLimparTudo");

    if (btnLimparTudo) {
        btnLimparTudo.addEventListener("click", async () => {
            // 1. Confirmação de segurança (crucial para não apagar por acidente)
            const confirmacao = confirm("ATENÇÃO: Você tem certeza que deseja apagar TODOS os registros? Esta ação não pode ser desfeita!");

            if (!confirmacao) return;

            const segundaConfirmacao = confirm("Deseja mesmo prosseguir? Todos os dados da lista de equipamentos serão excluídos permanentemente.");

            if (segundaConfirmacao) {
                try {
                    const { error } = await supabaseClient
                        .from("cadastros_equipamentos")
                        .delete()
                        .gt("id", 0);

                    if (error) {
                        console.error("Erro ao limpar banco:", error);
                        alert("Erro ao apagar registros: " + error.message);
                    } else {
                        alert("A lista foi limpa com sucesso! ✅");
                        carregarTabela();
                    }
                } catch (err) {
                    console.error("Erro inesperado:", err);
                    alert("Ocorreu um erro inesperado ao tentar limpar os dados.");
                }
            }
        });
    }
});
