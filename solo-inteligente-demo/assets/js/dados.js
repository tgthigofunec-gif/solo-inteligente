/* =====================================================================
   Solo Inteligente (versão demonstração): dados do sistema.

   Aqui ficam, em vez de um banco de dados:
   - a conta fictícia de demonstração;
   - as faixas de referência de cada nutriente;
   - as exigências de cada cultura;
   - um laudo de exemplo.

   ATENÇÃO: as faixas e exigências são DIDÁTICAS e simplificadas.
   Não substituem tabelas oficiais (ex.: CFSEMG) nem um agrônomo.
   ===================================================================== */
window.SOLO_DADOS = {

    // Conta fictícia (qualquer pessoa que abrir o código consegue ver isto,
    // então NUNCA use esse modelo de login em um sistema real).
    conta: {
        nome: 'Maria Demonstração',
        email: 'demo@solointeligente.com',
        senha: 'demo1234'
    },

    /* Para cada nutriente:
       baixoMax     = abaixo disso é "baixo"
       adequadoMax  = até aqui é "adequado"; acima é "alto"
       baixoEProblema / altoEProblema = se estar baixo / alto é problema
       valMin / valMax = limites plausíveis (validação do que for digitado ou lido) */
    nutrientes: [
        {
            codigo: 'ph', nome: 'Acidez do solo', nomeCurto: 'pH', simbolo: 'pH', unidade: 'em água',
            escalaMin: 4.0, baixoMax: 5.5, adequadoMax: 6.5,
            baixoEProblema: true, altoEProblema: true, valMin: 3.0, valMax: 9.5,
            significado: {
                baixo: 'Baixo: o solo está ácido. A acidez atrapalha as raízes e faz a planta aproveitar pior os adubos.',
                adequado: 'Adequado: acidez em boa faixa para a maioria das culturas.',
                alto: 'Alto: o solo está pouco ácido, quase alcalino. Isso pode reduzir a disponibilidade de alguns nutrientes.'
            },
            acao: {
                baixo: 'Fazer a correção da acidez (calagem). O técnico define o tipo e a quantidade de calcário para a sua área.',
                alto: 'Evitar calcário por enquanto e pedir orientação técnica antes de adubar.'
            }
        },
        {
            codigo: 'p', nome: 'Fósforo', simbolo: 'P', unidade: 'mg/dm³',
            escalaMin: 0, baixoMax: 10, adequadoMax: 30,
            baixoEProblema: true, altoEProblema: true, valMin: 0, valMax: 500,
            significado: {
                baixo: 'Baixo: falta fósforo. Ele ajuda no enraizamento e na formação de flores e grãos.',
                adequado: 'Adequado: fósforo em boa quantidade.',
                alto: 'Alto: fósforo em excesso. Não falta para a planta, e adubar mais seria gasto à toa.'
            },
            acao: {
                baixo: 'Incluir adubação com fósforo no plantio, na dose indicada por um técnico.',
                alto: 'Não aplicar mais fósforo por enquanto.'
            }
        },
        {
            codigo: 'k', nome: 'Potássio', simbolo: 'K', unidade: 'mg/dm³',
            escalaMin: 0, baixoMax: 60, adequadoMax: 120,
            baixoEProblema: true, altoEProblema: true, valMin: 0, valMax: 1000,
            significado: {
                baixo: 'Baixo: falta potássio. Ele ajuda a planta a aguentar seca e doenças e a encher frutos e grãos.',
                adequado: 'Adequado: potássio em boa quantidade.',
                alto: 'Alto: potássio acima do necessário.'
            },
            acao: {
                baixo: 'Repor o potássio com adubação, na dose e na época indicadas por um técnico.',
                alto: 'Evitar adubo com potássio por enquanto: o excesso atrapalha a absorção de cálcio e magnésio.'
            }
        },
        {
            codigo: 'ca', nome: 'Cálcio', simbolo: 'Ca', unidade: 'cmolc/dm³',
            escalaMin: 0, baixoMax: 1.5, adequadoMax: 4.0,
            baixoEProblema: true, altoEProblema: false, valMin: 0, valMax: 30,
            significado: {
                baixo: 'Baixo: falta cálcio. Ele fortalece as raízes e a estrutura da planta.',
                adequado: 'Adequado: cálcio em boa quantidade.',
                alto: 'Alto, e isso não é problema: sobra cálcio para a planta.'
            },
            acao: {
                baixo: 'O calcário costuma repor o cálcio ao mesmo tempo em que corrige a acidez, conforme orientação técnica.',
                alto: null
            }
        },
        {
            codigo: 'mg', nome: 'Magnésio', simbolo: 'Mg', unidade: 'cmolc/dm³',
            escalaMin: 0, baixoMax: 0.5, adequadoMax: 1.5,
            baixoEProblema: true, altoEProblema: true, valMin: 0, valMax: 15,
            significado: {
                baixo: 'Baixo: falta magnésio. Ele é importante para a folha ficar verde e a planta fazer fotossíntese.',
                adequado: 'Adequado: magnésio em boa quantidade.',
                alto: 'Alto: magnésio em excesso pode atrapalhar a absorção de potássio.'
            },
            acao: {
                baixo: 'O calcário dolomítico pode repor o magnésio, conforme orientação técnica.',
                alto: 'Evitar calcário dolomítico por enquanto e pedir orientação técnica.'
            }
        },
        {
            codigo: 'al', nome: 'Alumínio', simbolo: 'Al', unidade: 'cmolc/dm³',
            escalaMin: 0, baixoMax: 0.2, adequadoMax: 0.5,
            baixoEProblema: false, altoEProblema: true, valMin: 0, valMax: 10,
            significado: {
                baixo: 'Baixo, e isso é bom: o alumínio não está atrapalhando as raízes.',
                adequado: 'Adequado: alumínio em nível tolerável para a maioria das culturas.',
                alto: 'Alto, e isso é ruim: o alumínio prejudica as raízes, e a planta aproveita mal a água e o adubo.'
            },
            acao: {
                baixo: null,
                alto: 'Corrigir a acidez (calagem) ajuda a reduzir o alumínio que faz mal à planta. O técnico define a quantidade.'
            }
        },
        {
            codigo: 'mo', nome: 'Matéria orgânica', genero: 'f', simbolo: 'MO', unidade: 'dag/kg',
            escalaMin: 0, baixoMax: 2.0, adequadoMax: 4.0,
            baixoEProblema: true, altoEProblema: false, valMin: 0, valMax: 15,
            significado: {
                baixo: 'Baixo: pouca matéria orgânica. O solo segura menos água e menos nutrientes.',
                adequado: 'Adequado: matéria orgânica em boa quantidade.',
                alto: 'Alto, e isso é bom: o solo guarda mais água e nutrientes.'
            },
            acao: {
                baixo: 'Aumentar a matéria orgânica com esterco curtido, adubo orgânico, palhada e cobertura do solo.',
                alto: null
            }
        }
    ],

    /* Exigências de cada cultura: código do nutriente -> [mínimo, máximo] (null = sem limite) */
    culturas: [
        { nome: 'Milho',    descricao: 'Cereal de ciclo anual',
          exigencias: { ph: [5.5, 7.0], p: [10, null], k: [60, null],  ca: [1.5, null], mg: [0.5, null], al: [null, 0.5], mo: [2.0, null] } },
        { nome: 'Feijão',   descricao: 'Leguminosa de ciclo curto',
          exigencias: { ph: [5.8, 6.8], p: [12, null], k: [80, null],  ca: [2.0, null], mg: [0.6, null], al: [null, 0.3], mo: [2.5, null] } },
        { nome: 'Soja',     descricao: 'Leguminosa de ciclo anual',
          exigencias: { ph: [5.8, 6.5], p: [12, null], k: [80, null],  ca: [2.5, null], mg: [0.8, null], al: [null, 0.2], mo: [2.0, null] } },
        { nome: 'Café',     descricao: 'Cultura perene',
          exigencias: { ph: [5.5, 6.5], p: [12, null], k: [100, null], ca: [3.0, null], mg: [1.0, null], al: [null, 0.3], mo: [3.0, null] } },
        { nome: 'Mandioca', descricao: 'Raiz tolerante a solos mais ácidos',
          exigencias: { ph: [5.0, 6.5], p: [6, null],  k: [40, null],  ca: [1.0, null], mg: [0.4, null], al: [null, 1.0], mo: [1.5, null] } },
        { nome: 'Tomate',   descricao: 'Hortaliça exigente em fertilidade',
          exigencias: { ph: [6.0, 6.8], p: [30, null], k: [120, null], ca: [3.0, null], mg: [1.0, null], al: [null, 0.1], mo: [3.0, null] } }
    ],

    /* Texto de um laudo fictício (botão "Testar com um laudo de exemplo") */
    laudoExemplo: [
        'LABORATÓRIO DE ANÁLISE DE SOLOS - LAUDO DE EXEMPLO',
        'Amostra: Talhão Norte',
        'pH em água ........ 5,2',
        'Fósforo (P - Mehlich-1) ........ 4,0 mg/dm³',
        'Potássio (K) ........ 96 mg/dm³',
        'Cálcio (Ca) ........ 3,4 cmolc/dm³',
        'Magnésio (Mg) ........ 0,9 cmolc/dm³',
        'Alumínio (Al) ........ 0,6 cmolc/dm³',
        'Matéria orgânica (MO) ........ 3,1 dag/kg'
    ].join('\n'),

    /* Laudos que já aparecem no painel ao entrar pela primeira vez (fictícios) */
    laudosIniciais: [
        { nomeArea: 'Talhão Norte', status: 'pronto', diasAtras: 4,
          valores: { ph: 5.2, p: 4, k: 96, ca: 3.4, mg: 0.9, al: 0.6, mo: 3.1 } },
        { nomeArea: 'Horta da Maria', status: 'pronto', diasAtras: 11,
          valores: { ph: 6.2, p: 28, k: 140, ca: 4.5, mg: 1.2, al: 0, mo: 4.6 } },
        { nomeArea: 'Pasto do Rio', status: 'erro', diasAtras: 20,
          motivoErro: 'Não encontramos os números dos nutrientes nesse arquivo. Tente uma foto mais nítida, com o papel inteiro e boa luz, ou digite os valores.' }
    ]
};
