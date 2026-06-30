import { useState, useEffect, useRef, useCallback } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(t) { try { const r = await fetch(`${SB_URL}/rest/v1/studio_boards?deleted_at=is.null&order=updated_at.desc`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => x.dados) : []; } catch { return []; } }
async function sbSave(board, t) { await fetch(`${SB_URL}/rest/v1/studio_boards`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: board.id, dados: board, updated_at: new Date().toISOString() }) }); }
async function sbDel(id, t) { await fetch(`${SB_URL}/rest/v1/studio_boards?id=eq.${id}`, { method: "PATCH", headers: sbH(t), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", creme: "#F2EBD8", cinzaE: "#6B6B5E" };
const CORES = { lima: "#E8EFC8", verde: "#D5E4DC", azul: "#D2DFE9", coral: "#F2D9CF", creme: "#F5F0DE", branco: "#FFFFFF" };
const CORES_BORDA = { lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", creme: "#C9BC93", branco: "#E3E1D9" };

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap');
.st-wrap{font-family:'Barlow',sans-serif;background:#1a1a18;height:100vh;overflow:hidden;position:relative;color:#fff}
.st-topbar{position:absolute;top:0;left:0;right:0;height:52px;background:rgba(14,14,12,.96);border-bottom:1px solid #2A2A2A;display:flex;align-items:center;gap:12px;padding:0 14px;z-index:100;backdrop-filter:blur(8px)}
.st-canvas{position:absolute;inset:0;top:52px;overflow:hidden;cursor:grab;background-color:#1f1f1d;background-image:radial-gradient(circle, #333 1px, transparent 1px);background-size:24px 24px}
.st-canvas.panning{cursor:grabbing}
.st-card{position:absolute;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.28);cursor:move;user-select:none;transition:box-shadow .15s}
.st-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.4)}
.st-card.sel{outline:2.5px solid ${C.lima};outline-offset:2px}
.st-tool{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;border:1px solid #333;background:#222;transition:all .12s}
.st-tool:hover{background:#2e2e2e;border-color:${C.lima}}
.st-tool.active{background:${C.lima};border-color:${C.lima};color:#000}
.st-btn{padding:8px 14px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;cursor:pointer;border:none}
.st-ta{width:100%;height:100%;border:none;background:transparent;resize:none;outline:none;font-family:inherit;font-size:14px;color:#1a1a1a;padding:12px}
.st-ai-panel{position:absolute;right:14px;bottom:14px;width:320px;background:rgba(14,14,12,.97);border:1px solid #333;border-radius:14px;z-index:90;overflow:hidden;backdrop-filter:blur(10px)}
`;

const NOTE_FONT = "'Caveat', cursive";

export default function Studio({ onBack, token }) {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState(null);
  const [cards, setCards] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [sel, setSel] = useState(null);
  const [tool, setTool] = useState("select");
  const [drawing, setDrawing] = useState(false);
  const [curStroke, setCurStroke] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInstr, setAiInstr] = useState("");
  const [recording, setRecording] = useState(false);
  const canvasRef = useRef(null);
  const panRef = useRef(null);
  const dragRef = useRef(null);
  const mediaRef = useRef(null);
  const saveTimer = useRef(null);

  const board = boards.find(b => b.id === boardId);

  useEffect(() => {
    sbLoad(token).then(bs => {
      setBoards(bs);
      if (bs.length > 0) { setBoardId(bs[0].id); setCards(bs[0].cards || []); setStrokes(bs[0].strokes || []); }
      setLoading(false);
    });
  }, []);

  // autosave debounced
  const queueSave = useCallback((nextCards, nextStrokes) => {
    if (!boardId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const b = { ...boards.find(x => x.id === boardId), cards: nextCards, strokes: nextStrokes };
      sbSave(b, token);
      setBoards(p => p.map(x => x.id === boardId ? b : x));
    }, 800);
  }, [boardId, boards, token]);

  const updateCards = (next) => { setCards(next); queueSave(next, strokes); };
  const updateStrokes = (next) => { setStrokes(next); queueSave(cards, next); };

  const novoBoard = async () => {
    const nome = prompt("Nome do board:", "Novo board");
    if (!nome) return;
    const b = { id: uid(), nome, cards: [], strokes: [], criado: new Date().toISOString() };
    await sbSave(b, token);
    setBoards(p => [b, ...p]); setBoardId(b.id); setCards([]); setStrokes([]);
  };

  const trocarBoard = (id) => {
    const b = boards.find(x => x.id === id);
    setBoardId(id); setCards(b.cards || []); setStrokes(b.strokes || []); setSel(null);
    setView({ x: 0, y: 0, z: 1 });
  };

  const delBoard = async () => {
    if (!board || !confirm(`Excluir board "${board.nome}"?`)) return;
    await sbDel(boardId, token);
    const rest = boards.filter(b => b.id !== boardId);
    setBoards(rest);
    if (rest.length) trocarBoard(rest[0].id); else { setBoardId(null); setCards([]); setStrokes([]); }
  };

  // coordenada do mundo a partir do evento
  const toWorld = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - view.x) / view.z, y: (e.clientY - rect.top - view.y) / view.z };
  };

  const addCard = (tipo, extra = {}) => {
    const center = toWorld({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    const nc = { id: uid(), tipo, x: center.x - 90, y: center.y - 60, w: 190, h: tipo === "imagem" ? 160 : 130, texto: "", cor: tipo === "postit" ? "lima" : "branco", ...extra };
    updateCards([...cards, nc]);
    setSel(nc.id); setTool("select");
  };

  const addImagem = () => { const url = prompt("Cole o link da imagem (Pinterest, web, etc):"); if (url) addCard("imagem", { url, w: 200, h: 200 }); };
  const addLink = () => { const url = prompt("Cole o link:"); if (url) addCard("link", { url, texto: url, w: 220, h: 90 }); };

  const updCard = (id, patch) => updateCards(cards.map(c => c.id === id ? { ...c, ...patch } : c));
  const delCard = (id) => { updateCards(cards.filter(c => c.id !== id)); setSel(null); };

  // PAN + ZOOM
  const onCanvasDown = (e) => {
    if (tool === "draw") { startDraw(e); return; }
    if (e.target === canvasRef.current || e.target.dataset.bg) {
      setSel(null);
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    }
  };
  const onMove = (e) => {
    if (drawing) { moveDraw(e); return; }
    if (panRef.current) {
      setView(v => ({ ...v, x: panRef.current.ox + (e.clientX - panRef.current.sx), y: panRef.current.oy + (e.clientY - panRef.current.sy) }));
    }
    if (dragRef.current) {
      const w = toWorld(e);
      updCard(dragRef.current.id, { x: w.x - dragRef.current.dx, y: w.y - dragRef.current.dy });
    }
  };
  const onUp = () => { panRef.current = null; dragRef.current = null; if (drawing) endDraw(); };
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0012;
    setView(v => {
      const nz = Math.min(2.5, Math.max(0.25, v.z + delta));
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      return { z: nz, x: mx - (mx - v.x) * (nz / v.z), y: my - (my - v.y) * (nz / v.z) };
    });
  };

  const startCardDrag = (e, card) => {
    if (tool !== "select") return;
    e.stopPropagation();
    setSel(card.id);
    const w = toWorld(e);
    dragRef.current = { id: card.id, dx: w.x - card.x, dy: w.y - card.y };
  };

  // DESENHO
  const startDraw = (e) => { const w = toWorld(e); setDrawing(true); setCurStroke({ id: uid(), pts: [[w.x, w.y]], cor: C.lima, width: 2.5 }); };
  const moveDraw = (e) => { if (!curStroke) return; const w = toWorld(e); setCurStroke(s => ({ ...s, pts: [...s.pts, [w.x, w.y]] })); };
  const endDraw = () => { if (curStroke && curStroke.pts.length > 1) updateStrokes([...strokes, curStroke]); setDrawing(false); setCurStroke(null); };

  // ÁUDIO
  const toggleRec = async () => {
    if (recording) { mediaRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => { addCard("audio", { audio: reader.result, w: 200, h: 70 }); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { alert("Não foi possível acessar o microfone."); }
  };

  // IA
  const rodarIA = async (modo) => {
    const ideias = cards.filter(c => c.texto || c.tipo === "imagem" || c.tipo === "link")
      .map(c => c.tipo === "imagem" ? `[imagem: ${c.url}]` : c.tipo === "link" ? `[link: ${c.url}]` : c.texto).filter(Boolean).join("\n- ");
    if (!ideias && !aiInstr) { alert("Adicione algumas ideias ou escreva uma instrução primeiro."); return; }
    setAiLoading(true);
    try {
      const r = await fetch("/.netlify/functions/brainstorm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideias: "- " + ideias, modo, instrucao: aiInstr }),
      });
      const data = await r.json();
      if (data.error) { alert("Erro: " + data.error); setAiLoading(false); return; }
      const novos = (data.cards || []).map((c, i) => ({
        id: uid(), tipo: "ideia", texto: c.texto, cor: c.cor || "lima",
        x: 80 + (i % 3) * 210, y: 80 + Math.floor(i / 3) * 150, w: 190, h: 130, _ia: true,
      }));
      updateCards([...cards, ...novos]);
      setAiInstr("");
    } catch (e) { alert("Erro ao conectar com a IA."); }
    setAiLoading(false);
  };

  if (loading) return <div className="st-wrap"><style>{STYLE}</style><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>Carregando estúdio…</div></div>;

  return (
    <div className="st-wrap">
      <style>{STYLE}</style>

      {/* TOPBAR */}
      <div className="st-topbar">
        {onBack && <button onClick={onBack} style={{ color: C.lima, fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>‹</button>}
        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: C.lima, letterSpacing: ".06em" }}>ESTÚDIO</span>
        <select value={boardId || ""} onChange={e => trocarBoard(e.target.value)} style={{ background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 7, padding: "6px 10px", fontSize: 13, fontFamily: "inherit", maxWidth: 200 }}>
          {boards.length === 0 && <option>— sem boards —</option>}
          {boards.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
        <button className="st-btn" onClick={novoBoard} style={{ background: "#222", color: C.lima, border: "1px solid #333" }}>+ Board</button>
        {board && <button className="st-btn" onClick={delBoard} style={{ background: "none", color: "#888", fontSize: 12 }}>🗑</button>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#666" }}>{Math.round(view.z * 100)}%</span>
        <button className="st-tool" onClick={() => setView({ x: 0, y: 0, z: 1 })} title="Resetar vista">⊙</button>
      </div>

      {/* TOOLBAR FLUTUANTE */}
      {board && <div style={{ position: "absolute", left: 14, top: 66, zIndex: 95, display: "flex", flexDirection: "column", gap: 7, background: "rgba(14,14,12,.9)", padding: 8, borderRadius: 12, border: "1px solid #2A2A2A" }}>
        <div className={"st-tool" + (tool === "select" ? " active" : "")} onClick={() => setTool("select")} title="Selecionar/mover">✋</div>
        <div className="st-tool" onClick={() => addCard("nota")} title="Nota de texto">📝</div>
        <div className="st-tool" onClick={() => addCard("postit")} title="Post-it">🟨</div>
        <div className="st-tool" onClick={addImagem} title="Imagem (URL)">🖼️</div>
        <div className="st-tool" onClick={addLink} title="Link">🔗</div>
        <div className={"st-tool" + (tool === "draw" ? " active" : "")} onClick={() => setTool(tool === "draw" ? "select" : "draw")} title="Desenho livre">✏️</div>
        <div className={"st-tool" + (recording ? " active" : "")} onClick={toggleRec} title="Gravar áudio" style={recording ? { background: C.coral, borderColor: C.coral } : {}}>{recording ? "⏹" : "🎤"}</div>
        <div style={{ height: 1, background: "#333", margin: "2px 0" }} />
        <div className={"st-tool" + (aiOpen ? " active" : "")} onClick={() => setAiOpen(!aiOpen)} title="Copiloto IA">✦</div>
      </div>}

      {/* CANVAS */}
      {!board ? (
        <div style={{ position: "absolute", inset: 0, top: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Seu primeiro board</div>
          <div style={{ fontSize: 14, marginBottom: 20, maxWidth: 380, textAlign: "center", lineHeight: 1.5 }}>Um canvas infinito pra pensar. Jogue ideias, imagens, referências — e deixe a IA expandir com você.</div>
          <button className="st-btn" onClick={novoBoard} style={{ background: C.lima, color: "#000", fontSize: 15, padding: "12px 24px" }}>+ Criar board</button>
        </div>
      ) : (
        <div ref={canvasRef} className={"st-canvas" + (panRef.current ? " panning" : "")} data-bg="1"
          onMouseDown={onCanvasDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel}
          style={{ cursor: tool === "draw" ? "crosshair" : undefined }}>
          <div style={{ position: "absolute", transformOrigin: "0 0", transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, width: 0, height: 0 }}>

            {/* SVG desenhos */}
            <svg style={{ position: "absolute", overflow: "visible", pointerEvents: "none", width: 1, height: 1 }}>
              {strokes.map(s => <polyline key={s.id} points={s.pts.map(p => p.join(",")).join(" ")} fill="none" stroke={s.cor} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />)}
              {curStroke && <polyline points={curStroke.pts.map(p => p.join(",")).join(" ")} fill="none" stroke={curStroke.cor} strokeWidth={curStroke.width} strokeLinecap="round" strokeLinejoin="round" />}
            </svg>

            {/* CARDS */}
            {cards.map(card => (
              <div key={card.id} className={"st-card" + (sel === card.id ? " sel" : "")}
                style={{ left: card.x, top: card.y, width: card.w, height: card.h, background: CORES[card.cor] || "#fff", border: `1.5px solid ${CORES_BORDA[card.cor] || "#E3E1D9"}`, transform: card.tipo === "postit" ? "rotate(-1.2deg)" : "none" }}
                onMouseDown={e => startCardDrag(e, card)}>

                {card.tipo === "imagem" ? (
                  <img src={card.url} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, pointerEvents: "none" }} onError={e => { e.target.style.display = "none"; }} />
                ) : card.tipo === "link" ? (
                  <a href={card.url} target="_blank" rel="noreferrer" style={{ display: "block", padding: 12, color: C.azul, fontSize: 13, wordBreak: "break-all", textDecoration: "none" }} onMouseDown={e => e.stopPropagation()}>🔗 {card.texto}</a>
                ) : card.tipo === "audio" ? (
                  <audio controls src={card.audio} style={{ width: "100%", marginTop: 22 }} onMouseDown={e => e.stopPropagation()} />
                ) : (
                  <textarea className="st-ta" value={card.texto} placeholder={card.tipo === "postit" ? "Anote…" : card._ia ? "✦ ideia da IA" : "Escreva…"}
                    style={{ fontFamily: card.tipo === "postit" ? NOTE_FONT : "inherit", fontSize: card.tipo === "postit" ? 18 : 14, fontWeight: card.tipo === "postit" ? 600 : 400 }}
                    onMouseDown={e => e.stopPropagation()} onChange={e => updCard(card.id, { texto: e.target.value })} />
                )}

                {sel === card.id && (
                  <div style={{ position: "absolute", top: -34, left: 0, display: "flex", gap: 4, background: "#0E0E0C", padding: 4, borderRadius: 7, boxShadow: "0 4px 12px rgba(0,0,0,.4)" }} onMouseDown={e => e.stopPropagation()}>
                    {["lima", "verde", "azul", "coral", "creme", "branco"].map(cor => (
                      <button key={cor} onClick={() => updCard(card.id, { cor })} style={{ width: 18, height: 18, borderRadius: "50%", background: CORES[cor], border: card.cor === cor ? `2px solid ${C.lima}` : "1px solid #555", cursor: "pointer" }} />
                    ))}
                    <button onClick={() => delCard(card.id)} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 14, marginLeft: 2 }}>🗑</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAINEL IA */}
      {aiOpen && board && (
        <div className="st-ai-panel">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: C.lima, fontSize: 15 }}>✦ COPILOTO CRIATIVO</span>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 10, lineHeight: 1.4 }}>A IA lê as ideias do board e gera novos cards. Escolha um modo:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
              {[["expandir", "🌱 Expandir"], ["conectar", "🔗 Conectar"], ["provocar", "⚡ Provocar"], ["aterrissar", "🎯 Aterrissar"]].map(([m, l]) => (
                <button key={m} className="st-btn" disabled={aiLoading} onClick={() => rodarIA(m)} style={{ background: "#222", color: "#fff", border: "1px solid #333", fontSize: 12, padding: "9px 6px" }}>{l}</button>
              ))}
            </div>
            <input value={aiInstr} onChange={e => setAiInstr(e.target.value)} placeholder="Instrução específica (opcional)…" style={{ width: "100%", background: "#1a1a18", border: "1px solid #333", borderRadius: 7, padding: "9px 11px", color: "#fff", fontSize: 13, fontFamily: "inherit", marginBottom: 10 }} />
            {aiLoading && <div style={{ textAlign: "center", color: C.lima, fontSize: 13, padding: 8 }}>✦ pensando…</div>}
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>💡 Os cards gerados aparecem no canto superior do canvas com borda colorida.</div>
          </div>
        </div>
      )}
    </div>
  );
}
