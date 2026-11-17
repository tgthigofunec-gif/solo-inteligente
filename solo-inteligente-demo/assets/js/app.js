/* =====================================================================
   Solo Inteligente (demonstração): partes compartilhadas por todas as páginas.

   - Sessão FICTÍCIA: só uma flag no sessionStorage (some ao fechar a aba).
   - "Banco de dados" de mentira: os laudos ficam no localStorage do navegador.
     Nada sai do seu computador e nada é enviado para servidor algum.
   - Layout: monta cabeçalho, rodapé e ícones em todas as páginas.
   ===================================================================== */
(function () {
    'use strict';

    var DADOS = window.SOLO_DADOS;
    var Solo = window.Solo = {};

    /* ---------- Armazenamento (com plano B em memória se o navegador bloquear) ---------- */

    var memoria = { local: {}, sessao: {} };

    function armazem(tipo) {
        var nome = tipo === 'sessao' ? 'sessionStorage' : 'localStorage';
        return {
            get: function (chave) {
                try { return window[nome].getItem(chave); }
                catch (e) { return memoria[tipo][chave] === undefined ? null : memoria[tipo][chave]; }
            },
            set: function (chave, valor) {
                try { window[nome].setItem(chave, valor); }
                catch (e) { memoria[tipo][chave] = valor; }
            },
            remove: function (chave) {
                try { window[nome].removeItem(chave); }
                catch (e) { delete memoria[tipo][chave]; }
            }
        };
    }
    var local = armazem('local');
    var sessao = armazem('sessao');

    /* ---------- Utilidades ---------- */

    /** Escapa texto antes de colocar em HTML (defesa contra XSS). Use SEMPRE em dados variáveis. */
    Solo.esc = function (texto) {
        return String(texto === null || texto === undefined ? '' : texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    Solo.icone = function (nome, classe) {
        return '<svg class="ico ' + (classe || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + nome + '"/></svg>';
    };

    Solo.dataBR = function (iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) { return ''; }
        return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    };

    Solo.parametro = function (nome) {
        return new URLSearchParams(window.location.search).get(nome);
    };

    /* ---------- Mensagens temporárias (aparecem uma vez, na próxima página) ---------- */

    Solo.flash = function (tipo, msg) {
        var lista = JSON.parse(sessao.get('solo_flash') || '[]');
        lista.push({ tipo: tipo, msg: msg });
        sessao.set('solo_flash', JSON.stringify(lista));
    };

    function pegarFlash() {
        var lista = JSON.parse(sessao.get('solo_flash') || '[]');
        sessao.remove('solo_flash');
        return lista;
    }

    /* ---------- Sessão fictícia ---------- */

    Solo.logado = function () { return sessao.get('solo_logado') === '1'; };

    Solo.entrar = function (email, senha) {
        var conta = DADOS.conta;
        if (email === conta.email && senha === conta.senha) {
            sessao.set('solo_logado', '1');
            return true;
        }
        return false;
    };

    Solo.sair = function () { sessao.remove('solo_logado'); };

    /** Páginas protegidas chamam isto. Devolve false (e redireciona) se não houver "login". */
    Solo.exigirLogin = function () {
        if (Solo.logado()) { return true; }
        Solo.flash('info', 'Entre na conta de demonstração para continuar.');
        window.location.replace('login.html');
        return false;
    };

    Solo.usuario = function () { return { nome: DADOS.conta.nome, email: DADOS.conta.email }; };

    /* ---------- "Banco de dados" de mentira: laudos no localStorage ---------- */

    var CHAVE_LAUDOS = 'solo_demo_v1_laudos';

    function lerLaudos() {
        var bruto = local.get(CHAVE_LAUDOS);
        if (bruto === null) { return semear(); }
        try { return JSON.parse(bruto) || []; } catch (e) { return semear(); }
    }

    function gravarLaudos(lista) { local.set(CHAVE_LAUDOS, JSON.stringify(lista)); }

    function semear() {
        var agora = Date.now();
        var lista = DADOS.laudosIniciais.map(function (l, i) {
            return {
                id: i + 1,
                nomeArea: l.nomeArea,
                status: l.status,
                motivoErro: l.motivoErro || null,
                valores: l.valores || {},
                textoExtraido: '',
                arquivoNome: null,
                criadoEm: new Date(agora - l.diasAtras * 86400000).toISOString()
            };
        });
        gravarLaudos(lista);
        return lista;
    }

    Solo.laudos = {
        listar: function () {
            return lerLaudos().sort(function (a, b) {
                return (new Date(b.criadoEm) - new Date(a.criadoEm)) || (b.id - a.id);   // mais recentes primeiro
            });
        },
        obter: function (id) {
            id = parseInt(id, 10);
            return lerLaudos().filter(function (l) { return l.id === id; })[0] || null;
        },
        criar: function (dados) {
            var lista = lerLaudos();
            var proximo = lista.reduce(function (m, l) { return Math.max(m, l.id); }, 0) + 1;
            var laudo = {
                id: proximo,
                nomeArea: dados.nomeArea,
                status: dados.status,
                motivoErro: dados.motivoErro || null,
                valores: dados.valores || {},
                textoExtraido: dados.textoExtraido || '',
                arquivoNome: dados.arquivoNome || null,
                criadoEm: new Date().toISOString()
            };
            lista.push(laudo);
            gravarLaudos(lista);
            return laudo;
        },
        atualizar: function (id, mudancas) {
            var lista = lerLaudos();
            lista.forEach(function (l) { if (l.id === parseInt(id, 10)) { Object.assign(l, mudancas); } });
            gravarLaudos(lista);
        },
        restaurar: function () { local.remove(CHAVE_LAUDOS); semear(); }
    };

    /* ---------- Layout: cabeçalho, rodapé, ícones ---------- */

    var SPRITE =
        '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
        '<symbol id="i-sprout" viewBox="0 0 24 24"><path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-3 2-6 7-6 0 4-3 6-7 6z"/></symbol>' +
        '<symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></symbol>' +
        '<symbol id="i-file" viewBox="0 0 24 24"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4"/></symbol>' +
        '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>' +
        '<symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4"/><path d="M12 17v.01"/></symbol>' +
        '<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></symbol>' +
        '<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></symbol>' +
        '<symbol id="i-up" viewBox="0 0 24 24"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></symbol>' +
        '<symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="m5 19 7-7"/></symbol>' +
        '<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol>' +
        '<symbol id="i-back" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></symbol>' +
        '<symbol id="i-print" viewBox="0 0 24 24"><path d="M7 9V4h10v5"/><path d="M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v6H7z"/></symbol>' +
        '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></symbol>' +
        '</defs></svg>';

    function montarLayout() {
        var main = document.getElementById('conteudo');
        if (!main) { return; }

        var nav = Solo.logado()
            ? '<a class="topo-link" href="painel.html">Meus laudos</a>' +
              '<button type="button" class="btn btn-contorno btn-pequeno" data-sair>Sair</button>'
            : '<a class="btn btn-contorno btn-pequeno" href="login.html">Entrar</a>' +
              '<a class="btn btn-acao btn-pequeno so-desktop" href="login.html">Testar demonstração</a>';

        var topo = document.createElement('div');
        topo.innerHTML =
            SPRITE +
            '<a class="pular" href="#conteudo">Pular para o conteúdo</a>' +
            '<header class="topo"><div class="container topo-in">' +
            '<a class="logo" href="index.html" aria-label="Solo Inteligente, página inicial">' +
            '<span class="logo-simbolo">' + Solo.icone('sprout') + '</span><span class="logo-nome">Solo Inteligente</span></a>' +
            '<nav class="topo-nav" aria-label="Principal">' + nav + '</nav></div></header>' +
            '<div class="faixa-demo"><div class="container">' + Solo.icone('info') +
            '<span><strong>Modo demonstração.</strong> Conta e dados fictícios, guardados só neste navegador.</span></div></div>';
        while (topo.firstChild) { document.body.insertBefore(topo.firstChild, main); }

        // Mensagens temporárias no início do conteúdo
        var mensagens = pegarFlash();
        if (mensagens.length) {
            var caixa = document.createElement('div');
            caixa.className = 'container mensagens';
            caixa.innerHTML = mensagens.map(function (m) {
                var tipo = ['erro', 'ok', 'info'].indexOf(m.tipo) !== -1 ? m.tipo : 'info';
                var ic = tipo === 'erro' ? 'alert' : (tipo === 'ok' ? 'check' : 'info');
                return '<div class="alerta alerta-' + tipo + '" role="' + (tipo === 'erro' ? 'alert' : 'status') + '">' +
                    Solo.icone(ic) + '<div>' + Solo.esc(m.msg) + '</div></div>';
            }).join('');
            main.insertBefore(caixa, main.firstChild);
        }

        var rodape = document.createElement('footer');
        rodape.className = 'rodape';
        rodape.innerHTML =
            '<div class="container"><p><strong>Solo Inteligente</strong> · Projeto acadêmico demonstrativo.</p>' +
            '<p class="legenda">As faixas de referência são simplificadas e servem só para estudo. ' +
            'Elas não substituem a orientação de um técnico agrícola.</p></div>';
        document.body.appendChild(rodape);

        // Comportamentos gerais
        document.querySelectorAll('[data-sair]').forEach(function (b) {
            b.addEventListener('click', function () { Solo.sair(); window.location.href = 'index.html'; });
        });
        document.querySelectorAll('[data-mostrar-senha]').forEach(function (botao) {
            botao.addEventListener('click', function () {
                var campo = document.getElementById(botao.getAttribute('aria-controls'));
                if (!campo) { return; }
                var mostrar = campo.type === 'password';
                campo.type = mostrar ? 'text' : 'password';
                botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
            });
        });
    }

    /** Liga o botão "Salvar como PDF" (usa a impressão do navegador). Chamado após renderizar o relatório. */
    Solo.ligarImpressao = function () {
        document.querySelectorAll('[data-imprimir]').forEach(function (b) {
            b.addEventListener('click', function () { window.print(); });
        });
    };

    /** Mostra/limpa a mensagem de erro de um campo (.campo) de formulário. */
    Solo.erroCampo = function (campo, mensagem) {
        var antigo = campo.querySelector('.campo-msg');
        if (antigo) { antigo.remove(); }
        var input = campo.querySelector('input');
        campo.classList.toggle('campo-erro', !!mensagem);
        if (!input) { return; }
        if (!mensagem) { input.removeAttribute('aria-invalid'); return; }
        var p = document.createElement('p');
        p.className = 'campo-msg';
        p.id = input.id + '-erro';
        p.innerHTML = Solo.icone('alert') + '<span>' + Solo.esc(mensagem) + '</span>';
        campo.appendChild(p);
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', p.id);
    };

    montarLayout();
})();
