import { useState, useEffect } from "react";
import Fichas from "./Fichas.jsx";

const SB_URL="https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

const STYLE=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--lima:#C5D943;--verde:#2D6E47;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaE:#888882;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif}
html,body{height:100%;font-family:var(--fb);background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
button{cursor:pointer;border:none;background:none;font-family:var(--fb)}
`;

export default function PortalCliente({clienteInfo,token,onLogout}){
  return(<>
    <style>{STYLE}</style>
    <Fichas 
      onBack={null} 
      token={token} 
      clienteId={clienteInfo.cliente_id}
      clienteNome={clienteInfo.nome_display}
      userInfo={{email:clienteInfo.email,nome:clienteInfo.nome_display}}
      onLogout={onLogout}
    />
  </>);
}
