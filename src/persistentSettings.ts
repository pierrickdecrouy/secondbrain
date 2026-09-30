export function loadSettingSync<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw !== null) return JSON.parse(raw) as T;
    } catch (error) { console.error("Ignored error:", error); }
    return fallback;
}

export async function loadSettingAsync<T>(key: string, fallback: T): Promise<T> {
    try {
        const fromElectron = await window.electronAPI?.loadSetting<T>(key);
        if (fromElectron !== undefined) {
            return fromElectron;
        }
    } catch (error) { console.error("Ignored error:", error); }

    return loadSettingSync(key, fallback);
}

export async function saveSettingAsync<T>(key: string, value: T): Promise<void> {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) { console.error("Ignored error:", error); }

    try {
        await window.electronAPI?.saveSetting(key, value);
    } catch (error) { console.error("Ignored error:", error); }
}

export async function removeSettingAsync(key: string): Promise<void> {
    try {
        localStorage.removeItem(key);
    } catch (error) { console.error("Ignored error:", error); }

    try {
        await window.electronAPI?.removeSetting(key);
    } catch (error) { console.error("Ignored error:", error); }
}
