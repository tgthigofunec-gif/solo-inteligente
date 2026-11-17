/* Relatório: monta a página a partir dos valores confirmados do laudo. */
(function () {
    'use strict';
    if (!Solo.exigirLogin()) { return; }

    var raiz = document.getElementById('raiz');
    var laudo = Solo.laudos.obter(Solo.parametro('id'));
    var esc = Solo.esc, ic = Solo.icone;

    if (!laudo) {
        raiz.innerHTML =
            '<h1 class="titulo">Laudo não encontrado</h1>' +
            '<p class="lead-suave">Não achamos esse laudo. Volte para a lista.</p>' +
            '<p><a class="btn btn-primario" href="painel.html">Meus laudos</a></p>';
        return;
    }
    if (laudo.status !== 'pronto') {
        window.location.replace('revisar.html?id=' + laudo.id);
        return;
    }

    var r = SoloAnalise.analisar(laudo.valores);
    var br = SoloAnalise.numeroBR;
    var rotuloStatus = { baixo: 'Baixo', adequado: 'Adequado', alto: 'Alto' };
    var iconeStatus = { baixo: 'down', adequado: 'check', alto: 'up' };
    var rotuloNivel = { alta: 'Compatibilidade alta', media: 'Compatível com ajustes', baixa: 'Exige muita correção' };

    document.title = 'Relatório · ' + laudo.nomeArea + ' · Solo Inteligente';

    var atencao = r.atencao.length
        ? '<div class="grade-atencao">' + r.atencao.map(function (a) {
            return '<div class="alerta alerta-atencao">' + ic('alert') + '<div><strong>' + esc(a.titulo) + '</strong><br>' + esc(a.texto) + '</div></div>';
        }).join('') + '</div>'
        : '<div class="alerta alerta-ok">' + ic('check') + '<div>Nenhum ponto de atenção nos nutrientes lidos.</div></div>';

    var nutrientes = r.nutrientes.map(function (n) {
        var aria = n.nome + ': ' + br(n.valor) + ' ' + n.unidade + ', nível ' + rotuloStatus[n.status].toLowerCase() + '. Faixa adequada: ' + n.faixa;
        return '<article class="card nutriente evitar-quebra">' +
            '<div class="nutriente-topo"><span class="bloco-icone simbolo-bloco">' + esc(n.simbolo) + '</span>' +
            '<div class="nutriente-nome"><h3 class="titulo-card">' + esc(n.nome) + '</h3>' +
            '<p class="nutriente-valor"><strong>' + esc(br(n.valor)) + '</strong> <span class="legenda">' + esc(n.unidade) + '</span></p></div>' +
            '<span class="badge badge-' + n.status + '">' + ic(iconeStatus[n.status]) + ' ' + rotuloStatus[n.status] + '</span></div>' +
            '<div class="meter" role="img" aria-label="' + esc(aria) + '"><div class="meter-trilho">' +
            '<span class="faixa faixa-baixo"></span><span class="faixa faixa-ok"></span><span class="faixa faixa-alto"></span>' +
            '<span class="meter-seta" style="left: ' + n.posicao.toFixed(1) + '%"></span></div>' +
            '<div class="meter-legenda legenda" aria-hidden="true"><span>Baixo</span><span>' + esc(n.faixa) + '</span><span>Alto</span></div></div>' +
            '<p class="nutriente-texto">' + esc(n.texto) + '</p></article>';
    }).join('');

    var culturas = r.culturas.map(function (c) {
        var faltas = c.faltas.length
            ? '<ul class="faltas legenda">' + c.faltas.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>'
            : '<p class="legenda">Todos os nutrientes lidos atendem à cultura.</p>';
        return '<article class="card cultura evitar-quebra"><span class="bloco-icone">' + ic('leaf') + '</span><div>' +
            '<h3 class="titulo-card">' + esc(c.nome) + '</h3>' +
            '<p class="rotulo-terra">' + rotuloNivel[c.nivel] + ' · ' + c.pct + '%</p>' + faltas + '</div></article>';
    }).join('');

    var recomendacoes = r.recomendacoes.map(function (t) { return '<li class="evitar-quebra">' + esc(t) + '</li>'; }).join('');

    raiz.innerHTML =
        '<div class="barra-acoes sem-imprimir"><a class="link-voltar" href="painel.html">' + ic('back') + ' Voltar</a>' +
        '<button type="button" class="btn btn-primario btn-pequeno" data-imprimir>' + ic('print') + ' Salvar como PDF</button></div>' +

        '<header class="resumo"><div class="resumo-texto">' +
        '<p class="resumo-meta">' + esc(laudo.nomeArea) + ' · ' + esc(Solo.dataBR(laudo.criadoEm)) + '</p>' +
        '<h1 class="titulo">Qualidade do solo: ' + esc(r.classificacao) + '</h1>' +
        '<p class="resumo-frase">' + esc(r.resumo) + '</p></div>' +
        '<div class="anel" style="--pct: ' + r.pontuacao + '" role="img" aria-label="Pontuação ' + r.pontuacao + ' de 100, ' + esc(r.classificacao) + '">' +
        '<div class="anel-miolo"><strong>' + r.pontuacao + '</strong><span>de 100</span></div></div></header>' +

        '<h2 class="subtitulo">Pontos de atenção</h2>' + atencao +
        '<h2 class="subtitulo">Nutrientes do solo</h2><div class="grade-nutrientes">' + nutrientes + '</div>' +
        '<h2 class="subtitulo">Culturas compatíveis</h2><div class="grade-culturas">' + culturas + '</div>' +
        '<h2 class="subtitulo">O que fazer agora</h2><ol class="passos-fazer">' + recomendacoes + '</ol>' +

        '<div class="alerta alerta-info aviso-final">' + ic('info') + '<div><strong>Importante:</strong> este relatório é uma ajuda para entender o laudo e não substitui um técnico agrícola. ' +
        'Antes de corrigir o solo ou aplicar qualquer produto, confirme com um profissional da sua região. As faixas usadas são simplificadas, só para estudo.</div></div>' +
        '<p class="sem-imprimir links-rodape"><a href="revisar.html?id=' + laudo.id + '">Corrigir valores</a></p>';

    Solo.ligarImpressao();
})();
