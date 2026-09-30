type IdleCallback = (isIdle: boolean) => void;

class IdleManager {
    private isIdle: boolean = false;
    private idleTimeout: NodeJS.Timeout | null = null;
    private listeners: Set<IdleCallback> = new Set();
    private readonly IDLE_THRESHOLD = 3000; // 3 seconds of inactivity
    
    constructor() {
        if (typeof window !== 'undefined') {
            this.setupListeners();
            this.resetIdleTimer();
        }
    }
    
    private setupListeners() {
        // We listen to major user interaction events
        const events = ['mousemove', 'keydown', 'wheel', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, this.resetIdleTimer.bind(this), { passive: true });
        });
    }
    
    private resetIdleTimer() {
        if (this.isIdle) {
            this.isIdle = false;
            this.notifyListeners();
        }
        
        if (this.idleTimeout) clearTimeout(this.idleTimeout);
        
        this.idleTimeout = setTimeout(() => {
            this.isIdle = true;
            this.notifyListeners();
        }, this.IDLE_THRESHOLD);
    }
    
    public subscribe(callback: IdleCallback) {
        this.listeners.add(callback);
        // Fire immediately with current state
        callback(this.isIdle);
        return () => this.listeners.delete(callback);
    }
    
    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.isIdle));
    }
    
    /**
     * Wait until the system is idle. 
     * Resolves immediately if already idle.
     */
    public async waitUntilIdle(): Promise<void> {
        if (this.isIdle) return Promise.resolve();
        
        return new Promise(resolve => {
            const unsubscribe = this.subscribe((idle) => {
                if (idle) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }
}

export const idleManager = new IdleManager();
