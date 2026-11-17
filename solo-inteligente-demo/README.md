# Solo Inteligente (versão demonstração)

Site para pequenos produtores rurais: a pessoa envia o laudo de análise de solo (PDF, JPG ou PNG), confere os números lidos e recebe um relatório com a qualidade do solo, o status de cada nutriente, as culturas mais compatíveis e recomendações de manejo.

Esta versão é **só front-end** (HTML, CSS e JavaScript). **Não tem PHP, servidor nem banco de dados.** O login é uma conta fictícia e os laudos ficam guardados no próprio navegador. Foi feita para apresentação e trabalho de faculdade.

> As faixas de referência e as exigências das culturas são **didáticas e simplificadas**. Não substituem tabelas oficiais (como a do CFSEMG) nem um agrônomo. O próprio site avisa isso.

---

## 1. Como abrir

**Jeito mais simples:** dê dois cliques em `index.html`. Funciona direto no navegador, sem instalar nada.

**Jeito mais "de site de verdade"** (opcional), com um servidor local do Python, que já vem no Linux Mint:

```bash
cd solo-inteligente-demo
python3 -m http.server 8000
```

Depois abra **http://localhost:8000**. Para parar, Ctrl+C.

### Conta de demonstração

| | |
|---|---|
| E-mail | `demo@solointeligente.com` |
| Senha | `demo1234` |

Na tela de login há também o botão **"Entrar com a conta de demonstração"**, que preenche tudo sozinho.

---

## 2. Roteiro para apresentar (2 minutos)

1. Na página inicial, explique a proposta e clique em **Testar a demonstração**.
2. Entre com a conta fictícia. O painel já vem com 3 laudos de exemplo, mostrando os 3 estados: *Relatório pronto*, *Confirmar valores* (aparece ao enviar um novo) e *Não conseguimos ler*.
3. Abra o relatório de **Talhão Norte**: nota, pontos de atenção, barras dos nutrientes, culturas compatíveis e o que fazer.
4. Volte e clique em **Testar com um laudo de exemplo** (funciona sem internet). Mostre a tela **"Confira os números"**, que existe porque leitura automática erra. Mude o pH para `6,2`, gere o relatório e compare com o anterior.
5. Se tiver internet, envie um **PDF ou foto de laudo de verdade** e mostre a leitura automática.
6. Clique em **Salvar como PDF** no relatório (usa a impressão do navegador, e o cabeçalho e os botões somem sozinhos).
7. No painel, **"Restaurar os dados de demonstração"** limpa tudo para a próxima apresentação.

---

## 3. Estrutura do projeto

```
solo-inteligente-demo/
├── index.html          página inicial
├── login.html          login com a conta fictícia
├── painel.html         envio de laudo + lista de laudos
├── revisar.html        conferir/corrigir os números lidos
├── relatorio.html      o relatório (e versão para imprimir)
└── assets/
    ├── css/style.css   identidade visual (cores, fontes, componentes)
    └── js/
        ├── dados.js      conta fictícia, faixas dos nutrientes, culturas, laudo de exemplo
        ├── analise.js    leitura do texto do laudo + motor de análise (regras)
        ├── app.js        partes comuns: sessão fictícia, "banco" no navegador, cabeçalho e rodapé
        ├── login.js      lógica da tela de login
        ├── painel.js     lista de laudos + envio (PDF.js e OCR)
        ├── revisar.js    tela de conferência dos valores
        └── relatorio.js  monta o relatório
```

Cada página HTML carrega, nesta ordem: `dados.js`, `analise.js`, `app.js` e o script da própria página.

---

## 4. O que é de mentira e o que é de verdade

**De mentira (só para a demonstração):**

- **Login:** `app.js` compara o que foi digitado com a conta que está escrita em `dados.js`. Qualquer pessoa que abrir o código vê a senha. Em um sistema real, a senha nunca fica no código: é conferida no servidor, guardada como hash.
- **Banco de dados:** os laudos ficam no `localStorage` do navegador (e a "sessão" no `sessionStorage`). Nada é enviado para servidor algum. Se limpar os dados do navegador, os laudos somem (e o botão "Restaurar" recria os 3 de exemplo).
- **Proteção das páginas:** o redirecionamento para o login é feito em JavaScript. Quem sabe mexer no navegador consegue contornar. Serve para demonstrar o fluxo, não para proteger dados.

**De verdade (funciona de fato):**

