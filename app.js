const KEY="rauda_demo_v2";let db=JSON.parse(localStorage.getItem(KEY)||"null")||{clients:[{id:1,name:"Carlos Martínez",phone:"9991-2345"},{id:2,name:"José López",phone:"9876-4321"}],credits:[{id:101,client:"Carlos Martínez",customerNo:"C001",motorcycle:"Bajaj Boxer 150",price:34000,down:5000,principal:29000,rate:24,term:24,interest:6960,total:35960,paid:3600,status:"Activo"},{id:102,client:"José López",customerNo:"C002",motorcycle:"Italika FT125",price:26000,down:6000,principal:20000,rate:20,term:20,interest:4000,total:24000,paid:2400,status:"Activo"}],payments:[],motos:[{model:"Bajaj Boxer 150",chassis:"DEMO-001",engine:"MOTOR-DEMO-001",cost:27000,status:"Disponible"},{model:"Italika FT125",chassis:"DEMO-002",engine:"MOTOR-DEMO-002",cost:21000,status:"Financiada"}],cash:{open:false,opening:0,movements:[]}};function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function ensureCustomerNumbers(){
 db.credits.forEach(c=>{
  if(!c.customerNo){
   if(c.client==="Carlos Martínez") c.customerNo="C001";
   else if(c.client==="José López") c.customerNo="C002";
   else {
    const existing=db.credits.find(x=>x!==c&&x.client===c.client&&x.customerNo);
    if(existing) c.customerNo=existing.customerNo;
    else c.customerNo="C"+String(100+Number(c.id||0)%900).padStart(3,"0");
   }
  }
 });
}
ensureCustomerNumbers();save();const money=n=>"L "+Number(n||0).toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});const $=s=>document.querySelector(s);const content=$("#content");const names={inicio:"Resumen del negocio",creditos:"Créditos",cobros:"Registrar abono",clientes:"Clientes",caja:"Caja",reportes:"Reportes"};let view="inicio";function card(label,val,sub=""){return `<div class="card accent"><span>${label}</span><strong>${val}</strong><small class="muted">${sub}</small></div>`}function table(headers,rows){return `<div class="tablewrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows||""}</tbody></table></div>`}function render(){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#heading").textContent=names[view];let outstanding=db.credits.reduce((s,c)=>s+c.total-c.paid,0);if(view==="inicio"){content.innerHTML=`<div class="cards">${card("Cartera pendiente",money(outstanding),"Saldo contractual estimado")}${card("Créditos activos",db.credits.length,"En seguimiento")}${card("Abonos registrados",money(db.payments.reduce((s,p)=>s+p.amount,0)),"En este dispositivo")}</div><div class="panel"><h2>Créditos recientes</h2>${table(["Cliente","Motocicleta","Total del contrato","Abonado","Saldo","Estado"],db.credits.map(c=>`<tr><td>${c.client}</td><td>${c.motorcycle}</td><td>${money(c.total)}</td><td>${money(c.paid)}</td><td>${money(c.total-c.paid)}</td><td><span class="status">${c.status}</span></td></tr>`).join(""))}</div><div class="panel"><h2>Acciones rápidas</h2><div class="quick"><button class="primary" onclick="openCredit()">+ Crear crédito</button><button class="secondary" onclick="setView('cobros')">Registrar abono</button><button class="secondary" onclick="setView('caja')">Abrir caja</button></div></div>`}else if(view==="creditos"){content.innerHTML=`<div class="panel"><div class="rowactions"><button class="primary" onclick="openCredit()">+ Nuevo crédito</button><button class="secondary" onclick="exportData()">Exportar respaldo JSON</button></div><br>${table(["ID","N.º cliente","Cliente","Moto / modelo","Chasis","Serie motor","Capital","Interés fijo","Plazo","Cuota mensual","Total","Abonado","Saldo","Documento",...(activeUser&&["admin_general","admin"].includes(activeUser.role)?["Acciones"]:[])],db.credits.map(c=>`<tr><td>#${c.id}</td><td>${c.customerNo||"—"}</td><td>${c.client}</td><td>${c.motorcycle}</td><td>${c.chassis||"—"}</td><td>${c.engine||"—"}</td><td>${money(c.principal)}</td><td>${c.rate}%</td><td>${c.term} meses</td><td><strong>${money(c.monthly||c.total/c.term)}</strong></td><td>${money(c.total)}</td><td>${money(c.paid)}</td><td>${money(c.total-c.paid)}</td><td><button class="secondary" onclick="printContract(${c.id})">Contrato / plan</button></td>${activeUser&&["admin_general","admin"].includes(activeUser.role)?`<td><div class="rowactions"><button class="secondary" onclick="editCredit(${c.id})">Editar</button>${activeUser.role==="admin_general"?`<button class="danger" onclick="deleteCredit(${c.id})">Borrar</button>`:""}</div></td>`:""}</tr>`).join(""))}</div>`}else if(view==="cobros"){content.innerHTML=`<div class="panel"><h2>Registrar abono</h2><form id="payForm"><label>Crédito<select name="credit" required>${db.credits.map(c=>`<option value="${c.id}">#${c.id} · ${c.client} · saldo ${money(c.total-c.paid)}</option>`).join("")}</select></label><div class="twocol"><label>Monto recibido (L)<input name="amount" type="number" min=".01" step=".01" required></label><label>Método<select name="method"><option>Efectivo</option><option>Transferencia</option><option>Depósito</option><option>Otro</option></select></label></div><label>Nota / referencia<input name="note" placeholder="Referencia opcional"></label><button class="primary" type="submit">Guardar abono en este dispositivo</button></form></div><div class="panel"><h2>Historial de abonos</h2>${table(["Fecha","Cliente","Monto","Método","Nota"],db.payments.map(p=>`<tr><td>${p.date}</td><td>${p.client}</td><td>${money(p.amount)}</td><td>${p.method}</td><td>${p.note||"—"}</td></tr>`).join(""))}</div>`;$("#payForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target),c=db.credits.find(x=>x.id===Number(f.get("credit"))),amt=Number(f.get("amount"));if(!c||amt>c.total-c.paid){alert("El abono supera el saldo pendiente.");return}c.paid+=amt;db.payments.unshift({date:new Date().toLocaleDateString("es-HN"),creditId:c.id,client:c.client,amount:amt,method:f.get("method"),note:f.get("note")});db.cash.movements.push({type:"Ingreso",amount:amt,note:"Abono "+c.client});save();render();alert("Abono de prueba guardado localmente.")}}else if(view==="clientes"){content.innerHTML=`<div class="panel"><h2>Clientes registrados</h2>${table(["Cliente","Teléfono","Créditos"],db.clients.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${db.credits.filter(x=>x.client===c.name).length}</td></tr>`).join(""))}<form id="clientForm"><div class="twocol"><label>Nombre<input name="name" required></label><label>Teléfono<input name="phone"></label></div><button class="primary">Agregar cliente</button></form></div>`;$("#clientForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);db.clients.push({id:Date.now(),name:f.get("name"),phone:f.get("phone")});save();render()}}else if(view==="motos"){content.innerHTML=`<div class="panel"><h2>Inventario</h2>${table(["Motocicleta","N.º de chasis","N.º/serie de motor","Costo","Estado"],db.motos.map(m=>`<tr><td>${m.model}</td><td>${m.chassis}</td><td>${m.engine||"No registrado"}</td><td>${money(m.cost)}</td><td><span class="status ${m.status==="Disponible"?"ok":""}">${m.status}</span></td></tr>`).join(""))}<form id="motoForm"><div class="twocol"><label>Marca / modelo<input name="model" required></label><label>Número de chasis<input name="chassis" required></label></div><div class="twocol"><label>Número o serie de motor<input name="engine" required></label><label>Costo (L)<input name="cost" type="number" required></label><label>Estado<select name="status"><option>Disponible</option><option>Reservada</option><option>Financiada</option></select></label></div><button class="primary">Agregar motocicleta</button></form></div>`;$("#motoForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);if(db.motos.some(m=>String(m.chassis).trim().toUpperCase()===String(f.get("chassis")).trim().toUpperCase())){alert("Ya existe una motocicleta con ese número de chasis.");return}if(db.motos.some(m=>m.engine&&String(m.engine).trim().toUpperCase()===String(f.get("engine")).trim().toUpperCase())){alert("Ya existe una motocicleta con ese número de motor.");return}db.motos.push({model:f.get("model"),chassis:f.get("chassis").trim(),engine:f.get("engine").trim(),cost:Number(f.get("cost")),status:f.get("status")});save();render()}}else if(view==="caja"){let total=db.cash.opening+db.cash.movements.reduce((s,m)=>s+(m.type==="Gasto"?-m.amount:m.amount),0);content.innerHTML=`<div class="cards">${card("Estado",db.cash.open?"Caja abierta":"Caja cerrada","Demo: un dispositivo")}${card("Fondo inicial",money(db.cash.opening))}${card("Movimientos",db.cash.movements.length)}${card("Efectivo esperado",money(total))}</div><div class="panel"><h2>Sesión de caja</h2>${db.cash.open?`<p>Caja abierta. Efectivo esperado: <b>${money(total)}</b></p><button class="primary" id="closeCash">Cerrar caja de prueba</button>`:`<form id="openCash"><label>Fondo inicial (L)<input name="opening" type="number" min="0" required value="0"></label><button class="primary">Abrir caja de prueba</button></form>`}</div><div class="panel"><h2>Movimientos</h2>${table(["Tipo","Monto","Detalle"],db.cash.movements.map(m=>`<tr><td>${m.type}</td><td>${money(m.amount)}</td><td>${m.note}</td></tr>`).join(""))}</div>`;if($("#openCash"))$("#openCash").onsubmit=e=>{e.preventDefault();db.cash.open=true;db.cash.opening=Number(new FormData(e.target).get("opening"));save();render()};if($("#closeCash"))$("#closeCash").onclick=()=>{db.cash.open=false;save();render();alert("Caja de prueba cerrada.")}}else{content.innerHTML=`<div class="cards">${card("Capital financiado",money(db.credits.reduce((s,c)=>s+c.principal,0)))}${card("Interés contractual",money(db.credits.reduce((s,c)=>s+c.interest,0)))}${card("Cobrado",money(db.credits.reduce((s,c)=>s+c.paid,0)))}${card("Saldo pendiente",money(outstanding))}</div><div class="panel"><h2>Resumen por crédito</h2>${table(["Cliente","Capital","Interés fijo","Total","Pagado","Pendiente"],db.credits.map(c=>`<tr><td>${c.client}</td><td>${money(c.principal)}</td><td>${money(c.interest)}</td><td>${money(c.total)}</td><td>${money(c.paid)}</td><td>${money(c.total-c.paid)}</td></tr>`).join(""))}<button class="secondary" onclick="exportData()">Descargar respaldo local</button></div>`}}
function setView(v){view=v;render()}document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>setView(b.dataset.view));let editingCreditId=null;
function openCredit(){editingCreditId=null;const form=$("#creditForm");form.reset();form.elements.down.value=5000;form.elements.rate.value=24;form.elements.term.value=24;$("#creditModalTitle").textContent="Nuevo crédito";$("#creditFormSubmit").textContent="Crear crédito";$("#modal").showModal();updateMonthlyPreview()}
function editCredit(id){
 if(!activeUser||!["admin_general","admin"].includes(activeUser.role)){alert("No tienes permiso para editar créditos.");return}
 const c=db.credits.find(x=>x.id===Number(id));if(!c)return;
 editingCreditId=c.id;const f=$("#creditForm");
 for(const k of ["client","motorcycle","chassis","engine","price","down","rate","term"]) f.elements[k].value=c[k]??"";
 $("#creditModalTitle").textContent="Editar crédito #"+c.id;$("#creditFormSubmit").textContent="Guardar cambios";$("#modal").showModal();updateMonthlyPreview();
}
window.editCredit=editCredit;
$("#newCreditBtn").onclick=openCredit;$("#closeModal").onclick=()=>{$("#modal").close();editingCreditId=null};
$("#creditForm").onsubmit=e=>{
 e.preventDefault();let f=new FormData(e.target),price=Number(f.get("price")),down=Number(f.get("down")),rate=Number(f.get("rate")),term=Number(f.get("term"));
 if(down>price){alert("La prima no puede superar el precio.");return}
 let principal=price-down,interest=principal*rate/100,total=principal+interest,monthly=Math.round((total/term)*100)/100;
 if(editingCreditId!==null){
   const c=db.credits.find(x=>x.id===editingCreditId);if(!c)return;
   if(total<c.paid){alert("El total del contrato no puede ser menor que los abonos ya registrados.");return}
   const oldClient=c.client;Object.assign(c,{client:f.get("client").trim(),motorcycle:f.get("motorcycle").trim(),chassis:f.get("chassis").trim(),engine:f.get("engine").trim(),price,down,principal,rate,term,interest,total,monthly,status:total-c.paid<0.01?"Cancelado":"Activo"});
   db.payments.forEach(p=>{if(p.creditId===c.id)p.client=c.client});
   if(!db.clients.some(x=>x.name===c.client))db.clients.push({id:Date.now(),name:c.client,phone:""});
   save();$("#modal").close();e.target.reset();editingCreditId=null;view="creditos";render();alert("Crédito actualizado. Revisa el contrato y el plan de pagos.");return;
 }
 const clientName=f.get("client").trim();
 let customerRecord=db.credits.find(x=>x.client===clientName&&x.customerNo);
 let customerNo=customerRecord?.customerNo;
 if(!customerNo){
  const used=new Set(db.credits.map(x=>String(x.customerNo||"").toUpperCase()));
  let n=1;while(used.has("C"+String(n).padStart(3,"0")))n++;
  customerNo="C"+String(n).padStart(3,"0");
 }
 let c={id:Date.now(),customerNo,client:clientName,motorcycle:f.get("motorcycle").trim(),chassis:f.get("chassis").trim(),engine:f.get("engine").trim(),price,down,principal,rate,term,interest,total,monthly,paid:0,status:"Activo"};
 db.credits.unshift(c);if(!db.clients.some(x=>x.name===c.client))db.clients.push({id:Date.now()+1,name:c.client,phone:""});save();$("#modal").close();e.target.reset();updateMonthlyPreview();view="creditos";render();
};
function printContract(id){
 const c=db.credits.find(x=>x.id===Number(id));if(!c)return;
 const monthly=c.total/c.term;const fmt=n=>"L "+Number(n).toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2});
 const start=new Date();start.setDate(1);start.setMonth(start.getMonth()+1);
 const rows=Array.from({length:c.term},(_,i)=>{let d=new Date(start);d.setMonth(start.getMonth()+i);let date=d.toLocaleDateString("es-HN",{day:"2-digit",month:"2-digit",year:"numeric"});let installment=i===c.term-1?c.total-monthly*(c.term-1):monthly;return `<tr><td>${i+1}</td><td>${date}</td><td>${fmt(installment)}</td><td>____________</td></tr>`}).join("");
 const w=window.open("","_blank");if(!w){alert("El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir el contrato.");return}
 w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato Rauda #${c.id}</title><style>body{font:13px Arial;color:#222;margin:28px;line-height:1.45}h1{font-size:22px;margin:0;color:#17191d}h2{font-size:15px;border-bottom:2px solid #f47721;padding-bottom:5px;margin-top:22px}.brand{border-bottom:4px solid #f47721;padding-bottom:12px;display:flex;justify-content:space-between;align-items:center}.tag{color:#b8510a;font-weight:bold}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.field{border-bottom:1px solid #aaa;padding:6px 0}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0}.box{border:1px solid #ddd;padding:10px}.box b{display:block;font-size:15px;margin-top:5px}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{border:1px solid #bbb;padding:7px;text-align:left}th{background:#fff0e5}.small{font-size:10px;color:#555}.sign{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:55px}.line{border-top:1px solid #333;text-align:center;padding-top:6px}@media print{body{margin:12mm}button{display:none}}</style></head><body><div class="brand"><div><h1>TALLER Y MOTOREPUESTOS RAUDA</h1><div class="tag">CONTRATO DE FINANCIAMIENTO Y COTIZACIÓN</div></div><div><b>Documento de prueba #${c.id}</b><br>Fecha: ${new Date().toLocaleDateString("es-HN")}</div></div>
 <h2>1. Datos de las partes</h2><div class="grid"><div class="field">Vendedor/acreedor: __________________________________</div><div class="field">Identidad/R.T.N.: __________________________________</div><div class="field">Comprador/deudor: ${c.client}</div><div class="field">Identidad: __________________________________</div><div class="field">Domicilio: __________________________________</div><div class="field">Teléfono: __________________________________</div></div>
 <h2>2. Identificación de la motocicleta</h2><div class="grid"><div class="field">Marca y modelo: ${c.motorcycle}</div><div class="field">Año/color: __________________________________</div><div class="field">Número de chasis: ${c.chassis||"No registrado"}</div><div class="field">Número/serie de motor: ${c.engine||"No registrado"}</div></div>
 <h2>3. Cotización y condiciones financieras</h2><div class="summary"><div class="box">Precio inicial de venta<b>${fmt(c.price)}</b></div><div class="box">Prima / pago inicial<b>${fmt(c.down)}</b></div><div class="box">Capital financiado<b>${fmt(c.principal)}</b></div><div class="box">Interés fijo total (${c.rate}%)<b>${fmt(c.interest)}</b></div><div class="box">Total financiado a pagar<b>${fmt(c.total)}</b></div><div class="box">Mensualidad estimada (${c.term} meses)<b>${fmt(monthly)}</b></div></div>
 <p>El comprador reconoce que el precio de venta de la motocicleta es ${fmt(c.price)}, entrega una prima de ${fmt(c.down)} y financia un capital de ${fmt(c.principal)}. Se aplica un interés fijo total del ${c.rate}% para todo el plazo, equivalente a ${fmt(c.interest)}. El total contractual de cuotas es ${fmt(c.total)}, pagadero en ${c.term} mensualidades. La última cuota podrá ajustarse por redondeo. La prima se paga aparte y no está incluida en el total de cuotas.</p>
 <h2>4. Plan de pagos propuesto</h2><table><thead><tr><th>N.º</th><th>Fecha prevista</th><th>Cuota (L)</th><th>Firma/recibido</th></tr></thead><tbody>${rows}</tbody></table>
 <h2>5. Condiciones generales</h2><p>El comprador se compromete a pagar las cuotas según el calendario acordado y el vendedor entregará comprobante por cada pago. Cualquier pago anticipado, mora, garantía, seguro, gastos, procedimiento por incumplimiento y condición de traspaso deberán quedar expresamente acordados por escrito antes de firmar. No se añaden cargos por mora en esta cotización. La motocicleta y sus números de identificación deberán verificarse contra los documentos originales al momento de la entrega.</p><p>Este documento es una plantilla de cotización y borrador de contrato. Debe revisarse y completarse con las condiciones reales de la operación y validarse legalmente en Honduras antes de utilizarlo como contrato definitivo.</p>
 <div class="sign"><div class="line">Firma del vendedor / acreedor</div><div class="line">Firma del comprador / deudor</div></div><p class="small">Rauda Control de Motos 2.0 · Documento generado desde datos de demostración. Revise todos los importes y datos antes de imprimir.</p><script>window.onload=()=>window.print()</script></body></html>`);
 w.document.close();
}

function deleteCredit(id){
 if(!activeUser||activeUser.role!=="admin_general"){alert("Solo el administrador general puede borrar créditos.");return}
 const c=db.credits.find(x=>x.id===Number(id));if(!c)return;
 const linked=db.payments.filter(p=>p.creditId===c.id);
 const msg=`¿Borrar definitivamente el crédito #${c.id} de ${c.client}?\n\nSaldo: ${money(c.total-c.paid)}\nAbonos asociados que se eliminarán del historial: ${linked.length}\n\nEsta acción no se puede deshacer. Exporta un respaldo antes de continuar.`;
 if(!confirm(msg))return;
 db.credits=db.credits.filter(x=>x.id!==c.id);db.payments=db.payments.filter(p=>p.creditId!==c.id);
 save();view="creditos";render();alert("Crédito eliminado de esta demo local.");
}
window.deleteCredit=deleteCredit;
function updateMonthlyPreview(){const f=document.querySelector("#creditForm");if(!f)return;const price=Number(f.elements.price.value)||0,down=Number(f.elements.down.value)||0,rate=Number(f.elements.rate.value)||0,term=Number(f.elements.term.value)||1;const principal=Math.max(0,price-down),total=principal+(principal*rate/100);const el=document.querySelector("#monthlyPreview");if(el)el.textContent=money(total/term)}
["price","down","rate","term"].forEach(n=>{const el=document.querySelector(`#creditForm [name="${n}"]`);if(el)el.addEventListener("input",updateMonthlyPreview)});
function exportData(){let blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="respaldo-rauda-demo.json";a.click();URL.revokeObjectURL(a.href)}window.setView=setView;window.openCredit=openCredit;window.exportData=exportData;window.printContract=printContract;function network(){let n=$("#net");n.textContent=navigator.onLine?"● Con conexión":"● Sin internet · modo local";n.style.background=navigator.onLine?"#1d6d45":"#8a4d00"}window.addEventListener("online",network);window.addEventListener("offline",network);if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));network();render();save();
// --- Acceso por perfiles: prototipo local, no usar como seguridad de producción ---
const DEMO_USERS=[
 {username:"admin",password:"admin123",role:"admin_general",name:"Administrador general"},
 {username:"admin2",password:"rauda123",role:"admin",name:"Administrador de créditos"},
 {username:"caja",password:"caja123",role:"cashier",name:"Cajero"}
];
let activeUser=null;
const roleLabels={admin_general:"Administrador general",admin:"Administrador de créditos",cashier:"Cajero",client:"Cliente"};
const originalRender=render;
render=function(){
 if(activeUser&&activeUser.role==="client"){renderCustomerPortal();return}
 originalRender();
 applyRolePermissions();
};
function applyRolePermissions(){
 if(!activeUser)return;
 const role=activeUser.role;
 const allowed=role==="admin_general"?["inicio","creditos","cobros","clientes","caja","reportes","usuarios"]:
 role==="admin"?["inicio","creditos","cobros","clientes","caja","reportes"]:
 role==="cashier"?["inicio","cobros","clientes","reportes"]:[];
 document.querySelectorAll("nav button[data-view]").forEach(b=>{b.hidden=!allowed.includes(b.dataset.view)});
 const canManage=role==="admin_general"||role==="admin";
 const newBtn=document.querySelector("#newCreditBtn"); if(newBtn)newBtn.hidden=!canManage;
 const usersBtn=document.querySelector("#usersNav"); if(usersBtn)usersBtn.hidden=role!=="admin_general";
 const head=document.querySelector(".top .muted");if(head)head.textContent=`Sesión: ${activeUser.name} · ${roleLabels[role]}`;
}
function renderCustomerPortal(){
 $("#heading").textContent="Mi plan de pagos";
 $("#newCreditBtn").hidden=true;
 document.querySelectorAll("nav button[data-view]").forEach(b=>b.hidden=true);
 const c=activeUser.credit;
 const monthly=Number(c.monthly||((Number(c.total)||0)/(Number(c.term)||1)));
 const balance=Math.max(0,Number(c.total||0)-Number(c.paid||0));
 const term=Math.max(1,Number(c.term)||1);
 const paid=Math.max(0,Number(c.paid)||0);
 const schedule=Array.from({length:term},(_,i)=>{
  const due=i===term-1?Math.max(0,Number(c.total||0)-monthly*(term-1)):monthly;
  const allocated=Math.min(due,Math.max(0,paid-i*monthly));
  const pending=Math.max(0,due-allocated);
  const status=pending<0.01?"Pagada":allocated>0?"Parcial":"Pendiente";
  return `<tr><td>${i+1}</td><td>${money(due)}</td><td>${money(pending)}</td><td><span class="status ${status==="Pagada"?"ok":""}">${status}</span></td></tr>`;
 }).join("");
 content.innerHTML=`<div class="panel client-summary">
  <div class="section-intro"><p class="eyebrow">PORTAL DEL CLIENTE</p><h2>${c.client}</h2><p class="muted">Número de cliente: ${c.customerNo||"—"} · Crédito #${c.id}</p></div>
  <div class="cards">${card("Motocicleta",c.motorcycle||"—","Marca y modelo")}${card("Tiempo de financiamiento",term+" meses","Plazo acordado")}${card("Cuota mensual",money(monthly),"Cuota estimada")}${card("Deuda pendiente",money(balance),"Saldo contractual estimado")}</div>
 </div>
 <div class="panel"><div class="section-intro"><h2>Mi plan de pago</h2><p class="muted">Consulta las cuotas y el saldo pendiente de cada una.</p></div>${table(["Cuota","Importe de cuota","Pendiente","Estado"],schedule)}</div>
 <p class="small muted">La información es de demostración y se guarda en este dispositivo. Confirma cualquier saldo oficial con el administrador.</p>`;
}
function allDemoUsers(){
 const base=DEMO_USERS.concat(db.extraUsers||[]);
 return base.map(u=>({...u,...((db.userOverrides||{})[u.username]||{})}));
}
function editDemoUser(username){
 if(!activeUser||activeUser.role!=="admin_general"){alert("Solo el administrador general puede editar perfiles.");return}
 const u=allDemoUsers().find(x=>x.username===username);if(!u)return;
 const name=prompt("Nombre visible del perfil:",u.name);if(name===null)return;
 const password=prompt("Nueva contraseña de demostración (mínimo 4 caracteres):",u.password);if(password===null)return;
 if(!name.trim()||password.length<4){alert("El nombre es obligatorio y la contraseña debe tener al menos 4 caracteres.");return}
 db.userOverrides=db.userOverrides||{};db.userOverrides[username]={name:name.trim(),password};save();renderUsers();alert("Perfil actualizado en este dispositivo. Recuerda que esta demo no es segura para contraseñas reales.");
}
window.editDemoUser=editDemoUser;
function renderUsers(){
 const users=allDemoUsers();
 content.innerHTML=`<div class="panel"><div class="section-intro"><h2>Usuarios y perfiles</h2><p class="muted">Administra el nombre visible y la contraseña de las cuentas de demostración.</p></div>${table(["Usuario","Nombre visible","Perfil","Acciones"],users.map(u=>`<tr><td><strong>${u.username}</strong></td><td>${u.name}</td><td>${roleLabels[u.role]||u.role}</td><td><button class="secondary" onclick="editDemoUser(${JSON.stringify(u.username)})">Editar perfil</button></td></tr>`).join(""))}<p class="small muted">Los cambios se guardan solo en este navegador. No uses contraseñas reales; la seguridad definitiva requiere autenticación de servidor.</p></div><div class="panel"><h2>Crear usuario local</h2><form id="userForm"><div class="twocol"><label>Usuario<input name="username" required autocomplete="off"></label><label>Nombre completo<input name="name" required></label></div><div class="twocol"><label>Contraseña de prueba<input name="password" type="password" required minlength="4" autocomplete="new-password"></label><label>Perfil<select name="role"><option value="admin">Administrador de créditos</option><option value="cashier">Cajero</option></select></label></div><button class="primary">Crear usuario de prueba</button></form></div>`;
 $("#userForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);db.extraUsers=db.extraUsers||[];if(allDemoUsers().some(u=>u.username===f.get("username"))){alert("Ese usuario ya existe.");return}db.extraUsers.push({username:f.get("username"),password:f.get("password"),name:f.get("name"),role:f.get("role")});save();renderUsers();alert("Usuario de prueba creado.")};
}
const oldSetView=setView;
setView=function(v){if(!activeUser)return;if(activeUser.role==="admin_general"&&v==="usuarios"){view=v;renderUsers();$("#heading").textContent=names[v]||"Usuarios";return}if(activeUser.role==="client")return;view=v;render()};
window.setView=setView;
const oldLogout=$("#logoutBtn"); if(oldLogout)oldLogout.onclick=()=>{activeUser=null;$("#loginScreen").hidden=false;document.querySelector(".layout").hidden=true;$("#heading").textContent="Resumen del negocio"};
$("#loginRole").onchange=()=>{const client=$("#loginRole").value==="client";$("#clientFields").hidden=!client;$("#staffFields").hidden=client};
$("#loginForm").onsubmit=e=>{
 e.preventDefault();const f=new FormData(e.target),role=f.get("role");let user=null;
 if(role==="client"){
   const clientNo=String(f.get("clientNo")).trim().toUpperCase(),creditNo=Number(f.get("creditNo"));
   const c=db.credits.find(x=>Number(x.id)===creditNo && String(x.customerNo||"").toUpperCase()===clientNo);
   if(!c){alert("No coinciden el número de cliente y el número de crédito. Verifica ambos datos con el administrador.");return}
   user={role:"client",name:c.client,credit:c};
 }else{
   user=allDemoUsers().find(u=>u.username===f.get("username")&&u.password===f.get("password")&&u.role===role);
   if(!user){alert("Usuario o contraseña incorrectos. Revisa las cuentas de prueba indicadas en LEEME_ANDROID.txt.");return}
 }
 activeUser=user;$("#loginScreen").hidden=true;document.querySelector(".layout").hidden=false;
 if(role==="client"){view="inicio";render()}else{view="inicio";render()}
};
document.querySelector(".layout").hidden=true;
