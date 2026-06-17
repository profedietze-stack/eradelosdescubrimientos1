(function () {
    'use strict';

    const GAP    = 10;
    const MARGIN = 8;

    const STAT_COLORS = {
        moral:       { bg:'#2d0a0a', border:'#e74c3c', accent:'#ff8080' },
        suministros: { bg:'#1a1200', border:'#e8b420', accent:'#f5d060' },
        integridad:  { bg:'#081828', border:'#3498db', accent:'#7ec8f5' },
        autoridad:   { bg:'#150828', border:'#9b59b6', accent:'#cc88ee' },
    };

    function crearTooltip(id) {
        const el = document.createElement('div');
        el.id = id;
        Object.assign(el.style, {
            position:      'fixed',
            zIndex:        '999999',
            pointerEvents: 'none',
            maxWidth:      'min(300px, 88vw)',
            whiteSpace:    'normal',
            wordBreak:     'normal',
            lineHeight:    '1.55',
            padding:       '9px 13px',
            borderRadius:  '8px',
            fontSize:      'clamp(0.73rem, 1.4vw, 0.85rem)',
            fontFamily:    'var(--font-body, Georgia, serif)',
            fontStyle:     'italic',
            boxShadow:     '0 6px 28px rgba(0,0,0,0.55)',
            opacity:       '0',
            top:           '0',
            left:          '0',
            transition:    'opacity 0.14s ease',
            visibility:    'hidden',
        });
        document.body.appendChild(el);
        return el;
    }

    let wordTip  = null;
    let statTip  = null;

    function getWordTip() {
        if (!wordTip) {
            wordTip = document.getElementById('word-tooltip') || crearTooltip('word-tooltip');
            Object.assign(wordTip.style, {
                position:      'fixed',
                zIndex:        '999999',
                pointerEvents: 'none',
                background:    'var(--ink, #1a0e05)',
                color:         'var(--parchment-light, #fdf8ee)',
                border:        '1px solid rgba(200,150,12,0.4)',
                maxWidth:      'min(300px, 88vw)',
                whiteSpace:    'normal',
                wordBreak:     'normal',
                lineHeight:    '1.55',
                padding:       '8px 12px',
                borderRadius:  '7px',
                fontSize:      'clamp(0.73rem, 1.4vw, 0.85rem)',
                fontFamily:    'var(--font-body, Georgia, serif)',
                fontStyle:     'italic',
                boxShadow:     '0 6px 28px rgba(0,0,0,0.55)',
                opacity:       '0',
                top:           '0',
                left:          '0',
                transition:    'opacity 0.14s ease',
                visibility:    'hidden',
                display:       'block',
            });
        }
        return wordTip;
    }

    function getStatTip() {
        if (!statTip) {
            statTip = document.getElementById('stat-tooltip') || crearTooltip('stat-tooltip');
            Object.assign(statTip.style, {
                position:      'fixed',
                zIndex:        '999999',
                pointerEvents: 'none',
                opacity:       '0',
                top:           '0',
                left:          '0',
                transition:    'opacity 0.14s ease',
                visibility:    'hidden',
                display:       'block',
            });
        }
        return statTip;
    }

    function posicionarTip(tip, anchorRect) {
        tip.style.visibility = 'hidden';
        tip.style.opacity    = '0';
        tip.style.display    = 'block';

        const tipW = tip.offsetWidth  || 280;
        const tipH = tip.offsetHeight || 80;
        const vw   = window.innerWidth;
        const vh   = window.innerHeight;

        let left = anchorRect.left + anchorRect.width / 2 - tipW / 2;
        left = Math.max(MARGIN, Math.min(left, vw - tipW - MARGIN));

        const spaceAbove = anchorRect.top  - GAP;
        const spaceBelow = vh - anchorRect.bottom - GAP;
        let top;
        if (spaceAbove >= tipH) {
            top = anchorRect.top - tipH - GAP;
        } else if (spaceBelow >= tipH) {
            top = anchorRect.bottom + GAP;
        } else if (spaceAbove >= spaceBelow) {
            top = Math.max(MARGIN, anchorRect.top - tipH - GAP);
        } else {
            top = Math.min(vh - tipH - MARGIN, anchorRect.bottom + GAP);
        }

        tip.style.left = left + 'px';
        tip.style.top  = top  + 'px';
    }

    function mostrarWordTip(anchor) {
        const text = anchor.getAttribute('data-tip');
        if (!text) return;
        const tip = getWordTip();
        tip.textContent = text;
        posicionarTip(tip, anchor.getBoundingClientRect());
        tip.style.visibility = 'visible';
        tip.style.opacity    = '1';
    }

    function mostrarStatTip(cell) {
        const text = cell.getAttribute('data-stat-tip');
        if (!text) return;
        const tip  = getStatTip();
        const stat = cell.getAttribute('data-stat') || 'moral';
        const col  = STAT_COLORS[stat] || STAT_COLORS.moral;

        const dashIdx = text.indexOf(' \u2014 ');
        tip.innerHTML = dashIdx !== -1
            ? '<strong style="display:block;font-family:var(--font-header,serif);font-style:normal;'
            + 'font-size:0.95em;letter-spacing:0.06em;color:' + col.accent + ';margin-bottom:4px;">'
            + text.slice(0, dashIdx) + '</strong>' + text.slice(dashIdx + 3)
            : text;

        Object.assign(tip.style, {
            background:   col.bg,
            borderColor:  col.border,
            border:       '2px solid ' + col.border,
            color:        'rgba(253,248,238,0.92)',
            fontFamily:   'var(--font-body, Georgia, serif)',
            fontStyle:    'italic',
            fontSize:     'clamp(0.73rem,1.4vw,0.85rem)',
            lineHeight:   '1.55',
            padding:      '10px 14px',
            borderRadius: '9px',
            maxWidth:     'min(320px,90vw)',
            whiteSpace:   'normal',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
        });

        posicionarTip(tip, cell.getBoundingClientRect());
        tip.style.visibility = 'visible';
        tip.style.opacity    = '1';
    }

    function ocultarWordTip() {
        if (wordTip) { wordTip.style.opacity = '0'; wordTip.style.visibility = 'hidden'; }
        activeWord = null;
    }
    function ocultarStatTip() {
        if (statTip) { statTip.style.opacity = '0'; statTip.style.visibility = 'hidden'; }
        activeStat = null;
    }

    let activeWord = null;
    let activeStat = null;
    let hideWordTimer = null;
    let hideStatTimer = null;

    function init() {
        document.addEventListener('mouseover', function (e) {
            const term = e.target.closest('.tooltip-term');
            if (term) {
                clearTimeout(hideWordTimer);
                activeWord = term;
                mostrarWordTip(term);
                return;
            }
            const cell = e.target.closest('.stat-cell[data-stat-tip]');
            if (cell) {
                clearTimeout(hideStatTimer);
                activeStat = cell;
                mostrarStatTip(cell);
            }
        }, true);

        document.addEventListener('mouseout', function (e) {
            if (e.target.closest('.tooltip-term')) {
                hideWordTimer = setTimeout(ocultarWordTip, 100);
            }
            if (e.target.closest('.stat-cell[data-stat-tip]')) {
                hideStatTimer = setTimeout(ocultarStatTip, 100);
            }
        }, true);

        document.addEventListener('touchstart', function (e) {
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target) return;

            const term = target.closest('.tooltip-term');
            const cell = target.closest('.stat-cell[data-stat-tip]');

            if (term) {
                if (activeWord === term) {
                    ocultarWordTip();
                } else {
                    ocultarWordTip();
                    ocultarStatTip();
                    activeWord = term;
                    mostrarWordTip(term);
                }
                return;
            }

            if (cell) {
                if (activeStat === cell) {
                    ocultarStatTip();
                } else {
                    ocultarStatTip();
                    ocultarWordTip();
                    activeStat = cell;
                    mostrarStatTip(cell);
                }
                return;
            }

            if (activeWord) ocultarWordTip();
            if (activeStat) ocultarStatTip();
        }, { passive: true });

        function reposicionar() {
            if (activeWord && wordTip && wordTip.style.visibility === 'visible') {
                posicionarTip(wordTip, activeWord.getBoundingClientRect());
                wordTip.style.visibility = 'visible';
                wordTip.style.opacity = '1';
            }
            if (activeStat && statTip && statTip.style.visibility === 'visible') {
                posicionarTip(statTip, activeStat.getBoundingClientRect());
                statTip.style.visibility = 'visible';
                statTip.style.opacity = '1';
            }
        }
        window.addEventListener('scroll',   reposicionar, { passive: true, capture: true });
        window.addEventListener('resize',   reposicionar, { passive: true });
        window.addEventListener('touchmove',function() { ocultarWordTip(); ocultarStatTip(); }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
