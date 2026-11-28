// Adapts Electron's safeStorage to the small interface the settings store uses.
// Fails closed: when the OS cannot protect a secret, nothing is encrypted and nothing is saved.

function createElectronSecrets(safeStorage, platform = process.platform) {
    function unavailableReason() {
        if (!safeStorage.isEncryptionAvailable()) {
            return 'Secure password storage (Electron safeStorage) is not available on this system, so a password cannot be saved. Connect without a password or enable the operating system keyring.';
        }
        if (platform === 'linux' && typeof safeStorage.getSelectedStorageBackend === 'function') {
            const backend = safeStorage.getSelectedStorageBackend();
            if (backend === 'basic_text' || backend === 'unknown') {
                return 'No operating system keyring was found (Electron safeStorage would only obscure the password with a built-in key), so a password cannot be saved. Install or unlock a keyring such as GNOME Keyring or KWallet, or connect without a password.';
            }
        }
        return '';
    }

    return {
        isAvailable: () => unavailableReason() === '',
        unavailableReason,
        encrypt: (text) => safeStorage.encryptString(text),
        decrypt: (buffer) => safeStorage.decryptString(buffer),
    };
}

module.exports = { createElectronSecrets };
