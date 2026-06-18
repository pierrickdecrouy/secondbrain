import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

debug_code1 = """    // Debug dimensions
    useEffect(() => {
        console.log("NetworkView dimensions:", dimensions);
    }, [dimensions]);"""
code = code.replace(debug_code1, "")

debug_code2 = """            {dimensions.width === 0 ? (
                <div style={{color: 'red', zIndex: 9999, position: 'absolute', background: 'white', padding: '20px'}}>
                    Waiting for dimensions... {dimensions.width}x{dimensions.height}
                </div>
            ) : null}"""
code = code.replace(debug_code2, "")

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

