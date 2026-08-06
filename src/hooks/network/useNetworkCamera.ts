import { useRef } from 'react';

export const useNetworkCamera = (use3D: boolean) => {
    const fgRef = useRef<any>(null);
    const hasCenteredRef = useRef(false);

    const handleZoomIn = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoom) {
            const currentZoom = fgRef.current.zoom();
            fgRef.current.zoom(currentZoom * 1.5, 400);
        } else if (use3D && fgRef.current.cameraPosition) {
            const pos = fgRef.current.cameraPosition();
            fgRef.current.cameraPosition({ x: pos.x * 0.7, y: pos.y * 0.7, z: pos.z * 0.7 }, { x: 0, y: 0, z: 0 }, 400);
        }
    };

    const handleZoomOut = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoom) {
            const currentZoom = fgRef.current.zoom() as unknown as number;
            fgRef.current.zoom(currentZoom / 1.5, 400);
        } else if (use3D && fgRef.current.cameraPosition) {
            const pos = fgRef.current.cameraPosition();
            fgRef.current.cameraPosition({ x: pos.x * 1.4, y: pos.y * 1.4, z: pos.z * 1.4 }, { x: 0, y: 0, z: 0 }, 400);
        }
    };

    const handleFitView = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoomToFit) {
            fgRef.current.zoomToFit(400, 50);
        } else if (use3D && fgRef.current.cameraPosition) {
            // For 3D, move camera to a default reasonable distance
            fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
        }
    };

    const handleEngineStop = (activeNodeId?: string | null) => {
        if (!hasCenteredRef.current && fgRef.current && !activeNodeId && !use3D && fgRef.current.zoomToFit) {
            fgRef.current.zoomToFit(400, 50);
            hasCenteredRef.current = true;
        } else if (!hasCenteredRef.current && fgRef.current && !activeNodeId && use3D && fgRef.current.cameraPosition) {
            fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
            hasCenteredRef.current = true;
        }
    };

    return {
        fgRef,
        hasCenteredRef,
        handleZoomIn,
        handleZoomOut,
        handleFitView,
        handleEngineStop
    };
};
