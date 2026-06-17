let _storageDisponible = null;

function _checkStorage() {
    if (_storageDisponible !== null) return _storageDisponible;
    try {
        const testKey = '__colon_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        _storageDisponible = true;
    } catch {
        _storageDisponible = false;
    }
    return _storageDisponible;
}

function _lsSet(key, val) {
    try { localStorage.setItem(key, val); return true; }
    catch(e) { return false; }
}

function _lsGet(key) {
    try { return localStorage.getItem(key); }
    catch(e) { return null; }
}

export { _checkStorage, _lsSet, _lsGet, _storageDisponible };
