const $=s=>document.querySelector(s);
    const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});const currency=n=>money.format(n);
    const range=$('#bill-range');function updateBill(){const n=+range.value;const min=+range.min,max=+range.max;range.style.setProperty('--bill-fill',((max>min?Math.max(0,Math.min(1,(n-min)/(max-min))):0)*100).toFixed(3)+'%');range.setAttribute('aria-valuetext',currency(n)+' por mês');$('#bill-out').textContent=currency(n);$('#year-out').textContent=currency(n*12);}range.addEventListener('input',updateBill);updateBill();
    document.querySelectorAll('[data-profile]').forEach(link=>link.addEventListener('click',()=>{$('#perfil').value=link.dataset.profile;}));
    const phone=$('#whatsapp');phone.addEventListener('input',()=>{const n=phone.value.replace(/\D/g,'').slice(0,11);phone.value=n.length>6?`(${n.slice(0,2)}) ${n.slice(2,n.length===11?7:6)}-${n.slice(n.length===11?7:6)}`:n.length>2?`(${n.slice(0,2)}) ${n.slice(2)}`:n;});
    const CONFIG={endpoint:'',origem:'lp_stel_bf_v4_1'};const form=$('#lead-form'),feedback=$('#feedback'),btn=$('#enviar');
    function message(t,good=false){feedback.textContent=t;feedback.className='feedback show'+(good?' good':'');}
    form.addEventListener('submit',async e=>{
      e.preventDefault();feedback.className='feedback';
      const nome=$('#nome').value.trim(),whatsapp=phone.value.replace(/\D/g,''),cidade=$('#cidade').value.trim(),perfil=$('#perfil').value,conta=$('#conta').value,consentimento=$('#aceite').checked;
      if(nome.length<2){message('Informe seu nome completo.');$('#nome').focus();return}
      if(whatsapp.length<10||whatsapp.length>11){message('Informe um WhatsApp válido com DDD.');phone.focus();return}
      if(cidade.length<2){message('Informe sua cidade.');$('#cidade').focus();return}
      if(!perfil){message('Selecione onde você quer instalar energia solar.');$('#perfil').focus();return}
      if(!conta){message('Selecione o valor aproximado da sua conta de luz.');$('#conta').focus();return}
      if(!consentimento){message('Autorize o contato para continuar.');$('#aceite').focus();return}
      const params=new URLSearchParams(location.search);const payload={nome,whatsapp,cidade,perfil,faixa_conta:conta,consentimento:true,data_registro:new Date().toISOString(),origem:CONFIG.origem,campanha:'black_friday_2026',pagina:location.href};
      for(const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'])payload[key]=(params.get(key)||'').slice(0,250);
      if(!CONFIG.endpoint){message('Prévia: dados validados, mas nenhum cadastro foi enviado. A integração com o CRM da STEL ainda precisa ser configurada.');return}
      btn.disabled=true;btn.textContent='Enviando…';
      try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);let res;try{res=await fetch(CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal})}finally{clearTimeout(timer)}if(!res.ok)throw new Error('Envio não confirmado');message('Solicitação recebida! Nossa equipe entrará em contato.',true);form.reset()}
      catch(_){message('Não foi possível confirmar o envio. Por favor, tente novamente.')}
      finally{btn.disabled=false;btn.innerHTML="Solicitar minha análise <span class=\"arrow-disc\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\"><path d=\"M6 18 18 6M7 6h11v11\"/></svg></span>"}
    });

// Anchor navigation is compatible with the existing GSAP smooth scroll.
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const id=a.getAttribute('href').slice(1);if(!id||id==='inicio'||id==='conteudo')return;const target=document.getElementById(id);if(!target)return;const smoother=window.ScrollSmoother?.get();if(smoother){e.preventDefault();history.pushState(null,'','#'+id);smoother.scrollTo(target,true,'top 110px');}});
if(window.ScrollTrigger){document.querySelectorAll('.st-faq details').forEach(d=>d.addEventListener('toggle',()=>requestAnimationFrame(()=>ScrollTrigger.refresh())));}

// Refresh scroll positions after the native FAQ accordion finishes its height transition.
if(window.ScrollTrigger){document.querySelectorAll('#duvidas .st-faq-item').forEach(item=>item.addEventListener('transitionend',event=>{if(event.target===item&&event.pseudoElement==='::details-content'&&(event.propertyName==='block-size'||event.propertyName==='height'))requestAnimationFrame(()=>ScrollTrigger.refresh());}));}
