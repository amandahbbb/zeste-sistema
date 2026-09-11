import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const C = { preto: "#0E0E0C", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#B0AC9E", cinzaE: "#4A4A42", border: "#E3E1D9" };
const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? 0 : n; };
const hoje = () => new Date().toISOString().slice(0, 10);
const dBR = d => (d || "").split("-").reverse().join("/");

// status → rótulo, cor, próximo
const STATUS = {
  aberto: { rot: "A produzir", cor: "#B8860B", ordem: 0 },
  pronto: { rot: "Pronto", cor: "#1A4F71", ordem: 1 },
  entregue: { rot: "Entregue", cor: "#497A5D", ordem: 2 },
  recebido: { rot: "Recebido ✓", cor: "#497A5D", ordem: 3 },
};
const PROXIMO = { aberto: "pronto", pronto: "entregue", entregue: "recebido" };
const ACAO = { aberto: "Marcar pronto", pronto: "Marcar entregue", entregue: "Dar baixa (recebido)" };

async function carregarPedidos(cid, token) { try { const r = await fetch(`${SB_URL}/rest/v1/pedidos_cliente?cliente_id=eq.${cid}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : []; } catch { return []; } }
async function carregarProdutos(cid, token) { try { const r = await fetch(`${SB_URL}/rest/v1/fin_pratos?or=(cliente_id.eq.${cid},cliente_id.like.${cid}-*)&deleted_at=is.null&select=id,cliente_id,dados`, { headers: sbH(token) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ id: x.dados && x.dados.id ? x.dados.id : x.id, nome: (x.dados || {}).nome, preco: +(x.dados || {}).precoVenda || 0 })).filter(p => p.nome) : []; } catch { return []; } }
async function salvarPedido(ped, cid, token) { const r = await fetch(`${SB_URL}/rest/v1/pedidos_cliente`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: ped.id, cliente_id: cid, dados: ped, updated_at: new Date().toISOString() }) }); return r.ok; }
async function excluirPedido(id, token) { await fetch(`${SB_URL}/rest/v1/pedidos_cliente?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); }
// baixa financeira: grava uma ENTRADA na mesma tabela do fluxo de caixa
async function lancarNoFluxo(item, cid, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: cid, dados: item, updated_at: new Date().toISOString() }) }); return r.ok; }
async function removerDoFluxo(id, token) { await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); }

const totalPedido = p => (p.itens || []).reduce((a, i) => a + num(i.qtd) * num(i.precoUnit), 0);

