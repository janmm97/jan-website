import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleVisitor} from './worker.mjs';
const env={ALLOWED_ORIGINS:'https://janmm97.github.io',NOTION_KEY:'test-token',VISITOR_LIMITER:{limit:async()=>({success:true})}};
const req=(body={fullName:'Test Visitor',email:'visitor@example.com'},extra={})=>new Request('https://test.invalid/api/visitors',{method:'POST',headers:{Origin:'https://janmm97.github.io','Content-Type':'application/json',...extra},body:JSON.stringify(body)});
const notionMock=(calls,{results=[],emailType='email'}={})=>async(url,options)=>{calls.push({url,options});return Response.json(url.includes('/databases/')?{data_sources:[{id:'source-id'}]}:url.endsWith('/query')?{object:'list',results}:url.includes('/data_sources/')?{properties:{'Full Name':{type:'title'},'Email address':{type:emailType}}}:{object:'page',id:'saved-page'})};
test('creates a Notion row using discovered title/email properties',async()=>{
 const calls=[];const response=await handleVisitor(req(),env,notionMock(calls));assert.equal(response.status,201);assert.deepEqual(await response.json(),{saved:true});
 const lookup=JSON.parse(calls[2].options.body);assert.ok(calls[2].url.endsWith('/data_sources/source-id/query'));assert.deepEqual(lookup.filter,{property:'Email address',email:{equals:'visitor@example.com'}});
 const saved=JSON.parse(calls[3].options.body);assert.equal(saved.parent.data_source_id,'source-id');assert.equal(saved.properties['Email address'].email,'visitor@example.com');assert.equal(saved.properties['Full Name'].title[0].text.content,'Test Visitor');assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://janmm97.github.io');
});
test('a returning email gets the same reply and no second row',async()=>{
 const calls=[];const response=await handleVisitor(req(),env,notionMock(calls,{results:[{object:'page',id:'earlier-visit'}]}));
 assert.equal(response.status,201);assert.deepEqual(await response.json(),{saved:true});assert.ok(!calls.some(c=>c.url.endsWith('/v1/pages')),'must not create a page');
});
test('a text email property is looked up with a rich_text filter',async()=>{
 const calls=[];const response=await handleVisitor(req(),{...env,NOTION_EMAIL_PROPERTY:'Email address'},notionMock(calls,{emailType:'rich_text'}));
 assert.equal(response.status,201);assert.deepEqual(JSON.parse(calls[2].options.body).filter,{property:'Email address',rich_text:{equals:'visitor@example.com'}});
});
test('a failed or malformed lookup never creates a row or acknowledges a save',async()=>{
 for(const lookup of [()=>Response.json({code:'restricted_resource'},{status:403}),()=>Response.json({object:'list'})]){
  const calls=[];const base=notionMock(calls);
  const response=await handleVisitor(req(),env,async(url,options)=>url.endsWith('/query')?(calls.push({url,options}),lookup()):base(url,options));
  assert.equal(response.status,502);assert.notEqual((await response.json()).saved,true);assert.ok(!calls.some(c=>c.url.endsWith('/v1/pages')),'must not create a page');
 }
});
test('rejects invalid input without calling Notion',async()=>{for(const body of [{fullName:' ',email:'a@b.com'},{fullName:'A',email:'bad'},{fullName:'A',email:'a@b.com',website:'bot'},null]){const response=await handleVisitor(req(body),env,()=>{throw Error('Must not call')});assert.equal(response.status,400)}});
test('disallowed origin, missing credentials and rate limiting fail closed',async()=>{
 assert.equal((await handleVisitor(req(undefined,{Origin:'https://evil.example'}),env)).status,403);
 assert.equal((await handleVisitor(req(),{...env,NOTION_KEY:''})).status,503);
 assert.equal((await handleVisitor(req(),{...env,VISITOR_LIMITER:{limit:async()=>({success:false})}})).status,429);
});
test('upstream failure and ambiguous schema never acknowledge a save',async()=>{
 for(const upstream of [async()=>Response.json({secret:'private'},{status:403}),async()=>Response.json({data_sources:[{id:'a'},{id:'b'}]})]){
 const response=await handleVisitor(req(),env,upstream);assert.equal(response.status,502);const body=await response.json();assert.notEqual(body.saved,true);assert.ok(!JSON.stringify(body).includes('private'));
 }});
test('oversized payload is rejected and CORS preflight needs no Notion token',async()=>{
 assert.equal((await handleVisitor(req({fullName:'x'.repeat(5000),email:'a@b.com'}),env)).status,413);
 const r=await handleVisitor(new Request('https://test.invalid/api/visitors',{method:'OPTIONS',headers:{Origin:'https://janmm97.github.io'}}),{ALLOWED_ORIGINS:env.ALLOWED_ORIGINS});assert.equal(r.status,204);
});
