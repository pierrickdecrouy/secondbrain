let nlpWorker: Worker | null = null;
const pendingRequests = new Map<string, { resolve: (tags: string[]) => void, reject: (err: Error) => void }>();

function getWorker(): Worker {
    if (!nlpWorker) {
        // Init the worker
        nlpWorker = new Worker(new URL('../workers/nlp.worker.ts', import.meta.url), { type: 'module' });
        
        nlpWorker.onmessage = (e: MessageEvent) => {
            const { id, keywords, error } = e.data;
            if (id && pendingRequests.has(id)) {
                const { resolve, reject } = pendingRequests.get(id)!;
                pendingRequests.delete(id);
                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(keywords || []);
                }
            }
        };

        nlpWorker.onerror = (err) => {
            console.error('NLP Worker error:', err);
        };
    }
    return nlpWorker;
}

/**
 * Extrait les mots clés pertinents (Asynchrone via Web Worker)
 */
export async function extractKeywordsAsync(
  title: string = '',
  subtitle: string = '',
  content: string = '',
  maxTags: number = 5
): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve([]);
            return;
        }

        const id = `nlp-${Date.now()}-${Math.random()}`;
        pendingRequests.set(id, { resolve, reject });
        
        const worker = getWorker();
        worker.postMessage({ id, title, subtitle, content, maxTags });
        
        // Timeout 5s
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                resolve([]); // Fallback silent on timeout
            }
        }, 5000);
    });
}
