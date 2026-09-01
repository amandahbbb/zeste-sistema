import { useState, useEffect, useCallback } from "react";
import { toast } from "./toast.js";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(table, t, clienteId) { try { let q = `${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`; if (clienteId) q += `&cliente_id=eq.${clienteId}`; const r = await fetch(q, { headers: sbH(t) }); const rows = await r.json(); return Array.isArray(rows) ? rows.map(x => x.dados) : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { try { const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId || "zeste", dados: item, updated_at: new Date().toISOString() }) }); if (!r.ok) { toast("Erro ao salvar — tente de novo", "erro"); return false; } toast("✓ Salvo"); return true; } catch { toast("Sem conexão — não foi salvo", "erro"); return false; } }
async function sbDel(table, id, t) { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: sbH(t), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); if (!r.ok) { toast("Erro ao excluir", "erro"); return false; } toast("✓ Excluído"); return true; } catch { toast("Sem conexão — não foi excluído", "erro"); return false; } }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
async function loadIngsComp(clienteId, t) { try { let q = `${SB_URL}/rest/v1/fin_ingredientes?deleted_at=is.null&select=id,cliente_id,dados`; if (clienteId) q += `&cliente_id=in.(${clienteId},zeste)`; const r = await fetch(q, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...x.dados, id: x.id, _cli: x.cliente_id })) : []; } catch { return []; } }
async function loadFornsComp(clienteId, t) { try { let q = `${SB_URL}/rest/v1/crm_fornecedores?deleted_at=is.null&select=id,dados`; if (clienteId) q += `&cliente_id=in.(${clienteId},zeste)`; const r = await fetch(q, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...x.dados, id: x.id })) : []; } catch { return []; } }
async function loadPrecosComp(clienteId, t) { try { let q = `${SB_URL}/rest/v1/fornecedor_precos?deleted_at=is.null&select=*`; if (clienteId) q += `&cliente_id=in.(${clienteId},zeste)`; const r = await fetch(q, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }
async function loadFichasComp(clienteId, t) { try { let q = `${SB_URL}/rest/v1/fin_fichas?deleted_at=is.null&select=id,dados`; if (clienteId) q += `&cliente_id=in.(${clienteId},zeste)`; const r = await fetch(q, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...x.dados, id: x.id })) : []; } catch { return []; } }
async function loadPratosComp(clienteId, t) { try { let q = `${SB_URL}/rest/v1/fin_pratos?deleted_at=is.null&select=id,dados`; if (clienteId) q += `&cliente_id=in.(${clienteId},zeste)`; const r = await fetch(q, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...x.dados, id: x.id })) : []; } catch { return []; } }

