import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

target = """    // ===============================================
    // RECENTER ON ACTIVE NODE
    // ===============================================
    useEffect(() => {
        if (activeNodeId && fgRef.current) {
            // Find node by id in structural data
            const targetNode = structuralData.nodes.find(n => n.id === activeNodeId) as GraphNode;
            if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
                if (use3D) {
                    // 3D camera positioning
                    const distance = 80;
                    const distRatio = 1 + distance / Math.hypot(targetNode.x || 1, targetNode.y || 1, (targetNode as any).z || 1);
                    fgRef.current.cameraPosition(
                        { 
                            x: targetNode.x * distRatio, 
                            y: targetNode.y * distRatio, 
                            z: ((targetNode as any).z || 0) * distRatio 
                        },
                        targetNode, // lookAt
                        1000  // duration ms
                    );
                } else {
                    // 2D centerAt
                    fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
                    // Optional: zoom in slightly
                    fgRef.current.zoom(2, 800);
                }
            }
        }
    }, [activeNodeId, structuralData.nodes, use3D]);"""

replacement = """    // ===============================================
    // RECENTER ON ACTIVE NODE
    // ===============================================
    useEffect(() => {
        if (activeNodeId && fgRef.current) {
            const centerCamera = () => {
                if (!fgRef.current) return;
                // Find node by id in structural data
                const targetNode = structuralData.nodes.find(n => n.id === activeNodeId) as GraphNode;
                if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
                    if (use3D) {
                        // 3D camera positioning
                        const distance = 80;
                        const distRatio = 1 + distance / Math.hypot(targetNode.x || 1, targetNode.y || 1, (targetNode as any).z || 1);
                        fgRef.current.cameraPosition(
                            { 
                                x: targetNode.x * distRatio, 
                                y: targetNode.y * distRatio, 
                                z: ((targetNode as any).z || 0) * distRatio 
                            },
                            targetNode, // lookAt
                            1000  // duration ms
                        );
                    } else {
                        // 2D centerAt
                        fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
                        // Optional: zoom in slightly
                        fgRef.current.zoom(2, 800);
                    }
                }
            };
            
            // Execute immediately for initial centering
            centerCamera();
            
            // Execute again slightly later to account for canvas resize
            // resulting from the side panel appearing (which reduces canvas width)
            const timer1 = setTimeout(centerCamera, 50);
            const timer2 = setTimeout(centerCamera, 150); // Ensure ResizeObserver caught up
            return () => { clearTimeout(timer1); clearTimeout(timer2); };
        }
    }, [activeNodeId, structuralData.nodes, use3D]);"""

code = code.replace(target, replacement)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

