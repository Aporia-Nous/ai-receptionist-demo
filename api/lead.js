const REQ=['business','industry','want','pain','when','name','contact'];
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  if(b.hp)return res.status(200).json({ok:true});
  const miss=REQ.filter(k=>!String(b[k]||'').trim());
  if(miss.length)return res.status(400).json({error:'missing',fields:miss});
  const kind=b.kind==='custom'?'Custom agent':'Virtual demo';
  const rows=[['Type',kind],['Status','Demo requested - prep needed'],['Business',b.business],['Industry',b.industry],['Agent type picked',b.agentType],['What they want',b.want],['Current call pain',b.pain],['Preferred demo time (CT)',b.when],['Name',b.name],['Contact',b.contact],['Website',b.website],['Phone',b.phone],['Booking tool',b.booking],['Call volume',b.volume],['Voice picked',b.voice],['Submitted',new Date().toLocaleString('en-US',{timeZone:'America/Chicago'})+' CT']];
  const text=rows.map(([k,v])=>`${k}: ${v||'-'}`).join('\n');
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
    from:'Aporia Nous Demo <'+(process.env.ALERT_FROM||'alerts@example.com')+'>',to:[process.env.ALERT_TO||'owner@example.com'],
    subject:`[Aporia Lead] ${kind}: ${b.business} (${b.industry})`,
    headers:{'X-Aporia-Lead':'demo-app'},text,
    html:'<table>'+rows.map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td>${esc(v||'-')}</td></tr>`).join('')+'</table>'})});
  if(!r.ok)return res.status(502).json({error:'send failed'});
  if(process.env.SHEET_WEBHOOK){try{await fetch(process.env.SHEET_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(rows))})}catch(e){}}
  return res.status(200).json({ok:true});
}