// ── NF-e (importar preços de compra) ────────────────────────────────────────
const normN = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const soDigitos = s => (s || "").toString().replace(/\D/g, "");
const _PESO = ["KG", "KILO", "KG.", "K", "QUILO", "QUILOGRAMA"];
const _VOL = ["L", "LT", "LTR", "LITRO", "LTS", "LITROS"];
const _UNI = ["UN", "UND", "UNID", "UNIDADE", "PC", "PÇ", "PECA", "PEÇA", "PÇA"];
function classeUnid(u) { u = (u || "").toUpperCase().trim(); if (_PESO.includes(u)) return "peso"; if (_VOL.includes(u)) return "vol"; if (_UNI.includes(u)) return "un"; return "pack"; }
// Extrai emitente + itens de um XML de NF-e (nfeProc/NFe). Robusto a namespace via getElementsByTagName.
function parseNFe(xmlText) {
  let doc; try { doc = new DOMParser().parseFromString(xmlText, "text/xml"); } catch { return { erro: "Não consegui ler o arquivo." }; }
  if (!doc || doc.getElementsByTagName("parsererror").length) return { erro: "XML inválido — confira se é o arquivo da NF-e." };
  const T = (el, tag) => { const n = el && el.getElementsByTagName(tag)[0]; return n ? n.textContent.trim() : ""; };
  const emitEl = doc.getElementsByTagName("emit")[0];
  const emit = emitEl ? { cnpj: (T(emitEl, "CNPJ") || T(emitEl, "CPF")), nome: (T(emitEl, "xNome") || T(emitEl, "xFant")) } : { cnpj: "", nome: "" };
  const ideEl = doc.getElementsByTagName("ide")[0];
  const nNF = ideEl ? T(ideEl, "nNF") : "";
  const dhEmi = ideEl ? (T(ideEl, "dhEmi") || T(ideEl, "dEmi")) : "";
  const num = v => parseFloat((v || "0").toString().replace(",", ".")) || 0;
  const itens = Array.from(doc.getElementsByTagName("det")).map(det => {
    const prod = det.getElementsByTagName("prod")[0]; if (!prod) return null;
    return { cProd: T(prod, "cProd"), xProd: T(prod, "xProd"), ncm: T(prod, "NCM"), uCom: (T(prod, "uCom") || "").toUpperCase(), qCom: num(T(prod, "qCom")), vUnCom: num(T(prod, "vUnCom")), vProd: num(T(prod, "vProd")) };
  }).filter(Boolean);
  if (!itens.length) return { erro: "Nenhum item de produto encontrado na nota." };
  return { emit, nNF, dhEmi, itens };
}
// Preço na unidade-base do insumo (KG/L/UN). override = g/un (KG), ml/un (L) ou un/emb (UN) quando a unidade da nota não bate.
function precoBaseNFe(item, ing, override) {
  const un = ((ing && ing.un) || "KG").toUpperCase();
  const vUn = item.vUnCom > 0 ? item.vUnCom : (item.qCom > 0 ? item.vProd / item.qCom : 0);
  if (!vUn) return { preco: null, precisa: false, tipo: un };
  const cl = classeUnid(item.uCom);
  if (un === "KG" && cl === "peso") return { preco: +vUn.toFixed(4), precisa: false };
  if (un === "L" && cl === "vol") return { preco: +vUn.toFixed(4), precisa: false };
  if (un === "UN" && cl === "un") return { preco: +vUn.toFixed(4), precisa: false };
  const o = parseFloat(String(override).replace(",", ".")) || 0;
  if (!o) return { preco: null, precisa: true, tipo: un };
  if (un === "KG" || un === "L") return { preco: +(vUn / (o / 1000)).toFixed(4), precisa: false };
  return { preco: +(vUn / o).toFixed(4), precisa: false };
}
function matchIngNFe(xProd, ings) {
  const alvo = normN(xProd); if (!alvo) return null;
  let best = null, bs = 0;
  for (const ig of ings) {
    const n = normN(ig.nome); if (!n) continue; let s = 0;
    if (n === alvo) s = 100;
    else if (alvo.includes(n)) s = 60 + n.length;
    else if (n.includes(alvo)) s = 50 + alvo.length;
    else { const ta = new Set(alvo.split(" ").filter(w => w.length > 2)); const ov = n.split(" ").filter(w => w.length > 2 && ta.has(w)).length; if (ov) s = 20 + ov * 5; }
    if (s > bs) { bs = s; best = ig; }
  }
  return bs >= 20 ? best : null;
}
// Pratos que usam o ingrediente (direto no prato, ou via uma ficha usada no prato). Tolerante a comps/componentes.
function pratosDoIngrediente(ing, fichas, pratos) {
  if (!ing) return [];
  const alvoId = ing.id, alvoNome = normN(ing.nome);
  const usaIng = arr => (arr || []).some(x => x.tipo !== "ficha" && (x.ingId === alvoId || normN(x.nomeRef) === alvoNome));
  const fichasComIng = new Set(fichas.filter(f => usaIng(f.itens)).map(f => normN(f.nome)));
  const compsDe = p => p.comps || p.componentes || [];
  const out = [];
  for (const p of pratos) {
    const cs = compsDe(p);
    const direto = cs.some(c => c.tipo !== "ficha" && (c.ingId === alvoId || normN(c.nomeRef) === alvoNome));
    const viaFicha = cs.some(c => c.tipo === "ficha" && fichasComIng.has(normN(c.nomeRef)));
    if (direto || viaFicha) out.push(p.nome);
  }
  return [...new Set(out)];
}
async function precoUpsertComp(row, t) { return fetch(`${SB_URL}/rest/v1/fornecedor_precos`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) }); }
async function saveIngPrecoComp(ing, novoP, t) {
  const dados = { ...ing }; delete dados._cli; dados.p = novoP;
  const r = await fetch(`${SB_URL}/rest/v1/fin_ingredientes`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: ing.id, cliente_id: ing._cli || "zeste", dados, updated_at: new Date().toISOString() }) });
  return r.ok;
}

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
/* Força selects/options claros — evita dropdown preto no dark mode do iOS/iPad */
select{color-scheme:light !important;background-color:#fff !important;color:#1a1a1a !important;}
select option{background-color:#fff !important;color:#1a1a1a !important;}

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700;800&display=swap');
.cmp-wrap{font-family:'Barlow',sans-serif;background:${C.cinzaF};min-height:100vh;color:${C.preto}}
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
        {lst.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum fornecedor cadastrado. Toque em “+ Novo” para adicionar o primeiro.</div>}
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
        {lst.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum pedido registrado. Crie um pedido a partir de um fornecedor cadastrado.</div>}
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

function Cotacao({ produtos, fornecedores, onSaveProd, onDelProd, ingsComp = [], precosComp = [], fornsComp = [] }) {
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

      {(() => {
        const precoDe = (ingId, fornId) => { const r = precosComp.find(x => x.ingrediente_id === ingId && x.fornecedor_id === fornId && +x.preco > 0); return r ? +r.preco : null; };
        const ingsCF = ingsComp.filter(ig => precosComp.some(x => x.ingrediente_id === ig.id && +x.preco > 0));
        const fornsCP = fornsComp.filter(f => precosComp.some(x => x.fornecedor_id === f.id && +x.preco > 0));
        const menor = ig => { const vs = fornsCP.map(f => precoDe(ig.id, f.id)).filter(v => v != null); return vs.length ? Math.min(...vs) : null; };
        if (!ingsCF.length) return null;
        return <div className="cmp-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15 }}>📊 Comparativo automático — preços já cadastrados</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 400 }}>
              <thead><tr style={{ background: C.cinzaF }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: C.cinzaE, fontWeight: 700, textTransform: "uppercase" }}>Ingrediente</th>
                {fornsCP.map(f => <th key={f.id} style={{ padding: "8px 8px", textAlign: "right", fontSize: 10, color: C.cinzaE, fontWeight: 700, whiteSpace: "nowrap" }}>{(f.nome || "").slice(0, 12)}</th>)}
                <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 10, color: C.verde, fontWeight: 700 }}>Melhor</th>
              </tr></thead>
              <tbody>
                {ingsCF.map(ig => { const mn = menor(ig); return <tr key={ig.id} style={{ borderBottom: `1px solid ${C.cinzaF}` }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{ig.nome}</td>
                  {fornsCP.map(f => { const v = precoDe(ig.id, f.id); const eh = v != null && mn != null && Math.abs(v - mn) < 0.005; return <td key={f.id} style={{ padding: "8px 8px", textAlign: "right", fontWeight: eh ? 700 : 400, color: eh ? C.verde : C.preto, background: eh ? "#F0F7E6" : "transparent" }}>{v != null ? brl(v) : "—"}</td>; })}
                  <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: C.verde }}>{mn != null ? brl(mn) : "—"}</td>
                </tr>; })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", fontSize: 11, color: C.cinzaE, fontStyle: "italic" }}>💡 Puxado automático dos fornecedores cadastrados nos ingredientes — o menor preço em verde. (Em breve: editar aqui e salvar de volta.)</div>
        </div>;
      })()}
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
function ImportarNFe({ token, clienteId, ingsComp, precosComp, fornsComp, onAplicado }) {
  const [nota, setNota] = useState(null);       // { emit, nNF, dhEmi, itens } | { erro }
  const [fornId, setFornId] = useState("");
  const [linhas, setLinhas] = useState([]);      // { ...item, ingId, pesoG, aplicar }
  const [marcarAtual, setMarcarAtual] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [expandir, setExpandir] = useState(null); // índice da linha com "afeta N pratos" aberto
  const [fichas, setFichas] = useState([]);
  const [pratos, setPratos] = useState([]);

  useEffect(() => { let vivo = true; Promise.all([loadFichasComp(clienteId, token), loadPratosComp(clienteId, token)]).then(([f, p]) => { if (vivo) { setFichas(f); setPratos(p); } }); return () => { vivo = false; }; }, []);

  const fmt = (n, u) => (n == null ? "—" : "R$ " + (+n).toFixed(2).replace(".", ",") + (u ? "/" + u.toLowerCase() : ""));

  function lerArquivo(file) {
    setResultado(null); setExpandir(null);
    const rd = new FileReader();
    rd.onload = () => {
      const res = parseNFe(String(rd.result || ""));
      setNota(res);
      if (res.erro) { setLinhas([]); setFornId(""); return; }
      const alvo = soDigitos(res.emit.cnpj);
      const fMatch = fornsComp.find(f => alvo && soDigitos(f.cnpj) === alvo) || fornsComp.find(f => normN(f.nome) && normN(res.emit.nome).includes(normN(f.nome)));
      setFornId(fMatch ? fMatch.id : "");
      setLinhas(res.itens.map(it => {
        const ing = matchIngNFe(it.xProd, ingsComp);
        const pb = ing ? precoBaseNFe(it, ing, "") : { preco: null, precisa: false };
        return { ...it, ingId: ing ? ing.id : "", pesoG: "", aplicar: !!(ing && pb.preco != null) };
      }));
    };
    rd.readAsText(file, "UTF-8");
  }

  function setLin(i, patch) { setLinhas(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l)); }

  async function aplicar() {
    if (!fornId) { toast("Selecione o fornecedor da nota", "erro"); return; }
    const aplicaveis = linhas.filter(l => l.aplicar && l.ingId && precoBaseNFe(l, ingsComp.find(i => i.id === l.ingId), l.pesoG).preco != null);
    if (!aplicaveis.length) { toast("Nenhuma linha pronta para aplicar", "erro"); return; }
    if (!window.confirm(`Aplicar ${aplicaveis.length} preço(s)?` + (marcarAtual ? " Isso atualiza o custo (CMV) desses insumos." : " Só registra o preço deste fornecedor (não muda o CMV).")))
      return;
    setAplicando(true);
    let okc = 0, ings = 0;
    for (const lin of aplicaveis) {
      const ing = ingsComp.find(i => i.id === lin.ingId); if (!ing) continue;
      const pb = precoBaseNFe(lin, ing, lin.pesoG); if (pb.preco == null) continue;
      const cliRow = ing._cli || clienteId || "zeste";
      const existente = precosComp.find(r => r.fornecedor_id === fornId && r.ingrediente_id === ing.id);
      if (marcarAtual) {
        for (const r of precosComp.filter(r => r.ingrediente_id === ing.id && r.atual && r.fornecedor_id !== fornId))
          await precoUpsertComp({ ...r, atual: false, atualizado_em: new Date().toISOString() }, token);
      }
      const r2 = await precoUpsertComp({ id: existente ? existente.id : uid(), cliente_id: cliRow, ingrediente_id: ing.id, fornecedor_id: fornId, preco: pb.preco, unidade: (ing.un || "KG"), atual: marcarAtual ? true : (existente ? !!existente.atual : false), atualizado_em: new Date().toISOString() }, token);
      if (r2 && r2.ok) okc++;
      if (marcarAtual) { const ok = await saveIngPrecoComp(ing, pb.preco, token); if (ok) ings++; }
    }
    setAplicando(false);
    setResultado({ precos: okc, ings });
    toast(`✓ ${okc} preço(s) atualizado(s)`);
    onAplicado && onAplicado();
  }

  const box = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 12 };
  const th = { textAlign: "left", fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", padding: "6px 8px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const td = { fontSize: 12.5, padding: "7px 8px", borderBottom: `1px solid ${C.cinzaF}`, verticalAlign: "top" };
  const ingsOrd = [...ingsComp].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  return (
    <div style={{ padding: "14px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ ...box, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.preto, marginBottom: 4 }}>📄 Importar preços de uma NF-e</div>
        <div style={{ fontSize: 12, color: C.cinzaE, marginBottom: 10 }}>Suba o XML da nota de compra. O sistema lê os itens, casa com seus insumos e mostra o preço atual → novo. Nada é gravado até você conferir e clicar em aplicar.</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.lima, color: "#0E0E0C", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}>
          Escolher arquivo XML
          <input type="file" accept=".xml,text/xml,application/xml" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) lerArquivo(f); e.target.value = ""; }} />
        </label>
      </div>

      {nota && nota.erro && <div style={{ ...box, borderColor: C.coral, color: C.coral, fontSize: 13 }}>⚠ {nota.erro}</div>}

      {nota && !nota.erro && <>
        <div style={{ ...box, marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 220px" }}>
              <div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700, marginBottom: 3 }}>FORNECEDOR (EMITENTE: {nota.emit.nome || "—"}{nota.emit.cnpj ? " · " + nota.emit.cnpj : ""})</div>
              <select value={fornId} onChange={e => setFornId(e.target.value)} className="cmp-input" style={{ width: "100%" }}>
                <option value="">— selecione o fornecedor cadastrado —</option>
                {fornsComp.map(f => <option key={f.id} value={f.id}>{f.nome}{f.cnpj ? ` (${f.cnpj})` : ""}</option>)}
              </select>
              {!fornId && <div style={{ fontSize: 11, color: C.coral, marginTop: 4 }}>Fornecedor não reconhecido pelo CNPJ — selecione (ou cadastre na aba Fornecedores).</div>}
            </div>
            <div style={{ fontSize: 12, color: C.cinzaE }}>Nota nº {nota.nNF || "—"}{nota.dhEmi ? " · " + nota.dhEmi.slice(0, 10) : ""} · {nota.itens.length} itens</div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12.5, color: C.preto, cursor: "pointer" }}>
            <input type="checkbox" checked={marcarAtual} onChange={e => setMarcarAtual(e.target.checked)} />
            Marcar como preço atual (atualiza o custo/CMV dos insumos). Desligue para só registrar o preço deste fornecedor.
          </label>
        </div>

        <div style={{ ...box, padding: 0, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
            <thead><tr>
              <th style={{ ...th, width: 34 }}></th>
              <th style={th}>ITEM DA NOTA</th>
              <th style={th}>INSUMO</th>
              <th style={th}>QTD</th>
              <th style={th}>ATUAL → NOVO</th>
              <th style={th}>IMPACTO</th>
            </tr></thead>
            <tbody>
              {linhas.map((l, i) => {
                const ing = ingsComp.find(x => x.id === l.ingId);
                const pb = precoBaseNFe(l, ing, l.pesoG);
                const atual = ing ? (+ing.p || 0) : null;
                const novo = pb.preco;
                const delta = (atual > 0 && novo != null) ? (novo - atual) / atual * 100 : null;
                const pronto = !!ing && novo != null;
                const afet = ing ? pratosDoIngrediente(ing, fichas, pratos) : [];
                const labelConv = (ing && (ing.un || "KG").toUpperCase() === "UN") ? "un/emb" : ((ing && (ing.un || "").toUpperCase() === "L") ? "ml/un" : "g/un");
                return (
                  <tr key={i} style={{ background: l.aplicar && pronto ? "#F7FAEE" : "transparent" }}>
                    <td style={td}><input type="checkbox" disabled={!pronto} checked={!!l.aplicar && pronto} onChange={e => setLin(i, { aplicar: e.target.checked })} /></td>
                    <td style={{ ...td, maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: C.preto }}>{l.xProd}</div>
                      <div style={{ fontSize: 10.5, color: C.cinzaE }}>{l.uCom} · {fmt(l.vUnCom)}{l.cProd ? " · cód " + l.cProd : ""}</div>
                    </td>
                    <td style={{ ...td, minWidth: 170 }}>
                      <select value={l.ingId} onChange={e => setLin(i, { ingId: e.target.value })} className="cmp-input" style={{ width: "100%", fontSize: 12 }}>
                        <option value="">— não vincular —</option>
                        {ingsOrd.map(ig => <option key={ig.id} value={ig.id}>{ig.nome}{ig._cli === "zeste" ? " · base" : ""}</option>)}
                      </select>
                      {pb.precisa && <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 10.5, color: C.coral, fontWeight: 700 }}>⚠ informar {labelConv}:</span>
                        <input type="text" inputMode="decimal" value={l.pesoG} onChange={e => setLin(i, { pesoG: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder={labelConv} style={{ width: 66, border: `1.5px solid ${C.cinzaM}`, borderRadius: 6, padding: "4px 6px", fontSize: 12 }} />
                      </div>}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{(l.qCom || 0).toString().replace(".", ",")} {l.uCom}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {!ing ? <span style={{ color: C.cinzaE }}>—</span> : novo == null ? <span style={{ color: C.coral, fontSize: 11 }}>informe {labelConv}</span> : <>
                        <span style={{ color: C.cinzaE }}>{fmt(atual, ing.un)}</span>
                        <span style={{ color: C.cinzaE }}> → </span>
                        <b style={{ color: delta == null ? C.preto : (delta > 0 ? C.coral : C.verde) }}>{fmt(novo, ing.un)}</b>
                        {delta != null && <span style={{ fontSize: 11, color: delta > 0 ? C.coral : C.verde }}> {delta > 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(0)}%</span>}
                      </>}
                    </td>
                    <td style={td}>
                      {ing && afet.length ? <button onClick={() => setExpandir(expandir === i ? null : i)} style={{ background: "none", border: "none", color: C.azul, fontSize: 11.5, cursor: "pointer", padding: 0, textAlign: "left" }}>afeta {afet.length} prato{afet.length > 1 ? "s" : ""} {expandir === i ? "▾" : "▸"}</button> : <span style={{ color: C.cinzaM, fontSize: 11 }}>—</span>}
                      {expandir === i && afet.length > 0 && <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 3, lineHeight: 1.5 }}>{afet.join(" · ")}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={aplicar} disabled={aplicando || !fornId} style={{ background: aplicando || !fornId ? C.cinzaM : C.verde, color: "#fff", fontWeight: 700, fontSize: 14, padding: "11px 20px", borderRadius: 9, border: "none", cursor: aplicando || !fornId ? "default" : "pointer" }}>{aplicando ? "Aplicando…" : "Aplicar preços marcados"}</button>
          <span style={{ fontSize: 12, color: C.cinzaE }}>{linhas.filter(l => l.aplicar && l.ingId).length} marcado(s) · {linhas.filter(l => !l.ingId).length} sem vínculo</span>
          {resultado && <span style={{ fontSize: 12.5, color: C.verde, fontWeight: 600 }}>✓ {resultado.precos} preço(s){marcarAtual ? ` · ${resultado.ings} insumo(s) recustados` : ""}</span>}
        </div>
      </>}
    </div>
  );
}

export default function Compras({ onBack, token, clienteId }) {
  const [aba, setAba] = useState("fornecedores");
  const [fornecedores, setFornecedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingsComp, setIngsComp] = useState([]);
  const [precosComp, setPrecosComp] = useState([]);
  const [fornsComp, setFornsComp] = useState([]);

  useEffect(() => {
    Promise.all([sbLoad("crm_fornecedores", token, clienteId), sbLoad("compras_pedidos", token, clienteId), sbLoad("compras_produtos", token, clienteId)])
      .then(([f, p, pr]) => { setFornecedores(f); setPedidos(p); setProdutos(pr); })
      .finally(() => setLoading(false));
    Promise.all([loadIngsComp(clienteId, token), loadPrecosComp(clienteId, token), loadFornsComp(clienteId, token)])
      .then(([ig, pr, fo]) => { setIngsComp(ig); setPrecosComp(pr); setFornsComp(fo); });
  }, []);

  const saveForn = async f => { setFornecedores(p => p.find(x => x.id === f.id) ? p.map(x => x.id === f.id ? f : x) : [f, ...p]); await sbUpsert("crm_fornecedores", f, token, clienteId); };
  const delForn = async id => { setFornecedores(p => p.filter(x => x.id !== id)); await sbDel("crm_fornecedores", id, token); };
  const savePed = async p => { setPedidos(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); await sbUpsert("compras_pedidos", p, token, clienteId); };
  const delPed = async id => { setPedidos(p => p.filter(x => x.id !== id)); await sbDel("compras_pedidos", id, token); };
  const saveProd = async p => { setProdutos(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); await sbUpsert("compras_produtos", p, token, clienteId); };
  const delProd = async id => { setProdutos(p => p.filter(x => x.id !== id)); await sbDel("compras_produtos", id, token); };

  const refreshCusto = async () => { const [ig, pr] = await Promise.all([loadIngsComp(clienteId, token), loadPrecosComp(clienteId, token)]); setIngsComp(ig); setPrecosComp(pr); };

  const ABAS = [["fornecedores", "🏪 Fornecedores"], ["cotacao", "📋 Cotações"], ["pedidos", "🛒 Pedidos"], ["nfe", "📄 Importar NF-e"]];

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
        {aba === "cotacao" && <Cotacao produtos={produtos} fornecedores={fornecedores} onSaveProd={saveProd} onDelProd={delProd} ingsComp={ingsComp} precosComp={precosComp} fornsComp={fornsComp} />}
        {aba === "pedidos" && <Pedidos pedidos={pedidos} fornecedores={fornecedores} onSave={savePed} onDelete={delPed} />}
        {aba === "nfe" && <ImportarNFe token={token} clienteId={clienteId} ingsComp={ingsComp} precosComp={precosComp} fornsComp={fornsComp} onAplicado={refreshCusto} />}
      </>}
    </div>
  );
}