- **Leitura do laudo, no navegador:**
  - PDF com texto: [PDF.js](https://mozilla.github.io/pdf.js/) extrai o texto, agrupando os pedaços por linha.
  - PDF escaneado ou foto: [Tesseract.js](https://tesseract.projectnaptha.com/) faz OCR em português. Fotos grandes são reduzidas antes, para não travar o celular.
  - As bibliotecas vêm de CDN e **só são baixadas quando necessárias**, então precisa de internet para ler arquivos reais. O **laudo de exemplo não precisa de internet.**
- **Extração dos valores:** `analise.js` procura "rótulo + número" (ex.: `Fósforo ..... 4,0 mg/dm³`) e converte unidades (K em cmolc/dm³ para mg/dm³, mmolc para cmolc, g/dm³ para dag/kg).
- **Análise:** regras explícitas, sem inteligência artificial. O mesmo laudo sempre gera o mesmo relatório.

---

## 5. Como a análise funciona

1. **Classificação:** cada valor é comparado com `baixoMax` e `adequadoMax` do nutriente (em `dados.js`) e vira *baixo*, *adequado* ou *alto*.
2. **"Alto" nem sempre é ruim:** `baixoEProblema` e `altoEProblema` dizem o que conta como problema em cada nutriente (alumínio alto é ruim; matéria orgânica alta é boa). Isso define os *pontos de atenção* e as recomendações.
3. **Nota de 0 a 100:** cada nutriente vale 100 se está bem, 40 se está baixo e isso é problema, 60 se está alto e isso é problema. A nota é a média: **80 ou mais = "Boa"**, **55 ou mais = "Regular"**, abaixo disso **"Precisa de correção"**.
4. **Culturas:** para cada cultura, conta quantas exigências o solo atende. 85% ou mais = *compatibilidade alta*, 55% ou mais = *compatível com ajustes*, abaixo disso *exige muita correção*.
5. **Recomendações:** textos de `dados.js`, **sem dose numérica** de propósito. Quantidade de calcário ou adubo depende de dados que um laudo simplificado não traz.

### Editar as referências

Tudo está em `assets/js/dados.js`. Exemplo de nova cultura (basta acrescentar na lista `culturas`):

```js
{ nome: 'Alface', descricao: 'Hortaliça de folha',
  exigencias: { ph: [6.0, 6.8], p: [30, null], k: [120, null], ca: [3.0, null],
                mg: [1.0, null], al: [null, 0.1], mo: [3.0, null] } }
```

Cada exigência é `[mínimo, máximo]`, e `null` significa "sem limite". Para mudar a conta fictícia, edite o objeto `conta` no topo do mesmo arquivo.

---

## 6. Limitações (boas para citar no trabalho)

- Cada laboratório tem um layout. A leitura funciona bem em linhas como `Fósforo ..... 4,0 mg/dm³` e mal em tabelas em colunas. Por isso existe a tela de conferência.
- As faixas reais dependem do método (Mehlich-1, resina...), do teor de argila e da cultura. Aqui foram simplificadas.
- Não há cálculo de calagem (V%, CTC, PRNT) nem de adubação.
- Sem servidor, não existe cadastro real, recuperação de senha, nem acesso aos laudos de outros aparelhos.

## 7. Como seria a versão real

Para virar um sistema de verdade, falta um **backend** (qualquer linguagem) com **banco de dados** e **autenticação**: contas reais com senha em hash, laudos salvos por usuário no servidor, validação do arquivo enviado e HTTPS. A lógica de leitura e análise deste projeto (`analise.js` e `dados.js`) pode ser portada quase como está.

---

## 8. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Ao enviar PDF ou foto, vira "Não conseguimos ler" | Sem internet para baixar PDF.js / Tesseract, ou laudo em formato difícil | Conecte à internet, ou use "Digitar valores" / o laudo de exemplo |
| A lista de laudos sumiu | Dados do navegador foram limpos | Entre de novo e use "Restaurar os dados de demonstração" |
| Fonte diferente da prevista | Sem internet para o Google Fonts | Sem problema: o site usa a fonte do sistema |
| Mensagem de redirecionamento ao abrir `painel.html` | Você não "entrou" na conta | Faça o login pela tela de entrada |
| Valores lidos errados ou faltando | Layout do laudo diferente ou foto ruim | Corrija em "Confira os números"; veja o texto lido em "Ver o texto que lemos do arquivo" |
# solo-inteligente
