// ═══════════════════════════════════════════════════════
// TOAST GLOBAL — feedback visual de salvar/erro
// Uso: toast("✓ Salvo")  |  toast("Erro ao salvar", "erro")
// Com dedupe: mensagens repetidas em sequência não empilham
// ═══════════════════════════════════════════════════════
let box = null;
const vivos = new Map(); // msg -> {el, timer}

export function toast(msg, tipo = "ok") {
  if (typeof document === "undefined") return;
  if (!box) {
    box = document.createElement("div");
    box.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none";
    document.body.appendChild(box);
  }
  const dur = tipo === "erro" ? 5000 : 2200;

  // dedupe: se a mesma mensagem já está na tela, só renova o tempo
  if (vivos.has(msg)) {
    const v = vivos.get(msg);
    clearTimeout(v.timer);
    v.timer = setTimeout(() => fechar(msg), dur);
    return;
  }

  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `background:${tipo === "erro" ? "#C4502B" : "#1C1D1B"};color:#fff;padding:11px 20px;border-radius:10px;font:600 13.5px/1.35 'Barlow',sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28);border-left:4px solid ${tipo === "erro" ? "#fff" : "#8FA715"};opacity:0;transition:opacity .2s,transform .2s;transform:translateY(6px);max-width:86vw;text-align:center`;
  box.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
  const timer = setTimeout(() => fechar(msg), dur);
  vivos.set(msg, { el, timer });
}

function fechar(msg) {
  const v = vivos.get(msg);
  if (!v) return;
  v.el.style.opacity = "0";
  v.el.style.transform = "translateY(6px)";
  setTimeout(() => v.el.remove(), 220);
  vivos.delete(msg);
}
