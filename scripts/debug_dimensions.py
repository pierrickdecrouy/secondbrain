import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

# Let's add a console log inside NetworkView
debug_code = """
    // Search Depth State (1 = direct match, 2 = neighbors, 3 = extended, 0/Infinity = All)
"""
new_debug_code = """
    // Debug dimensions
    useEffect(() => {
        console.log("NetworkView dimensions:", dimensions);
    }, [dimensions]);

    // Search Depth State (1 = direct match, 2 = neighbors, 3 = extended, 0/Infinity = All)
"""
code = code.replace(debug_code, new_debug_code)

# Let's also render the dimensions if they are 0
old_graph_section = """            {dimensions.width > 0 && dimensions.height > 0 ? ("""
new_graph_section = """            {dimensions.width === 0 ? (
                <div style={{color: 'red', zIndex: 9999, position: 'absolute', background: 'white', padding: '20px'}}>
                    Waiting for dimensions... {dimensions.width}x{dimensions.height}
                </div>
            ) : null}
            {dimensions.width > 0 && dimensions.height > 0 ? ("""
code = code.replace(old_graph_section, new_graph_section)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

