/* Efeitos visuais: revelar ao rolar e contadores. Sem dependências. */
(function () {
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var itens = document.querySelectorAll('.revelar, .card');
    if (!('IntersectionObserver' in window) || reduz) {
        itens.forEach(function (el) { el.classList.add('visivel'); });
    } else {
        var obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
        itens.forEach(function (el) { el.classList.add('animar'); obs.observe(el); });
    }
    document.querySelectorAll('[data-contar]').forEach(function (el) {
        var alvo = +el.dataset.contar, suf = el.dataset.sufixo || '';
        if (reduz) { el.textContent = alvo + suf; return; }
        var t0 = null;
        function passo(t) {
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / 1200, 1);
            el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))) + suf;
            if (p < 1) requestAnimationFrame(passo);
        }
        requestAnimationFrame(passo);
    });
    var topo = document.querySelector('.topo');
    if (topo) addEventListener('scroll', function () { topo.classList.toggle('rolado', scrollY > 10); }, { passive: true });
})();
