import { useState, useEffect, useCallback } from "react";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(table, t, clienteId) { try { let q = `${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`; if (clienteId) q += `&cliente_id=eq.${clienteId}`; const r = await fetch(q, { headers: sbH(t) }); const rows = await r.json(); return Array.isArray(rows) ? rows.map(x => x.dados) : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId || "zeste", dados: item, updated_at: new Date().toISOString() }) }); }
async function sbDel(table, id, t) { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: sbH(t), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function NumBR({ value, onChange, placeholder, style, className }) {
  const fmt = v => (v === 0 || v === "" || v == null || isNaN(v)) ? "" : String(v).replace(".", ",");
  const [txt, setTxt] = useState(fmt(value));
  const [foco, setFoco] = useState(false);
  useEffect(() => { if (!foco) setTxt(fmt(value)); }, [value, foco]);
  return <input type="text" inputMode="decimal" className={className} style={style} placeholder={placeholder || "0,00"} value={txt}
    onFocus={() => setFoco(true)}
    onChange={e => { const v = e.target.value.replace(/[^0-9.,]/g, ""); setTxt(v); const n = parseFloat(v.replace(",", ".")); onChange(isNaN(n) ? "" : n); }}
    onBlur={() => { setFoco(false); setTxt(fmt(value)); }} />;
}
const brl = v => "R$ " + (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const td = () => new Date().toISOString().slice(0, 10);
const dbr = d => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "";

// ── CORES ZESTE ──
const C = {
  preto: "#0E0E0C", branco: "#FFFFFF", offwhite: "#F2EBD8",
  lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B",
  cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9",
};

const CAT_FORN = ["Hortifruti", "Proteínas", "Laticínios", "Mercearia", "Bebidas", "Embalagens", "Limpeza", "Descartáveis", "Outros"];
const FORMAS_PGTO = ["Boleto 30 dias", "Boleto 28 dias", "Pix à vista", "Cartão 30 dias", "Cartão 15 dias", "Depósito", "Dinheiro"];
const STATUS_PEDIDO = { "Aguardando": C.cinzaE, "Confirmado": C.azul, "Em trânsito": C.lima, "Entregue": C.verde, "Cancelado": C.coral };

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Nunito+Sans:wght@400;600;700&display=swap');
.cmp-wrap{font-family:'Nunito Sans',sans-serif;background:${C.cinzaF};min-height:100vh;color:${C.preto}}
.cmp-header{background:${C.preto};position:sticky;top:0;z-index:300;border-bottom:1px solid #2A2A2A}
.cmp-tabs{display:flex;background:${C.preto};border-bottom:1px solid #2A2A2A;overflow-x:auto}
.cmp-tab{flex:1;padding:12px 8px;font-size:11px;font-weight:700;border:none;cursor:pointer;background:transparent;white-space:nowrap;letter-spacing:.04em;font-family:'Barlow Condensed',sans-serif;border-bottom:2px solid transparent}
.cmp-card{background:${C.branco};border:1px solid ${C.border};border-radius:12px;overflow:hidden}
.cmp-btn{padding:9px 16px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:.05em;cursor:pointer;border:none}
.cmp-input{width:100%;border:1.5px solid ${C.cinzaM};border-radius:7px;padding:9px 11px;font-size:14px;font-family:inherit;background:#FCFBF9;color:${C.preto};outline:none}
.cmp-input:focus{border-color:${C.lima}}
.cmp-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${C.cinzaE};display:block;margin-bottom:5px;margin-top:12px}
.cmp-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid ${C.cinzaF};cursor:pointer}
.cmp-row:hover{background:${C.cinzaF}}
.cmp-stat{background:${C.branco};border:1px solid ${C.border};border-radius:10px;padding:14px}
.cmp-stat-label{font-size:9px;font-weight:700;letter-spacing:.08em;color:${C.cinzaE};margin-bottom:5px}
.cmp-stat-val{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:700}
.cmp-modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:500;padding:16px}
.cmp-modal{background:${C.branco};border-radius:14px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto}
@media(max-width:600px){.cmp-grid2,.cmp-grid4{grid-template-columns:1fr 1fr!important}}
`;

function Fld({ label, children, half }) {
  return <div style={{ flex: half ? 1 : "auto", width: half ? "auto" : "100%" }}><label className="cmp-label">{label}</label>{children}</div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="cmp-modal-ov" onClick={onClose}>
      <div className="cmp-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 18, color: C.verde }}>{title}</span>
          <button onClick={onClose} style={{ background: C.cinzaF, border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── FORNECEDORES ──
const EF = () => ({ id: uid(), nome: "", categoria: "Hortifruti", cnpj: "", contato: "", telefone: "", email: "", prazoEntrega: 3, pagamento: "Boleto 30 dias", status: "Ativo", obs: "" });

function FormFornecedor({ init, onSave, onClose }) {
  const [f, setF] = useState(() => ({ ...EF(), ...(init || {}) }));
  const S = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <>
      <Fld label="Nome do fornecedor"><input className="cmp-input" value={f.nome} onChange={e => S("nome", e.target.value)} placeholder="Nome da empresa" /></Fld>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Categoria" half><select className="cmp-input" value={f.categoria} onChange={e => S("categoria", e.target.value)}>{CAT_FORN.map(c => <option key={c}>{c}</option>)}</select></Fld>
        <Fld label="CNPJ" half><input className="cmp-input" value={f.cnpj} onChange={e => S("cnpj", e.target.value)} placeholder="00.000.000/0001-00" /></Fld>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Contato" half><input className="cmp-input" value={f.contato} onChange={e => S("contato", e.target.value)} /></Fld>
        <Fld label="Telefone" half><input className="cmp-input" value={f.telefone} onChange={e => S("telefone", e.target.value)} /></Fld>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="E-mail" half><input className="cmp-input" value={f.email} onChange={e => S("email", e.target.value)} /></Fld>
        <Fld label="Prazo entrega (dias)" half><NumBR className="cmp-input" value={f.prazoEntrega} onChange={v => S("prazoEntrega", v)} /></Fld>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Pagamento" half><select className="cmp-input" value={f.pagamento} onChange={e => S("pagamento", e.target.value)}>{FORMAS_PGTO.map(p => <option key={p}>{p}</option>)}</select></Fld>
        <Fld label="Status" half><select className="cmp-input" value={f.status} onChange={e => S("status", e.target.value)}><option>Ativo</option><option>Inativo</option></select></Fld>
      </div>
      <Fld label="Observações"><textarea className="cmp-input" rows={2} value={f.obs} onChange={e => S("obs", e.target.value)} style={{ resize: "vertical" }} /></Fld>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
        <button className="cmp-btn" onClick={onClose} style={{ background: C.cinzaF, color: C.cinzaE }}>Cancelar</button>
        <button className="cmp-btn" onClick={() => onSave(f)} style={{ background: C.verde, color: "#fff" }}>✓ Salvar</button>
      </div>
    </>
  );
}

function Fornecedores({ fornecedores, onSave, onDelete }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const lst = fornecedores.filter(f => !q || f.nome?.toLowerCase().includes(q.toLowerCase()) || f.categoria?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input className="cmp-input" style={{ flex: 1, minWidth: 180 }} placeholder="🔍 Buscar fornecedor..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="cmp-btn" onClick={() => setModal("new")} style={{ background: C.lima, color: C.preto }}>+ Novo fornecedor</button>
      </div>
      <div className="cmp-card">
        {lst.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum fornecedor cadastrado</div>}
        {lst.map(f => (
          <div key={f.id} className="cmp-row" onClick={() => setModal(f)}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.status === "Ativo" ? C.verde : C.cinzaM, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15 }}>{f.nome}</div>
              <div style={{ fontSize: 12, color: C.cinzaE, marginTop: 1 }}>{f.categoria}{f.contato ? " · " + f.contato : ""}{f.telefone ? " · " + f.telefone : ""}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.cinzaE }}>{f.pagamento}</div>
              <div style={{ fontSize: 11, color: C.cinzaE }}>Entrega {f.prazoEntrega}d</div>
            </div>
            <button onClick={e => { e.stopPropagation(); if (confirm("Excluir fornecedor?")) onDelete(f.id); }} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>🗑</button>
          </div>
        ))}
      </div>
      {modal && <Modal title={modal === "new" ? "Novo Fornecedor" : "Editar Fornecedor"} onClose={() => setModal(null)}>
        <FormFornecedor init={modal !== "new" ? modal : null} onSave={f => { onSave(f); setModal(null); }} onClose={() => setModal(null)} />
      </Modal>}
    </div>
  );
}

// ── PEDIDOS ──
const EP = () => ({ id: uid(), fornecedor: "", data: td(), itens: "", valor: "", status: "Aguardando", obs: "" });

function FormPedido({ init, fornecedores, onSave, onClose }) {
  const [f, setF] = useState(() => ({ ...EP(), ...(init || {}) }));
  const S = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Fornecedor" half>
          <select className="cmp-input" value={f.fornecedor} onChange={e => S("fornecedor", e.target.value)}>
            <option value="">Selecione...</option>
            {fornecedores.map(fo => <option key={fo.id} value={fo.nome}>{fo.nome}</option>)}
          </select>
        </Fld>
        <Fld label="Data" half><input className="cmp-input" type="date" value={f.data} onChange={e => S("data", e.target.value)} /></Fld>
      </div>
      <Fld label="Itens do pedido"><textarea className="cmp-input" rows={3} value={f.itens} onChange={e => S("itens", e.target.value)} placeholder="Ex: Café 10kg, Leite 20L, Açúcar 5kg" style={{ resize: "vertical" }} /></Fld>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Total (R$)" half><NumBR className="cmp-input" value={f.valor} onChange={v => S("valor", v)} /></Fld>
        <Fld label="Status" half><select className="cmp-input" value={f.status} onChange={e => S("status", e.target.value)}>{Object.keys(STATUS_PEDIDO).map(s => <option key={s}>{s}</option>)}</select></Fld>
      </div>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
        <button className="cmp-btn" onClick={onClose} style={{ background: C.cinzaF, color: C.cinzaE }}>Cancelar</button>
        <button className="cmp-btn" onClick={() => onSave(f)} style={{ background: C.verde, color: "#fff" }}>✓ Salvar</button>
      </div>
    </>
  );
}

function Pedidos({ pedidos, fornecedores, onSave, onDelete }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const lst = pedidos.filter(p => !q || p.fornecedor?.toLowerCase().includes(q.toLowerCase()) || p.itens?.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const totalMes = pedidos.filter(p => (p.data || "").startsWith(new Date().toISOString().slice(0, 7)) && p.status !== "Cancelado").reduce((s, p) => s + (+p.valor || 0), 0);
  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
      <div className="cmp-grid4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div className="cmp-stat"><div className="cmp-stat-label">PEDIDOS NO MÊS</div><div className="cmp-stat-val" style={{ color: C.azul }}>{pedidos.filter(p => (p.data || "").startsWith(new Date().toISOString().slice(0, 7))).length}</div></div>
        <div className="cmp-stat"><div className="cmp-stat-label">GASTO NO MÊS</div><div className="cmp-stat-val" style={{ color: C.coral }}>{brl(totalMes)}</div></div>
        <div className="cmp-stat"><div className="cmp-stat-label">A RECEBER</div><div className="cmp-stat-val" style={{ color: C.lima }}>{pedidos.filter(p => p.status === "Em trânsito" || p.status === "Confirmado").length}</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input className="cmp-input" style={{ flex: 1, minWidth: 180 }} placeholder="🔍 Buscar pedido..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="cmp-btn" onClick={() => setModal("new")} style={{ background: C.lima, color: C.preto }}>+ Novo pedido</button>
      </div>
      <div className="cmp-card">
        {lst.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum pedido registrado</div>}
        {lst.map(p => {
          const cor = STATUS_PEDIDO[p.status] || C.cinzaE;
          return (
            <div key={p.id} className="cmp-row" onClick={() => setModal(p)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: cor + "22", color: cor, fontWeight: 700 }}>{p.status}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15 }}>{p.fornecedor}</span>
                </div>
                <div style={{ fontSize: 12, color: C.cinzaE, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.itens}</div>
                <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 2 }}>{dbr(p.data)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: C.coral }}>{brl(p.valor)}</div>
                <button onClick={e => { e.stopPropagation(); if (confirm("Excluir pedido?")) onDelete(p.id); }} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 13, marginTop: 4 }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      {modal && <Modal title={modal === "new" ? "Novo Pedido" : "Editar Pedido"} onClose={() => setModal(null)}>
        <FormPedido init={modal !== "new" ? modal : null} fornecedores={fornecedores} onSave={p => { onSave(p); setModal(null); }} onClose={() => setModal(null)} />
      </Modal>}
    </div>
  );
}

// ── COTAÇÕES ──
const EProd = () => ({ id: uid(), nome: "", categoria: "Hortifruti", qtdPedir: 0, precos: {} });

function Cotacao({ produtos, fornecedores, onSaveProd, onDelProd }) {
  const [modal, setModal] = useState(null);
  const [catAtiva, setCatAtiva] = useState(CAT_FORN[0]);
  const fornsAtivos = fornecedores.filter(f => f.status === "Ativo");
  const prodsCat = produtos.filter(p => p.categoria === catAtiva);

  // Para cada produto, encontrar menor preço
  const melhorPreco = p => {
    const precos = Object.entries(p.precos || {}).filter(([_, v]) => +v > 0);
    if (!precos.length) return null;
    return precos.reduce((min, cur) => +cur[1] < +min[1] ? cur : min);
  };

  const totalEstimado = produtos.reduce((s, p) => { const mp = melhorPreco(p); return s + (mp ? +mp[1] * (+p.qtdPedir || 0) : 0); }, 0);
  const itensPedir = produtos.filter(p => +p.qtdPedir > 0).length;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div className="cmp-grid4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div className="cmp-stat"><div className="cmp-stat-label">ITENS A PEDIR</div><div className="cmp-stat-val" style={{ color: C.lima }}>{itensPedir}</div></div>
        <div className="cmp-stat"><div className="cmp-stat-label">CUSTO ESTIMADO</div><div className="cmp-stat-val" style={{ color: C.coral }}>{brl(totalEstimado)}</div></div>
        <div className="cmp-stat"><div className="cmp-stat-label">PRODUTOS</div><div className="cmp-stat-val" style={{ color: C.azul }}>{produtos.length}</div></div>
        <div className="cmp-stat"><div className="cmp-stat-label">FORNECEDORES</div><div className="cmp-stat-val" style={{ color: C.verde }}>{fornsAtivos.length}</div></div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {CAT_FORN.map(cat => (
          <button key={cat} onClick={() => setCatAtiva(cat)} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid " + (catAtiva === cat ? C.verde : C.cinzaM), background: catAtiva === cat ? C.verde : "transparent", color: catAtiva === cat ? "#fff" : C.cinzaE, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{cat}</button>
        ))}
      </div>

      <div className="cmp-card">
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15 }}>{catAtiva}</span>
          <button className="cmp-btn" onClick={() => setModal("new")} style={{ background: C.lima, color: C.preto, fontSize: 12, padding: "6px 12px" }}>+ Produto</button>
        </div>
        {prodsCat.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: C.cinzaE, fontStyle: "italic", fontSize: 13 }}>Nenhum produto nesta categoria</div> :
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 400 }}>
              <thead><tr style={{ background: C.cinzaF }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: C.cinzaE, fontWeight: 700, textTransform: "uppercase" }}>Produto</th>
                <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>Qtd</th>
                {fornsAtivos.map(f => <th key={f.id} style={{ padding: "8px 8px", textAlign: "right", fontSize: 10, color: C.cinzaE, fontWeight: 700, whiteSpace: "nowrap" }}>{f.nome.slice(0, 12)}</th>)}
                <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 10, color: C.verde, fontWeight: 700 }}>Melhor</th>
                <th style={{ padding: "8px 8px", width: 30 }}></th>
              </tr></thead>
              <tbody>
                {prodsCat.map(p => {
                  const mp = melhorPreco(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.cinzaF}` }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>{p.nome}</td>
                      <td style={{ padding: "8px 8px", textAlign: "center" }}>
                        <NumBR value={p.qtdPedir} onChange={v => onSaveProd({ ...p, qtdPedir: v })} style={{ width: 50, border: `1px solid ${C.cinzaM}`, borderRadius: 5, padding: "4px 6px", textAlign: "center", fontSize: 13 }} />
                      </td>
                      {fornsAtivos.map(f => {
                        const isMelhor = mp && mp[0] === f.id;
                        return <td key={f.id} style={{ padding: "8px 8px", textAlign: "right" }}>
                          <NumBR value={p.precos?.[f.id] || ""} onChange={v => onSaveProd({ ...p, precos: { ...p.precos, [f.id]: v } })} placeholder="—" style={{ width: 64, border: `1px solid ${isMelhor ? C.verde : C.cinzaM}`, borderRadius: 5, padding: "4px 6px", textAlign: "right", fontSize: 12, background: isMelhor ? "#F0F7E6" : "#fff", fontWeight: isMelhor ? 700 : 400, color: isMelhor ? C.verde : C.preto }} />
                        </td>;
                      })}
                      <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: C.verde }}>{mp ? brl(mp[1]) : "—"}</td>
                      <td style={{ padding: "8px 8px", textAlign: "center" }}><button onClick={() => { if (confirm("Excluir produto?")) onDelProd(p.id); }} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 12 }}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: C.cinzaE, fontStyle: "italic" }}>💡 Digite os preços de cada fornecedor — o menor valor é destacado em verde automaticamente.</div>

      {modal && <Modal title="Novo Produto" onClose={() => setModal(null)}>
        <FormProduto catAtiva={catAtiva} onSave={p => { onSaveProd(p); setModal(null); }} onClose={() => setModal(null)} />
      </Modal>}
    </div>
  );
}

