import { useState, useEffect } from 'react';

export const useNetworkDimensions = (
    containerRef: React.RefObject<HTMLDivElement>,
    fgRef: React.MutableRefObject<any>
) => {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Auto-resize
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });
        resizeObserver.observe(containerRef.current);

        // Visibility / intersection for performance (P-4)
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (fgRef.current) {
                    if (entry.isIntersecting && document.visibilityState === 'visible') {
                        fgRef.current.resumeAnimation?.();
                    } else {
                        fgRef.current.pauseAnimation?.();
                    }
                }
            });
        }, { threshold: 0.1 });
        intersectionObserver.observe(containerRef.current);

        const handleVisibilityChange = () => {
            if (fgRef.current) {
                if (document.visibilityState === 'visible') {
                    fgRef.current.resumeAnimation?.();
                } else {
                    fgRef.current.pauseAnimation?.();
                }
            }
        };
        
        const handleHeavyIndexing = (e: Event) => {
            const customEvent = e as CustomEvent<{ isIndexing: boolean }>;
            if (fgRef.current) {
                if (customEvent.detail.isIndexing) {
                    fgRef.current.pauseAnimation?.();
                } else if (document.visibilityState === 'visible') {
                    fgRef.current.resumeAnimation?.();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('heavy-indexing-status', handleHeavyIndexing);

        return () => {
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('heavy-indexing-status', handleHeavyIndexing);
        };
    }, [containerRef, fgRef]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return {
        dimensions,
        isFullscreen,
        toggleFullscreen
    };
};