export default function Pedidos({ token, clienteId, clienteNome, podeEditar = true }) {
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);   // pedido em edição/criação
  const [filtro, setFiltro] = useState("ativos"); // ativos | todos

  useEffect(() => { Promise.all([carregarPedidos(clienteId, token), carregarProdutos(clienteId, token)]).then(([ps, pr]) => { setPedidos(ps); setProdutos(pr); setLoading(false); }); }, [clienteId]);

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 11px", fontSize: 14, background: "#fff", fontFamily: "inherit", color: C.preto };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };

  const novo = () => setEdit({ id: uid(), cliente: "", entrega: hoje(), obs: "", status: "aberto", itens: [{ prodId: "", nome: "", qtd: "1", precoUnit: 0 }] });
  const editar = p => setEdit(JSON.parse(JSON.stringify(p)));
  const upItem = (i, patch) => setEdit(e => ({ ...e, itens: e.itens.map((x, j) => j === i ? { ...x, ...patch } : x) }));
  const addItem = () => setEdit(e => ({ ...e, itens: [...e.itens, { prodId: "", nome: "", qtd: "1", precoUnit: 0 }] }));
  const delItem = i => setEdit(e => ({ ...e, itens: e.itens.filter((_, j) => j !== i) }));
  const escolherProduto = (i, prodId) => { const p = produtos.find(x => x.id === prodId); upItem(i, { prodId, nome: p ? p.nome : "", precoUnit: p ? p.preco : 0 }); };

  const salvar = async () => {
    const limpo = { ...edit, itens: edit.itens.filter(i => i.prodId && num(i.qtd) > 0) };
    if (!limpo.itens.length) { window.alert("Adicione ao menos um produto ao pedido."); return; }
    setPedidos(p => p.find(x => x.id === limpo.id) ? p.map(x => x.id === limpo.id ? limpo : x) : [limpo, ...p]);
    setEdit(null); await salvarPedido(limpo, clienteId, token);
  };
  const remover = async (p) => { if (!window.confirm("Excluir este pedido?")) return; setPedidos(x => x.filter(y => y.id !== p.id)); if (p.fluxoId) await removerDoFluxo(p.fluxoId, token); await excluirPedido(p.id, token); };

  const avancar = async (p) => {
    const prox = PROXIMO[p.status]; if (!prox) return;
    let upd = { ...p, status: prox };
    // ao virar "recebido", lança entrada no fluxo de caixa
    if (prox === "recebido") {
      const total = totalPedido(p);
      const fluxoId = "ped_" + p.id;
      const lanc = { id: fluxoId, data: p.entrega || hoje(), competencia: (p.entrega || hoje()).slice(0, 7), tipo: "entrada", categoria: "Delivery / Pedido", subcategoria: p.cliente || "", descricao: `Pedido${p.cliente ? " · " + p.cliente : ""} (${(p.itens || []).length} item(ns))`, valor: total, previsto: "", pago: true };
      await lancarNoFluxo(lanc, clienteId, token);
      upd = { ...upd, fluxoId, valorRecebido: total };
    }
    setPedidos(x => x.map(y => y.id === p.id ? upd : y)); await salvarPedido(upd, clienteId, token);
  };
  const voltar = async (p) => {
    const ordem = ["aberto", "pronto", "entregue", "recebido"]; const idx = ordem.indexOf(p.status); if (idx <= 0) return;
    const ant = ordem[idx - 1];
    let upd = { ...p, status: ant };
    if (p.status === "recebido" && p.fluxoId) { await removerDoFluxo(p.fluxoId, token); upd = { ...upd, fluxoId: null }; } // desfaz a baixa
    setPedidos(x => x.map(y => y.id === p.id ? upd : y)); await salvarPedido(upd, clienteId, token);
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando pedidos…</div>;

  // ─────────── EDITOR ───────────
  if (edit) {
    const total = totalPedido(edit);
    return (
      <div style={{ padding: 16, maxWidth: 760, margin: "0 auto", fontFamily: "'Barlow',sans-serif", color: C.preto }}>
        <button onClick={() => setEdit(null)} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>‹ Voltar aos pedidos</button>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{pedidos.find(p => p.id === edit.id) ? "Editar pedido" : "Novo pedido"}</div>

        <div style={card}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div style={{ flex: "2 1 220px" }}><label style={lbl}>CLIENTE (quem vai receber)</label><input value={edit.cliente} onChange={e => setEdit({ ...edit, cliente: e.target.value })} placeholder="ex.: Dona Maria" style={inp} /></div>
            <div style={{ flex: "1 1 140px" }}><label style={lbl}>DATA DE ENTREGA</label><input type="date" value={edit.entrega} onChange={e => setEdit({ ...edit, entrega: e.target.value })} style={inp} /></div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700 }}>Produtos do pedido</div>
            <button onClick={addItem} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: C.azul, fontWeight: 600 }}>+ produto</button>
          </div>
          {/* cabeçalho */}
          <div style={{ display: "flex", gap: 6, padding: "0 2px 4px", fontSize: 10, fontWeight: 700, color: C.cinzaE }}>
            <span style={{ flex: 1 }}>PRODUTO</span><span style={{ width: 54, textAlign: "center" }}>QTD</span><span style={{ width: 82, textAlign: "right" }}>PREÇO UN</span><span style={{ width: 82, textAlign: "right" }}>SUBTOTAL</span><span style={{ width: 22 }} />
          </div>
          {edit.itens.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <select value={it.prodId} onChange={e => escolherProduto(i, e.target.value)} style={{ ...inp, flex: 1, padding: "8px" }}>
                <option value="">— escolher —</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <input type="text" inputMode="numeric" value={it.qtd} onChange={e => upItem(i, { qtd: e.target.value.replace(/[^0-9]/g, "") })} style={{ ...inp, width: 54, textAlign: "center", padding: "8px 4px" }} />
              <input type="text" inputMode="decimal" value={String(it.precoUnit).replace(".", ",")} onChange={e => upItem(i, { precoUnit: num(e.target.value) })} title="editável (desconto/brinde)" style={{ ...inp, width: 82, textAlign: "right", padding: "8px 6px" }} />
              <span style={{ width: 82, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{brl(num(it.qtd) * num(it.precoUnit))}</span>
              <button onClick={() => delItem(i)} style={{ width: 22, background: "none", border: "none", color: C.coral, fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", marginTop: 4 }}>O preço vem do cadastro do produto, mas pode ser editado (desconto, brinde = 0).</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "baseline", marginTop: 8, paddingTop: 8, borderTop: `1.5px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.cinzaE, fontWeight: 700 }}>TOTAL</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, color: C.verde }}>{brl(total)}</span>
          </div>
        </div>

        <div style={card}>
          <label style={lbl}>OBSERVAÇÃO (opcional)</label>
          <input value={edit.obs} onChange={e => setEdit({ ...edit, obs: e.target.value })} placeholder="ex.: sem sal, entregar de manhã" style={inp} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={salvar} style={{ background: C.lima, color: C.preto, border: "none", padding: "11px 20px", borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Salvar pedido</button>
          <button onClick={() => setEdit(null)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 9, padding: "11px 18px", fontSize: 15, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
        </div>
      </div>
    );
  }

  // ─────────── LISTA ───────────
  const visiveis = pedidos.filter(p => filtro === "todos" ? true : p.status !== "recebido").sort((a, b) => (a.entrega || "").localeCompare(b.entrega || ""));
  const abertos = pedidos.filter(p => p.status === "aberto").length;
  const prontos = pedidos.filter(p => p.status === "pronto").length;

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto", fontFamily: "'Barlow',sans-serif", color: C.preto }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800 }}>Pedidos</div>
          <div style={{ fontSize: 13, color: C.cinzaE }}>{abertos} a produzir · {prontos} pronto(s) para entregar</div>
        </div>
        {podeEditar && <button onClick={novo} style={{ background: C.lima, color: C.preto, border: "none", padding: "11px 18px", borderRadius: 9, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>+ Novo pedido</button>}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12, background: C.cinzaF, borderRadius: 9, padding: 4, width: "fit-content" }}>
        {[["ativos", "Em aberto"], ["todos", "Todos"]].map(([id, l]) => (
          <button key={id} onClick={() => setFiltro(id)} style={{ border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: filtro === id ? "#fff" : "transparent", color: filtro === id ? C.preto : C.cinzaE }}>{l}</button>
        ))}
      </div>

      {visiveis.length === 0 ? <div style={{ ...card, textAlign: "center", color: C.cinzaE, fontStyle: "italic", padding: 30 }}>{filtro === "ativos" ? "Nenhum pedido em aberto. Toque em “+ Novo pedido”." : "Nenhum pedido ainda."}</div> :
        visiveis.map(p => {
          const st = STATUS[p.status] || STATUS.aberto;
          const atrasado = p.status !== "recebido" && p.status !== "entregue" && p.entrega && p.entrega < hoje();
          return (
            <div key={p.id} style={{ ...card, borderLeft: `4px solid ${st.cor}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{p.cliente || "Sem nome"}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: st.cor, border: `1px solid ${st.cor}`, borderRadius: 10, padding: "1px 8px" }}>{st.rot}</span>
                    <span style={{ fontSize: 12.5, color: atrasado ? C.coral : C.cinzaE, fontWeight: atrasado ? 700 : 400 }}>entrega {dBR(p.entrega)}{atrasado ? " · atrasado" : ""}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.preto, marginTop: 6 }}>
                    {(p.itens || []).map((it, k) => <span key={k}>{k > 0 ? " · " : ""}<b>{num(it.qtd)}×</b> {it.nome}</span>)}
                  </div>
                  {p.obs && <div style={{ fontSize: 12, color: C.cinzaE, marginTop: 3, fontStyle: "italic" }}>{p.obs}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.verde }}>{brl(totalPedido(p))}</div>
                </div>
              </div>
              {podeEditar && <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                {PROXIMO[p.status] && <button onClick={() => avancar(p)} style={{ background: st.cor, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{ACAO[p.status]}</button>}
                {p.status !== "aberto" && <button onClick={() => voltar(p)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: C.cinzaE }}>‹ voltar status</button>}
                {p.status !== "recebido" && <button onClick={() => editar(p)} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>editar</button>}
                <button onClick={() => remover(p)} style={{ background: "none", border: "none", color: C.coral, fontSize: 13, cursor: "pointer", marginLeft: "auto" }}>excluir</button>
              </div>}
              {p.status === "recebido" && <div style={{ fontSize: 11.5, color: C.verde, marginTop: 6 }}>✓ Baixa lançada no fluxo de caixa ({brl(p.valorRecebido || totalPedido(p))})</div>}
            </div>
          );
        })}
    </div>
  );
}
