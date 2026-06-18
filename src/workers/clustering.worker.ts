import { detectClusters } from '../utils/clustering';

self.onmessage = (e: MessageEvent) => {
    const { nodes, links, minSize, id } = e.data;
    try {
        const clusters = detectClusters(nodes, links, minSize);
        self.postMessage({ type: 'SUCCESS', clusters, id });
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', error: error.message, id });
    }
};
