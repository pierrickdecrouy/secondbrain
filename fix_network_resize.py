import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

# Replace React imports to include useLayoutEffect
target_import = """import React, { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react';"""
replacement_import = """import React, { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect, lazy, Suspense } from 'react';"""
if target_import in code:
    code = code.replace(target_import, replacement_import)

# Add useResizeObserver hook inside NetworkView
target_state = """    // 2D / 3D mode toggle
    const [use3D, setUse3D] = useState(false);"""
replacement_state = """    // 2D / 3D mode toggle
    const [use3D, setUse3D] = useState(false);

    // Track container dimensions to pass explicit width/height
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);"""
if target_state in code:
    code = code.replace(target_state, replacement_state)

# Replace dimensions in ForceGraph
target_fg_props = """                    width={width}
                    height={height}"""
replacement_fg_props = """                    width={dimensions.width || width}
                    height={dimensions.height || height}"""
code = code.replace(target_fg_props, replacement_fg_props)

# Also add to ForceGraph2D
target_fg2_props = """                    width={width}
                    height={height}"""
replacement_fg2_props = """                    width={dimensions.width || width}
                    height={dimensions.height || height}"""
code = code.replace(target_fg2_props, replacement_fg2_props)

# Wrap ForceGraph in the containerRef
target_container_start = """            {use3D ? ("""
replacement_container_start = """            <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            {use3D ? ("""
code = code.replace(target_container_start, replacement_container_start)

target_container_end = """                />
            )}
        </div>
    );"""
replacement_container_end = """                />
            )}
            </div>
        </div>
    );"""
code = code.replace(target_container_end, replacement_container_end)

# Trigger centerCamera when dimensions change!
target_effect = """    }, [activeNodeId, structuralData.nodes, use3D]);"""
replacement_effect = """    }, [activeNodeId, structuralData.nodes, use3D, dimensions]);"""
code = code.replace(target_effect, replacement_effect)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

