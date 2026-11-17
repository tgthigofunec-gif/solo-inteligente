/* Login FICTÍCIO: confere e-mail e senha com a conta de demonstração (dados.js).
   Isto é só para a apresentação: em um sistema real, a senha NUNCA fica no código. */
(function () {
    'use strict';

    if (Solo.logado()) { window.location.replace('painel.html'); return; }

    var form = document.getElementById('form-login');
    var campoEmail = form.querySelector('[data-campo="email"]');
    var campoSenha = form.querySelector('[data-campo="senha"]');
    var inputEmail = document.getElementById('f-email');
    var inputSenha = document.getElementById('f-senha');
    var erroGeral = document.getElementById('erro-geral');
    var erroGeralTexto = erroGeral.querySelector('[data-texto]');

    document.getElementById('conta-email').textContent = SOLO_DADOS.conta.email;
    document.getElementById('conta-senha').textContent = SOLO_DADOS.conta.senha;

    function tentarEntrar() {
        var email = inputEmail.value.trim().toLowerCase();
        var senha = inputSenha.value;
        var ok = true;

        erroGeral.hidden = true;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Solo.erroCampo(campoEmail, 'Esse e-mail parece incompleto. Exemplo: maria@email.com');
            ok = false;
        } else { Solo.erroCampo(campoEmail, null); }

        if (senha === '') {
            Solo.erroCampo(campoSenha, 'Digite a sua senha.');
            ok = false;
        } else { Solo.erroCampo(campoSenha, null); }

        if (!ok) { return; }

        if (Solo.entrar(email, senha)) {
            Solo.flash('ok', 'Você entrou na conta de demonstração.');
            window.location.href = 'painel.html';
        } else {
            erroGeralTexto.textContent = 'E-mail ou senha incorretos. Use a conta de demonstração mostrada abaixo do formulário.';
            erroGeral.hidden = false;
        }
    }

    form.addEventListener('submit', function (ev) { ev.preventDefault(); tentarEntrar(); });

    document.getElementById('preencher-demo').addEventListener('click', function () {
        inputEmail.value = SOLO_DADOS.conta.email;
        inputSenha.value = SOLO_DADOS.conta.senha;
        tentarEntrar();
    });
})();
