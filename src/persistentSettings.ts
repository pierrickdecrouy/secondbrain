export function loadSettingSync<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw !== null) return JSON.parse(raw) as T;
    } catch (error) {
    }
    return fallback;
}

export async function loadSettingAsync<T>(key: string, fallback: T): Promise<T> {
    try {
        const fromElectron = await window.electronAPI?.loadSetting<T>(key);
        if (fromElectron !== undefined) {
            return fromElectron;
        }
    } catch (error) {
    }

    return loadSettingSync(key, fallback);
}

export async function saveSettingAsync<T>(key: string, value: T): Promise<void> {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }

    try {
        await window.electronAPI?.saveSetting(key, value);
    } catch (error) {
    }
}

export async function removeSettingAsync(key: string): Promise<void> {
    try {
        localStorage.removeItem(key);
    } catch (error) {
    }

    try {
        await window.electronAPI?.removeSetting(key);
    } catch (error) {
    }
}
