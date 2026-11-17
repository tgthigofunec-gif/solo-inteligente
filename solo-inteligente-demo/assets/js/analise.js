/* =====================================================================
   Solo Inteligente: leitura do texto do laudo e análise dos valores.

   1) extrairValores(texto): procura "rótulo ... número" no texto do laudo
      e converte as unidades.
   2) analisar(valores): compara com as faixas de dados.js e monta o relatório.

   Não há inteligência artificial: são regras explícitas. O mesmo laudo
   sempre gera o mesmo relatório.
   ===================================================================== */
(function () {
    'use strict';

    var DADOS = window.SOLO_DADOS;

    /* ---------- Formatação no padrão brasileiro ---------- */

    /** 5.2 -> "5,2" | 96 -> "96" | 0.35 -> "0,35" */
    function numeroBR(valor, casas) {
        var t = Number(valor).toFixed(casas === undefined ? 2 : casas);
        if (t.indexOf('.') !== -1) { t = t.replace(/0+$/, '').replace(/\.$/, ''); }
        return t.replace('.', ',');
    }

    /** "5,2" ou "5.2" -> 5.2 | inválido -> null */
    function decimalBR(texto) {
        var t = String(texto).trim().replace(',', '.');
        if (t === '' || !/^\d+(\.\d+)?$/.test(t)) { return null; }
        return parseFloat(t);
    }

    function listaPt(itens) {
        if (itens.length <= 1) { return itens[0] || ''; }
        return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
    }

    /* ---------- 1) Extração dos valores ---------- */

    // Como cada nutriente costuma aparecer escrito.
    // "palavras" ignoram maiúsculas/minúsculas; "simbolos" (P, K, Ca...) não.
    var ROTULOS = {
        ph: { palavras: '\\bpH\\b(?![^\\d\\n]{0,12}smp)', simbolos: null },
        p:  { palavras: 'f[óo]sforo',                    simbolos: '\\bP\\b' },
        k:  { palavras: 'pot[áa]ssio',                   simbolos: '\\bK\\b' },
        ca: { palavras: 'c[áa]lcio',                     simbolos: '\\bCa\\b' },
        mg: { palavras: 'magn[ée]sio',                   simbolos: '\\bMg\\b' },
        al: { palavras: 'alum[íi]nio',                   simbolos: '(?<![+\\w])Al\\b' },
        mo: { palavras: 'mat[ée]ria\\s+org[âa]nica',     simbolos: '\\bM\\.?O\\.?(?=\\W)' }
    };

    /** Limpa o texto: sobrescritos, H2O, CaCl2, Mehlich-1... (para não confundir com valores) */
    function normalizarTexto(texto) {
        return String(texto)
            .replace(/³/g, '3').replace(/²/g, '2').replace(/⁺/g, '+')
            .replace(/·/g, ' ').replace(/µ/g, 'u')
            .replace(/\r\n?/g, '\n')
            .replace(/h\s*2\s*o\b/gi, 'agua')
            .replace(/cacl\s*2/gi, 'cacl')
            .replace(/mehlich[\s\-]*1?/gi, 'mehlich ')
            .replace(/[ \t]+/g, ' ');
    }

    /** Converte para a unidade do sistema: K -> mg/dm³ | Ca, Mg, Al -> cmolc/dm³ | MO -> dag/kg */
    function normalizarUnidade(codigo, valor, unidade) {
        var u = (unidade || '').toLowerCase();
        if (codigo === 'k') {
            if (u.indexOf('cmol') !== -1) { return valor * 391; }
            if (u.indexOf('mmol') !== -1) { return valor * 39.1; }
        } else if (codigo === 'ca' || codigo === 'mg' || codigo === 'al') {
            if (u.indexOf('mmol') !== -1) { return valor / 10; }
        } else if (codigo === 'mo') {
            if (u.indexOf('g/dm') !== -1 || (u.indexOf('g/kg') !== -1 && u.indexOf('dag') === -1)) { return valor / 10; }
        }
        return valor;
    }

    function procurar(texto, rotulo, ignorarMaiusculas) {
        var re = new RegExp(
            '(?:' + rotulo + ')[^\\d\\n]{0,40}?(\\d+(?:[.,]\\d+)?)(?:\\s*([a-zA-Z%][a-zA-Z0-9%/.\\-]{0,12}))?',
            ignorarMaiusculas ? 'i' : ''
        );
        return re.exec(texto);
    }

    /** @returns {Object} código -> valor (só o que foi encontrado e é plausível) */
    function extrairValores(textoBruto) {
        var texto = normalizarTexto(String(textoBruto || '').slice(0, 100000));
        var achados = {};

        DADOS.nutrientes.forEach(function (n) {
            var r = ROTULOS[n.codigo];
            if (!r) { return; }
            var m = procurar(texto, r.palavras, true) || (r.simbolos ? procurar(texto, r.simbolos, false) : null);
            if (!m) { return; }

            var valor = parseFloat(m[1].replace(',', '.'));
            valor = Math.round(normalizarUnidade(n.codigo, valor, m[2]) * 100) / 100;
            if (valor >= n.valMin && valor <= n.valMax) { achados[n.codigo] = valor; }
        });
        return achados;
    }

    /* ---------- 2) Análise ---------- */

    function classificar(n, valor) {
        if (valor < n.baixoMax) { return 'baixo'; }
        if (valor <= n.adequadoMax) { return 'adequado'; }
        return 'alto';
    }

    /** Posição (0 a 100) da seta na barra de três faixas iguais. */
    function posicaoNaBarra(n, valor, status) {
        var terco = 100 / 3;
        var f = function (x) { return Math.max(0, Math.min(1, x)); };
        var largura = Math.max(n.adequadoMax - n.baixoMax, 0.0001);
        var pos;
        if (status === 'baixo') {
            pos = terco * (n.baixoMax > n.escalaMin ? f((valor - n.escalaMin) / (n.baixoMax - n.escalaMin)) : 0);
        } else if (status === 'adequado') {
            pos = terco + terco * f((valor - n.baixoMax) / largura);
        } else {
            pos = 2 * terco + terco * f((valor - n.adequadoMax) / largura);
        }
        return Math.max(2, Math.min(98, pos));
    }

    /** @param {Object} valores código -> número */
    function analisar(valores) {
        var itens = [], atencao = [], acoes = [], pontos = [];

        DADOS.nutrientes.forEach(function (n) {
            if (valores[n.codigo] === undefined) { return; }
            var v = Number(valores[n.codigo]);
            var status = classificar(n, v);
            var problema = (status === 'baixo' && n.baixoEProblema) || (status === 'alto' && n.altoEProblema);

            pontos.push(!problema ? 100 : (status === 'baixo' ? 40 : 60));

            itens.push({
                codigo: n.codigo, nome: n.nome, simbolo: n.simbolo, unidade: n.unidade,
                valor: v, status: status, problema: problema,
                texto: n.significado[status],
                faixa: numeroBR(n.baixoMax) + '–' + numeroBR(n.adequadoMax),
                posicao: posicaoNaBarra(n, v, status)
            });

            if (problema) {
                var fem = n.genero === 'f';
                var nivel = status === 'baixo' ? (fem ? 'baixa' : 'baixo') : (fem ? 'alta' : 'alto');
                atencao.push({ titulo: (n.nomeCurto || n.nome) + ' ' + nivel, texto: n.significado[status] });
                var acao = status === 'baixo' ? n.acao.baixo : n.acao.alto;
                if (acao) { acoes.push(acao); }
            }
        });

        // Nota geral
        var pontuacao = pontos.length ? Math.round(pontos.reduce(function (a, b) { return a + b; }, 0) / pontos.length) : 0;
        var classificacao = pontuacao >= 80 ? 'Boa' : (pontuacao >= 55 ? 'Regular' : 'Precisa de correção');

        // Resumo em uma frase
        var nomes = atencao.map(function (a) { return a.titulo; });
        var resumo;
        if (!nomes.length) {
            resumo = 'Os nutrientes lidos estão em boa situação. Continue acompanhando o solo com novas análises.';
        } else if (classificacao === 'Boa') {
            resumo = 'O solo está em boa situação, com poucos ajustes: ' + listaPt(nomes) + '.';
        } else if (classificacao === 'Regular') {
            resumo = 'O solo está regular. Alguns pontos pedem atenção: ' + listaPt(nomes) + '.';
        } else {
            resumo = 'O solo precisa de correção antes do plantio. Atenção em: ' + listaPt(nomes) + '.';
        }

        // Culturas compatíveis
        var nomePorCodigo = {};
        DADOS.nutrientes.forEach(function (n) { nomePorCodigo[n.codigo] = n.nome; });

        var culturas = [];
        DADOS.culturas.forEach(function (c) {
            var total = 0, ok = 0, faltas = [];
            Object.keys(c.exigencias).forEach(function (cod) {
                if (valores[cod] === undefined) { return; }
                total++;
                var v = Number(valores[cod]), min = c.exigencias[cod][0], max = c.exigencias[cod][1];
                if (min !== null && v < min) { faltas.push(nomePorCodigo[cod] + ' abaixo do que a cultura pede'); }
                else if (max !== null && v > max) { faltas.push(nomePorCodigo[cod] + ' acima do que a cultura tolera'); }
                else { ok++; }
            });
            if (!total) { return; }
            var pct = Math.round(ok / total * 100);
            culturas.push({
                nome: c.nome, descricao: c.descricao, pct: pct, faltas: faltas,
                nivel: pct >= 85 ? 'alta' : (pct >= 55 ? 'media' : 'baixa')
            });
        });
        culturas.sort(function (x, y) { return (y.pct - x.pct) || x.nome.localeCompare(y.nome, 'pt-BR'); });

        // Recomendações
        if (!acoes.length) { acoes.push('Mantenha o manejo atual da área e acompanhe com novas análises de solo.'); }
        acoes.push('Leve este relatório a um técnico agrícola ou à assistência técnica da sua região antes de comprar ou aplicar qualquer insumo.');

        return {
            nutrientes: itens, pontuacao: pontuacao, classificacao: classificacao,
            resumo: resumo, atencao: atencao, culturas: culturas, recomendacoes: acoes
        };
    }

    window.SoloAnalise = {
        extrairValores: extrairValores,
        analisar: analisar,
        numeroBR: numeroBR,
        decimalBR: decimalBR
    };
})();
