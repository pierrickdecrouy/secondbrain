import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

# Replace:
# {use3D ? (
# with:
# {dimensions.width > 0 && dimensions.height > 0 ? (
#     use3D ? (

# And the corresponding closing braces.
# We also need to fix ForceGraph3D to use dimensions.width instead of width!
code = code.replace(
    "<ForceGraph3D\n                        ref={fgRef}\n                        width={width}\n                        height={height}",
    "<ForceGraph3D\n                        ref={fgRef}\n                        width={dimensions.width}\n                        height={dimensions.height}"
)

old_graph_section = """            {use3D ? (
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <CircleNotch className={`animate-spin ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={32} />
                    </div>
                }>"""

new_graph_section = """            {dimensions.width > 0 && dimensions.height > 0 ? (
                use3D ? (
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <CircleNotch className={`animate-spin ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={32} />
                    </div>
                }>"""
code = code.replace(old_graph_section, new_graph_section)

# We need to close the ternary at the end of the graph section.
# It currently ends with:
#                     onBackgroundClick={() => {
#                         setSelectedNodes(new Set());
#                         setPathLinks(new Set());
#                     }}
#                 />
#             )}
#         </div>

old_end = """                    onBackgroundClick={() => {
                        setSelectedNodes(new Set());
                        setPathLinks(new Set());
                    }}
                />
            )}
        </div>"""

new_end = """                    onBackgroundClick={() => {
                        setSelectedNodes(new Set());
                        setPathLinks(new Set());
                    }}
                />
            )) : null}
        </div>"""

code = code.replace(old_end, new_end)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

