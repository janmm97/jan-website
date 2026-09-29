const DATABASE_ID='3ea7c1c329e28037a93dc62d06f5d75b';
const VERSION='2025-09-03';

// No visitor details, tokens or upstream response bodies are logged.
export async function handleVisitor(request,env,fetcher=fetch){
 const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origin&&allowed.includes(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});
 const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(!origin||!allowed.includes(origin))return respond(403,{error:'Origin not allowed.'});
 if(new URL(request.url).pathname!=='/api/visitors')return respond(404,{error:'Not found.'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return respond(405,{error:'Use POST.'});
 if(!env.NOTION_KEY)return respond(503,{error:'Registration is not configured.'});
 if(!env.VISITOR_LIMITER)return respond(503,{error:'Registration is not configured.'});
 try{
  const limit=await env.VISITOR_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
  if(!limit.success)return respond(429,{error:'Try again in a minute.'});
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return respond(415,{error:'Use JSON.'});
  if(Number(request.headers.get('Content-Length'))>4096)return respond(413,{error:'Request too large.'});
  const reader=request.body?.getReader();let size=0,parts=[];
  if(!reader)return respond(400,{error:'Missing request.'});
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return respond(413,{error:'Request too large.'})}parts.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length}
  let body;try{body=JSON.parse(new TextDecoder().decode(bytes))}catch{return respond(400,{error:'Invalid JSON.'})}
  if(!body||typeof body!=='object')return respond(400,{error:'Invalid submission.'});
  const name=typeof body.fullName==='string'?body.fullName.trim():'',email=typeof body.email==='string'?body.email.trim():'';
  if(body.website)return respond(400,{error:'Invalid submission.'});
  if(!name||name.length>120||/[\u0000-\u001f\u007f]/.test(name)||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond(400,{error:'Enter a full name and valid email.'});
  const deadline=AbortSignal.timeout(10000);
  const notion=async(path,options={})=>{
   const response=await fetcher('https://api.notion.com/v1/'+path,{...options,headers:{Authorization:'Bearer '+env.NOTION_KEY,'Notion-Version':VERSION,'Content-Type':'application/json'},signal:deadline});
   if(!response.ok)throw new Error('Notion request failed');return response.json();
  };
  let sourceId=env.NOTION_DATA_SOURCE_ID;
  if(!sourceId){
   const database=await notion('databases/'+(env.NOTION_DATABASE_ID||DATABASE_ID));
   if(database.data_sources?.length!==1)throw new Error('Choose a data source explicitly');
   sourceId=database.data_sources[0].id;
  }
  const source=await notion('data_sources/'+sourceId),properties=source.properties||{};
  const title=Object.entries(properties).filter(([,p])=>p.type==='title');
  const emails=Object.entries(properties).filter(([key,p])=>env.NOTION_EMAIL_PROPERTY?key===env.NOTION_EMAIL_PROPERTY:p.type==='email');
  if(title.length!==1||emails.length!==1||!['email','rich_text'].includes(emails[0][1].type))throw new Error('Unsupported database schema');
  const emailProperty=emails[0][1].type==='email'?{email}:{rich_text:[{text:{content:email}}]};
  // One row per email (Notion's equals is case-insensitive). A returning visitor gets the same reply as a new one, so the endpoint never reveals who has visited.
  const existing=await notion('data_sources/'+sourceId+'/query',{method:'POST',body:JSON.stringify({filter:{property:emails[0][0],[emails[0][1].type]:{equals:email}},page_size:1})});
  if(!Array.isArray(existing.results))throw new Error('Lookup not confirmed');
  if(existing.results.length)return respond(201,{saved:true});
  const page=await notion('pages',{method:'POST',body:JSON.stringify({parent:{type:'data_source_id',data_source_id:sourceId},properties:{[title[0][0]]:{title:[{text:{content:name}}]},[emails[0][0]]:emailProperty}})});
  if(page.object!=='page'||!page.id)throw new Error('Save not confirmed');
  return respond(201,{saved:true});
 }catch{return respond(502,{error:'Unable to save right now. Please try again.'})}
}
export default {fetch(request,env){return handleVisitor(request,env)}};
