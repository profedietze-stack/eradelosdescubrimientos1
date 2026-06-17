const MAX_LOG = 100;
const errorLog = [];

function _addEntry(level, source, message, stack) {
    errorLog.unshift({ level, source, message, stack, time: new Date().toISOString() });
    if (errorLog.length > MAX_LOG) errorLog.length = MAX_LOG;
    if (level === 'error') {
        try {
            const prev = JSON.parse(sessionStorage.getItem('_debugErrors') || '[]');
            prev.unshift({ level, source, message, time: Date.now() });
            sessionStorage.setItem('_debugErrors', JSON.stringify(prev.slice(0, 20)));
        } catch {}
    }
}

const _origConsoleError = console.error;
console.error = (...args) => {
    _addEntry('error', 'console', args.map(a => typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a)).join(' '));
    _origConsoleError.apply(console, args);
};

const _origConsoleWarn = console.warn;
console.warn = (...args) => {
    _addEntry('warn', 'console', args.join(' '));
    _origConsoleWarn.apply(console, args);
};

window.addEventListener('error', e => {
    _addEntry('error', 'uncaught', e.message, e.error?.stack);
});

window.addEventListener('unhandledrejection', e => {
    _addEntry('error', 'promise', e.reason?.message || String(e.reason), e.reason?.stack);
});

export function getErrorLog() { return [...errorLog]; }
export function clearErrorLog() { errorLog.length = 0; }
