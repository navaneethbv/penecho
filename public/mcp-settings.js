(() => {
  'use strict';
  const root=document.getElementById('mcpCloudSettings');if(!root)return;
  let mounted=null,active='cloud',connection={enabled:false,connected:false},deviceStatus=null;
  const cloud=()=>window.PENECHO_CONFIG?.runtime==='cloud';
  function language(){return document.documentElement.lang||'en';}
  const localAvailable=()=>!cloud()||window.PENECHO_REMOTE_CLOUD_STATUS?.deviceOnline===true;
  function select(value,{refresh=true}={}) {
    const wasLocal=active==='local';
    active=value==='local'&&localAvailable()?'local':'cloud';
    const help=document.getElementById('mcpLocalCloudHelp'),zh=language().startsWith('zh');
    help.hidden=!cloud();document.querySelector('#mcpLocalPanel > .mcp-panel').hidden=cloud();
    help.querySelector('h2').textContent=zh?'在本机配置本地 MCP':'Set up local MCP on your computer';
    help.querySelectorAll('p')[0].textContent=zh?'在本机 PenEcho 中打开「设置 → MCP → 本地 MCP」，复制安装提示词给你的编程助手。本地 MCP 和本地模型 API 无需注册或登录。':'Open Settings → MCP → Local MCP in PenEcho on your computer, then copy its installation prompt to your coding assistant. Local MCP and local model APIs work without an account.';
    help.querySelectorAll('p')[1].textContent=zh?'已有云端 MCP 连接时，在本机开启「云端 MCP」即可操作本地画布，无需再配置一个 MCP。启用 Linked Device 后，本地 MCP 也能与这里打开的云端画布交互。':'With an existing Cloud MCP connection, enable Cloud MCP on your computer to reach its local Canvas without another client configuration. Linked Device also lets your local MCP work with the Cloud Canvas open here.';
    for(const kind of ['cloud','local']) {
      const id=kind==='cloud'?'Cloud':'Local',button=document.getElementById(`mcp${id}Tab`),panel=document.getElementById(`mcp${id}Panel`);
      button.hidden=kind==='local'&&!localAvailable();
      button.textContent=language().startsWith('zh')?(kind==='cloud'?'云端 MCP':'本地 MCP'):(kind==='cloud'?'Cloud MCP':'Local MCP');
      button.setAttribute('aria-selected',String(kind===active));button.setAttribute('aria-pressed',String(kind===active));button.tabIndex=kind===active?0:-1;panel.hidden=kind!==active;
    }
    if(wasLocal&&active==='cloud'&&document.activeElement===document.getElementById('mcpLocalTab'))document.getElementById('mcpCloudTab').focus();
    if(refresh&&active==='cloud'&&!document.getElementById('settingsPageMcp').hidden)open();
  }
  function open() {
    const host=window.PenEchoCloudSettings;if(!host)return;
    select(active,{refresh:false});
    if(!mounted)mounted=window.PenEchoCloudMcp.mount(root,{
      api:host.api,origin:host.origin(),language:language(),runtime:cloud()?'cloud':'local',
      signIn:()=>host.signIn(()=>mounted?.refresh().catch(()=>{})),signInState:host.signInState,connection:()=>connection,
      enable:async enabled=>{
        if(!cloud())await host.api('/api/cloud/mcp/access',{method:'POST',body:JSON.stringify({enabled})});
        if(enabled)window.dispatchEvent(new CustomEvent('penecho:open-cloud-mcp'));
        else if(cloud())window.dispatchEvent(new CustomEvent('penecho:close-mcp'));
        window.dispatchEvent(new CustomEvent('penecho:cloud-account-changed'));
      },
    });
    else mounted.refresh().catch(()=>{});
    mounted.setLanguage(language());if(deviceStatus)mounted.updateDeviceStatus(deviceStatus);
  }
  for(const kind of ['Cloud','Local'])document.getElementById(`mcp${kind}Tab`).addEventListener('click',()=>select(kind.toLowerCase()));
  document.querySelector('.mcp-settings-tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();if(!localAvailable()){select('cloud');document.getElementById('mcpCloudTab').focus();return;}select(event.key==='Home'?'cloud':event.key==='End'?'local':active==='cloud'?'local':'cloud');
    document.getElementById(active==='cloud'?'mcpCloudTab':'mcpLocalTab').focus();
  });
  window.PenEchoMcpSettings={open,select,setDeviceStatus:value=>{deviceStatus=value;mounted?.updateDeviceStatus(value);},setConnection:value=>{connection=value;mounted?.updateConnection();}};
  window.addEventListener('penecho:cloud-account-changed',()=>{if(!document.getElementById('settingsPageMcp').hidden)mounted?.refresh().catch(()=>{});});
  window.addEventListener('penecho:remote-cloud-status',()=>select(active,{refresh:false}));
  // Keep login and credentials fresh when returning from external authorization.
  window.addEventListener('focus',()=>{if(!document.getElementById('settingsPageMcp').hidden)open();});
  select('cloud');
})();