function FormProduto({ catAtiva, onSave, onClose }) {
  const [f, setF] = useState(() => ({ ...EProd(), categoria: catAtiva }));
  const S = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <>
      <Fld label="Nome do produto"><input className="cmp-input" value={f.nome} onChange={e => S("nome", e.target.value)} placeholder="Ex: Café em grãos 1kg" /></Fld>
      <div style={{ display: "flex", gap: 10 }}>
        <Fld label="Categoria" half><select className="cmp-input" value={f.categoria} onChange={e => S("categoria", e.target.value)}>{CAT_FORN.map(c => <option key={c}>{c}</option>)}</select></Fld>
        <Fld label="Qtd a pedir" half><NumBR className="cmp-input" value={f.qtdPedir} onChange={v => S("qtdPedir", v)} /></Fld>
      </div>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
        <button className="cmp-btn" onClick={onClose} style={{ background: C.cinzaF, color: C.cinzaE }}>Cancelar</button>
        <button className="cmp-btn" onClick={() => onSave(f)} style={{ background: C.verde, color: "#fff" }}>✓ Salvar</button>
      </div>
    </>
  );
}

// ── ROOT ──
export default function Compras({ onBack, token, clienteId }) {
  const [aba, setAba] = useState("fornecedores");
  const [fornecedores, setFornecedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sbLoad("compras_fornecedores", token, clienteId), sbLoad("compras_pedidos", token, clienteId), sbLoad("compras_produtos", token, clienteId)])
      .then(([f, p, pr]) => { setFornecedores(f); setPedidos(p); setProdutos(pr); })
      .finally(() => setLoading(false));
  }, []);

  const saveForn = async f => { setFornecedores(p => p.find(x => x.id === f.id) ? p.map(x => x.id === f.id ? f : x) : [f, ...p]); await sbUpsert("compras_fornecedores", f, token, clienteId); };
  const delForn = async id => { setFornecedores(p => p.filter(x => x.id !== id)); await sbDel("compras_fornecedores", id, token); };
  const savePed = async p => { setPedidos(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); await sbUpsert("compras_pedidos", p, token, clienteId); };
  const delPed = async id => { setPedidos(p => p.filter(x => x.id !== id)); await sbDel("compras_pedidos", id, token); };
  const saveProd = async p => { setProdutos(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); await sbUpsert("compras_produtos", p, token, clienteId); };
  const delProd = async id => { setProdutos(p => p.filter(x => x.id !== id)); await sbDel("compras_produtos", id, token); };

  const ABAS = [["fornecedores", "🏪 Fornecedores"], ["cotacao", "📋 Cotações"], ["pedidos", "🛒 Pedidos"]];

  return (
    <div className="cmp-wrap">
      <style>{STYLE}</style>
      <div className="cmp-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && <button onClick={onBack} style={{ color: C.lima, fontSize: 24, background: "none", border: "none", cursor: "pointer", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center" }}>‹</button>}
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.lima, letterSpacing: ".06em" }}>ZESTE</span>
              <span style={{ fontSize: 9, color: "#555", letterSpacing: ".14em" }}>COMPRAS</span>
            </div>
          </div>
        </div>
      </div>
      <div className="cmp-tabs">
        {ABAS.map(([id, l]) => (
          <button key={id} className="cmp-tab" onClick={() => setAba(id)} style={{ color: aba === id ? C.lima : "#555", borderBottomColor: aba === id ? C.lima : "transparent" }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: C.cinzaE }}>Carregando…</div> : <>
        {aba === "fornecedores" && <Fornecedores fornecedores={fornecedores} onSave={saveForn} onDelete={delForn} />}
        {aba === "cotacao" && <Cotacao produtos={produtos} fornecedores={fornecedores} onSaveProd={saveProd} onDelProd={delProd} />}
        {aba === "pedidos" && <Pedidos pedidos={pedidos} fornecedores={fornecedores} onSave={savePed} onDelete={delPed} />}
      </>}
    </div>
  );
}
