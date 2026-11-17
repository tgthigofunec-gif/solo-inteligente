/* =====================================================================
   Painel: lista de laudos + envio de um novo laudo.

   Envio: o texto é lido AQUI, no navegador (nada vai para servidor):
   - PDF com texto:  PDF.js lê o texto direto
   - PDF escaneado e imagens (JPG/PNG): Tesseract.js faz OCR em português
   As bibliotecas só são baixadas se forem necessárias (precisa de internet).
   O botão "Testar com um laudo de exemplo" funciona sem internet.
   ===================================================================== */
(function () {
    'use strict';
    if (!Solo.exigirLogin()) { return; }

    var esc = Solo.esc, ic = Solo.icone;
    var MSG_ERRO_LEITURA = 'Não encontramos os números dos nutrientes nesse arquivo. Tente uma foto mais nítida, com o papel inteiro e boa luz, ou digite os valores.';

    document.getElementById('nome-usuario').textContent = Solo.usuario().nome.split(' ')[0];

    /* ---------- Lista de laudos ---------- */

    function desenharLista() {
        var laudos = Solo.laudos.listar();
        var alvo = document.getElementById('lista-laudos');
        var html = '<h2 class="subtitulo">Laudos enviados</h2>';

        if (!laudos.length) {
            html += '<div class="card vazio"><span class="bloco-icone">' + ic('file') + '</span><p>Você ainda não enviou nenhum laudo.</p></div>';
        }

        laudos.forEach(function (l) {
            var topo = '<span class="bloco-icone">' + ic('file') + '</span>';
            var nome = '<strong>' + esc(l.nomeArea) + '</strong><span class="legenda">' + esc(Solo.dataBR(l.criadoEm)) + '</span>';
            if (l.status === 'pronto') {
                html += '<a class="card card-link laudo" href="relatorio.html?id=' + l.id + '">' + topo +
                    '<span class="laudo-info">' + nome + '<span class="badge badge-ok">' + ic('check') + ' Relatório pronto</span></span>' +
                    ic('chevron', 'ico-seta') + '</a>';
            } else if (l.status === 'revisao') {
                html += '<a class="card card-link laudo" href="revisar.html?id=' + l.id + '">' + topo +
                    '<span class="laudo-info">' + nome + '<span class="badge badge-espera">' + ic('clock') + ' Confirmar valores</span>' +
                    '<span class="legenda">Falta conferir os números lidos.</span></span>' + ic('chevron', 'ico-seta') + '</a>';
            } else {
                html += '<div class="card laudo laudo-erro"><span class="bloco-icone bloco-icone-erro">' + ic('alert') + '</span>' +
                    '<span class="laudo-info">' + nome + '<span class="badge badge-erro">' + ic('alert') + ' Não conseguimos ler</span>' +
                    '<span class="legenda">' + esc(l.motivoErro || MSG_ERRO_LEITURA) + '</span>' +
                    '<span class="laudo-botoes"><a class="btn btn-contorno btn-pequeno" href="#envio">Enviar de novo</a>' +
                    '<a class="btn btn-contorno btn-pequeno" href="revisar.html?id=' + l.id + '">Digitar valores</a></span></span></div>';
            }
        });
        alvo.innerHTML = html;
    }

    desenharLista();

    document.getElementById('restaurar-demo').addEventListener('click', function () {
        if (window.confirm('Apagar os laudos que você criou e voltar aos 3 laudos de demonstração?')) {
            Solo.laudos.restaurar();
            desenharLista();
        }
    });

    /* ---------- Criar o laudo a partir do texto lido ---------- */

    function criarLaudoDoTexto(nomeArea, texto, arquivoNome) {
        var valores = SoloAnalise.extrairValores(texto);
        var achou = Object.keys(valores).length > 0;
        var laudo = Solo.laudos.criar({
            nomeArea: nomeArea,
            arquivoNome: arquivoNome,
            textoExtraido: String(texto || '').slice(0, 100000),
            valores: valores,
            status: achou ? 'revisao' : 'erro',
            motivoErro: achou ? null : MSG_ERRO_LEITURA
        });
        if (achou) {
            Solo.flash('ok', 'Leitura concluída! Confira os números abaixo antes de gerar o relatório.');
            window.location.href = 'revisar.html?id=' + laudo.id;
        } else {
            Solo.flash('erro', MSG_ERRO_LEITURA);
            window.location.href = 'painel.html';
        }
    }

    /* ---------- Envio de arquivo ---------- */

    var form = document.getElementById('form-envio');
    var CONFIG = {
        pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
        tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js',
        idioma: 'por',
        maxPaginasPdf: 6,
        ladoMaximoImagem: 2200   // reduz fotos grandes antes do OCR (mais rápido no celular)
    };


    var input = document.getElementById('laudo');
    var zona = form.querySelector('[data-zona]');
    var dicaFoto = form.querySelector('.dica-foto');
    var detalhes = form.querySelector('[data-detalhes]');
    var nomeArq = form.querySelector('[data-arq-nome]');
    var tamArq = form.querySelector('[data-arq-tam]');
    var btnRemover = form.querySelector('[data-remover]');
    var btnEnviar = form.querySelector('[data-enviar]');
    var boxErro = form.querySelector('[data-erro-cliente]');
    var txtErro = form.querySelector('[data-erro-texto]');
    var boxProgresso = form.querySelector('[data-progresso]');
    var barra = form.querySelector('[data-barra]');
    var msgProgresso = form.querySelector('[data-progresso-msg]');
    var maxBytes = parseInt(form.getAttribute('data-max-bytes'), 10) || 8 * 1024 * 1024;

    /* ---------- Interface ---------- */

    function formatarTamanho(bytes) {
        if (bytes < 1048576) { return Math.max(1, Math.round(bytes / 1024)) + ' KB'; }
        return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
    }

    function mostrarErro(texto) {
        txtErro.textContent = texto;
        boxErro.hidden = false;
    }

    function limparEscolha() {
        input.value = '';
        boxErro.hidden = true;
        boxProgresso.hidden = true;
        detalhes.hidden = true;
        zona.hidden = false;
        if (dicaFoto) { dicaFoto.hidden = false; }
        btnEnviar.disabled = false;
    }

    function tipoPermitido(arquivo) {
        var nome = arquivo.name.toLowerCase();
        return /\.(pdf|jpe?g|png)$/.test(nome) ||
            ['application/pdf', 'image/jpeg', 'image/png'].indexOf(arquivo.type) !== -1;
    }

    function progresso(fracao, mensagem) {
        boxProgresso.hidden = false;
        barra.style.width = Math.round(Math.max(0, Math.min(1, fracao)) * 100) + '%';
        if (mensagem) { msgProgresso.textContent = mensagem; }
    }

    input.addEventListener('change', function () {
        var arquivo = input.files && input.files[0];
        if (!arquivo) { return; }
        boxErro.hidden = true;

        if (!tipoPermitido(arquivo)) {
            limparEscolha();
            alert('Formato não aceito. Envie um PDF, JPG ou PNG.');
            return;
        }
        if (arquivo.size > maxBytes) {
            limparEscolha();
            alert('O arquivo é grande demais. O limite é de ' + formatarTamanho(maxBytes) + '.');
            return;
        }
        nomeArq.textContent = arquivo.name;
        tamArq.textContent = formatarTamanho(arquivo.size);
        zona.hidden = true;
        if (dicaFoto) { dicaFoto.hidden = true; }
        detalhes.hidden = false;
    });

    btnRemover.addEventListener('click', limparEscolha);

    // Arrastar e soltar (computador)
    ['dragenter', 'dragover'].forEach(function (nome) {
        zona.addEventListener(nome, function (ev) { ev.preventDefault(); zona.classList.add('arrastando'); });
    });
    ['dragleave', 'drop'].forEach(function (nome) {
        zona.addEventListener(nome, function (ev) { ev.preventDefault(); zona.classList.remove('arrastando'); });
    });
    zona.addEventListener('drop', function (ev) {
        if (ev.dataTransfer && ev.dataTransfer.files.length) {
            input.files = ev.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });

    /* ---------- Carregar bibliotecas só quando precisar ---------- */

    var carregando = {};
    function carregarScript(url) {
        if (!carregando[url]) {
            carregando[url] = new Promise(function (ok, falha) {
                var s = document.createElement('script');
                s.src = url;
                s.onload = ok;
                s.onerror = function () { falha(new Error('Não foi possível carregar ' + url)); };
                document.head.appendChild(s);
            });
        }
        return carregando[url];
    }

    /* ---------- OCR (Tesseract.js) ---------- */

    function reduzirImagem(arquivo) {
        return createImageBitmap(arquivo).then(function (img) {
            var escala = Math.min(1, CONFIG.ladoMaximoImagem / Math.max(img.width, img.height));
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas;
        });
    }

    async function ocr(alvo, inicio, fim) {
        await carregarScript(CONFIG.tesseract);
        progresso(inicio, 'Preparando a leitura do texto…');
        var worker = await Tesseract.createWorker(CONFIG.idioma, 1, {
            logger: function (m) {
                if (m.status === 'recognizing text') {
                    progresso(inicio + (fim - inicio) * m.progress, 'Lendo o laudo… ' + Math.round(m.progress * 100) + '%');
                }
            }
        });
        try {
            var resultado = await worker.recognize(alvo);
            return resultado.data.text || '';
        } finally {
            await worker.terminate();
        }
    }

    /* ---------- PDF (PDF.js) ---------- */

    // Agrupa os pedaços de texto por linha (mesma altura), para parecer o papel.
    function textoDaPagina(conteudo) {
        var linhas = [];
        conteudo.items.forEach(function (item) {
            if (!item.str || !item.str.trim()) { return; }
            var y = Math.round(item.transform[5]);
            var linha = linhas.find(function (l) { return Math.abs(l.y - y) <= 3; });
            if (!linha) { linha = { y: y, itens: [] }; linhas.push(linha); }
            linha.itens.push({ x: item.transform[4], s: item.str });
        });
        linhas.sort(function (a, b) { return b.y - a.y; });
        return linhas.map(function (l) {
            return l.itens.sort(function (a, b) { return a.x - b.x; })
                .map(function (i) { return i.s; }).join(' ');
        }).join('\n');
    }

    async function lerPdf(arquivo) {
        progresso(0.05, 'Abrindo o PDF…');
        await carregarScript(CONFIG.pdfjs);
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfjsWorker;

        var pdf = await pdfjsLib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
        var total = Math.min(pdf.numPages, CONFIG.maxPaginasPdf);
        var texto = '';

        for (var i = 1; i <= total; i++) {
            var pagina = await pdf.getPage(i);
            texto += textoDaPagina(await pagina.getTextContent()) + '\n';
            progresso(0.1 + 0.4 * (i / total), 'Lendo o PDF… página ' + i + ' de ' + total);
        }

        // Quase sem texto = PDF escaneado: desenha as páginas e faz OCR
        if (texto.replace(/\s/g, '').length < 40) {
            texto = '';
            var paginasOcr = Math.min(total, 2);
            for (var p = 1; p <= paginasOcr; p++) {
                var pg = await pdf.getPage(p);
                var viewport = pg.getViewport({ scale: 2 });
                var canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await pg.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                var ini = 0.5 + 0.5 * ((p - 1) / paginasOcr);
                var fim = 0.5 + 0.5 * (p / paginasOcr);
                texto += (await ocr(canvas, ini, fim)) + '\n';
            }
        }
        return texto;
    }

    async function extrairTexto(arquivo) {
        var ehPdf = arquivo.type === 'application/pdf' || /\.pdf$/i.test(arquivo.name);
        if (ehPdf) { return lerPdf(arquivo); }
        progresso(0.05, 'Preparando a imagem…');
        var canvas = await reduzirImagem(arquivo);
        return ocr(canvas, 0.1, 1);
    }

    /* ---------- Enviar ---------- */

    form.addEventListener('submit', async function (ev) {
        ev.preventDefault();

        var arquivo = input.files && input.files[0];
        if (!arquivo) { mostrarErro('Escolha um arquivo para enviar.'); return; }

        var nomeArea = (document.getElementById('nome_area').value || '').trim().slice(0, 80) ||
            arquivo.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'Meu laudo';

        btnEnviar.disabled = true;
        boxErro.hidden = true;
        var texto = '';
        try {
            texto = await extrairTexto(arquivo);
            progresso(1, 'Pronto!');
        } catch (erro) {
            // Sem internet para as bibliotecas, arquivo estranho etc.: segue sem texto.
            console.warn('Leitura automática falhou:', erro);
            progresso(1, 'Não deu para ler automaticamente. Você poderá digitar os valores.');
        }
        criarLaudoDoTexto(nomeArea, texto, arquivo.name);
    });

    // Laudo de exemplo (não precisa de internet)
    document.getElementById('usar-exemplo').addEventListener('click', function () {
        criarLaudoDoTexto('Laudo de exemplo', SOLO_DADOS.laudoExemplo, null);
    });
})();
