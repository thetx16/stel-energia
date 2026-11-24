const $=s=>document.querySelector(s);
    const menu=$('#menu-toggle');menu.addEventListener('click',()=>{const isOpen=$('#nav').classList.toggle('open');menu.setAttribute('aria-expanded',String(isOpen));menu.textContent=isOpen?'×':'☰';});
    document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';}));
    const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});const currency=n=>money.format(n);
    const range=$('#bill-range');function updateBill(){const n=+range.value;$('#bill-out').textContent=currency(n);$('#year-out').textContent=currency(n*12);}range.addEventListener('input',updateBill);updateBill();
    const deadline=Date.parse('2026-12-01T00:00:00-03:00');
    function countdown(){const remain=Math.max(0,deadline-Date.now());const parts=[Math.floor(remain/86400000),Math.floor(remain/3600000)%24,Math.floor(remain/60000)%60,Math.floor(remain/1000)%60];['#cd-d','#cd-h','#cd-m','#cd-s'].forEach((s,i)=>$(s).textContent=String(parts[i]).padStart(2,'0'));if(!remain){$('#count-row').querySelector('.count-text').textContent='A campanha de novembro foi encerrada. Consulte as condições atuais com a STEL.';}}
    let countdownTimer;function syncCountdown(){clearInterval(countdownTimer);if(!document.hidden){countdown();countdownTimer=setInterval(countdown,1000);}}syncCountdown();document.addEventListener('visibilitychange',syncCountdown);
    if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){const obs=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));}else document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));
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
      finally{btn.disabled=false;btn.innerHTML='Solicitar minha análise <span class="arrow">↗</span>'}
    });
