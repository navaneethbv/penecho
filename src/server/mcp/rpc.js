"use strict";
const {INSTRUCTIONS,PROMPTS,PROTOCOL_VERSION,promptResult,captureToolResult}=require("./protocol.js");
const {TOOLS,validateToolArguments}=require("./schema.js");
const {RESOURCES,readResource}=require("./resources.js");
const {getAuthoringGuidance}=require("./authoring-guidance.js");
const normal=value=>({content:[{type:"text",text:JSON.stringify(value)}],structuredContent:value});
function createMcpRpc({callTool,toolFailure,instructions=INSTRUCTIONS,tools=TOOLS}) {
  async function rpc(body, session, signal) {
    const result = value => ({jsonrpc:'2.0',id:body.id,result:value});
    const error = (code, message) => ({jsonrpc:'2.0',id:body.id,error:{code,message}});
    switch (body.method) {
      case 'initialize': return result({protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{listChanged:false},prompts:{listChanged:false},resources:{subscribe:false,listChanged:false}},serverInfo:{name:'PenEcho',version:'1.0.0'},instructions});
      case 'ping': return result({});
      case 'tools/list': return result({tools});
      case 'prompts/list': return result({prompts:PROMPTS});
      case 'resources/list': return result({resources:RESOURCES});
      case 'resources/templates/list': return result({resourceTemplates:[]});
      case 'prompts/get': try { return result(promptResult(body.params?.name, body.params?.arguments || {})); } catch (e) { return error(-32602,e.message); }
      case 'resources/read': try { return result(readResource(body.params?.uri,PROMPTS)); } catch (e) { return error(e.code || -32602,e.message); }
      case 'tools/call': {
        try {
          const name = body.params?.name, args = body.params?.arguments ?? {};
          if (typeof name !== 'string' || !args || typeof args !== 'object' || Array.isArray(args)) return error(-32602,'Invalid params');
          const value = name === 'penecho_get_guidance' ? getAuthoringGuidance(validateToolArguments(name,args).id, args.detail) : await callTool(session.ownerId,name,args,{signal});
          return result(value?.image ? captureToolResult(value) : normal(value));
        } catch (e) { return result({...normal(toolFailure(e)),isError:true}); }
      }
      default: return error(-32601,'Method not found');
    }
  }
return rpc;
}
module.exports={createMcpRpc};
