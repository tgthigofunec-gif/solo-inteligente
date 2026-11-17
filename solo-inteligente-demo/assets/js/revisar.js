/* Tela "Confira os números": a pessoa vê o que foi lido do laudo, corrige e confirma. */
(function () {
    'use strict';
    if (!Solo.exigirLogin()) { return; }

    var raiz = document.getElementById('raiz');
    var laudo = Solo.laudos.obter(Solo.parametro('id'));

    if (!laudo) {
        raiz.innerHTML =
            '<h1 class="titulo">Laudo não encontrado</h1>' +
            '<p class="lead-suave">Não achamos esse laudo. Volte para a lista.</p>' +
            '<p><a class="btn btn-primario" href="painel.html">Meus laudos</a></p>';
        return;
    }

    var NUTRIENTES = SOLO_DADOS.nutrientes;
    var digitados = {}, erros = {}, erroGeral = null;

    NUTRIENTES.forEach(function (n) {
        digitados[n.codigo] = laudo.valores[n.codigo] !== undefined ? SoloAnalise.numeroBR(laudo.valores[n.codigo]) : '';
    });

    function desenhar() {
        var avisoErro = '';
        if (erroGeral) {
            avisoErro = '<div class="alerta alerta-erro" role="alert">' + Solo.icone('alert') + '<div>' + Solo.esc(erroGeral) + '</div></div>';
        } else if (Object.keys(erros).length) {
            avisoErro = '<div class="alerta alerta-erro" role="alert">' + Solo.icone('alert') + '<div>Confira os campos marcados abaixo.</div></div>';
        }

        var campos = NUTRIENTES.map(function (n) {
            var id = 'v-' + n.codigo, erro = erros[n.codigo];
            return '<div class="campo campo-nutriente' + (erro ? ' campo-erro' : '') + '">' +
                '<label class="campo-rotulo" for="' + id + '"><span class="simbolo">' + Solo.esc(n.simbolo) + '</span> ' + Solo.esc(n.nome) + '</label>' +
                '<p class="legenda" id="' + id + '-un">Unidade: ' + Solo.esc(n.unidade) + '</p>' +
                '<input class="campo-input" id="' + id + '" data-codigo="' + n.codigo + '" type="text" inputmode="decimal" autocomplete="off" maxlength="12" ' +
                'value="' + Solo.esc(digitados[n.codigo]) + '" aria-describedby="' + id + '-un' + (erro ? ' ' + id + '-erro' : '') + '"' + (erro ? ' aria-invalid="true"' : '') + '>' +
                (erro ? '<p class="campo-msg" id="' + id + '-erro">' + Solo.icone('alert') + '<span>' + Solo.esc(erro) + '</span></p>' : '') +
                '</div>';
        }).join('');

        var textoLido = laudo.textoExtraido
            ? '<details class="texto-lido"><summary>Ver o texto que lemos do arquivo</summary><pre>' + Solo.esc(laudo.textoExtraido.slice(0, 3000)) + '</pre></details>'
            : '';

        raiz.innerHTML =
            '<a class="link-voltar" href="painel.html">' + Solo.icone('back') + ' Voltar</a>' +
            '<h1 class="titulo">Confira os números</h1>' +
            '<p class="lead-suave"><strong>' + Solo.esc(laudo.nomeArea) + '</strong>. Veja se os valores abaixo batem com o papel do laboratório. Corrija o que estiver errado e deixe em branco o que não encontrar.</p>' +
            avisoErro +
            '<form id="form-revisar" novalidate><div class="grade-nutrientes-form">' + campos + '</div>' +
            '<button class="btn btn-acao btn-cheio" type="submit">Gerar relatório</button></form>' + textoLido;

        document.getElementById('form-revisar').addEventListener('submit', function (ev) {
            ev.preventDefault();
            confirmar();
        });
    }

    function confirmar() {
        var aceitos = {};
        erros = {};
        erroGeral = null;

        NUTRIENTES.forEach(function (n) {
            var campo = document.getElementById('v-' + n.codigo);
            var bruto = campo.value.trim();
            digitados[n.codigo] = bruto;
            if (bruto === '') { return; }                  // em branco = "não tenho esse valor"
            var valor = SoloAnalise.decimalBR(bruto);
            if (valor === null) {
                erros[n.codigo] = 'Digite só números. Exemplo: 5,2';
            } else if (valor < n.valMin || valor > n.valMax) {
                erros[n.codigo] = 'Esse valor parece fora do normal (de ' + SoloAnalise.numeroBR(n.valMin) + ' a ' +
                    SoloAnalise.numeroBR(n.valMax) + '). Confira o laudo.';
            } else {
                aceitos[n.codigo] = Math.round(valor * 100) / 100;
            }
        });

        if (!Object.keys(erros).length && Object.keys(aceitos).length < 3) {
            erroGeral = 'Informe pelo menos 3 valores para gerar o relatório.';
        }

        if (Object.keys(erros).length || erroGeral) {
            desenhar();
            var primeiro = raiz.querySelector('[aria-invalid="true"]') || raiz.querySelector('.alerta');
            if (primeiro) { primeiro.scrollIntoView({ block: 'center' }); }
            return;
        }

        Solo.laudos.atualizar(laudo.id, { valores: aceitos, status: 'pronto', motivoErro: null });
        window.location.href = 'relatorio.html?id=' + laudo.id;
    }

    desenhar();
})();
