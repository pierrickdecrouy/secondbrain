import re

with open('src/components/NetworkView.tsx', 'r') as f:
    content = f.read()

# Fix 2D linkPaint
old_paint = """        if (isDimmed) {
            ctx.globalAlpha = 0.05;
        } else if (isPath || isHover) {
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = 0.4;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        const useGradient = globalScale > 0.8 || isHover; // isPath is handled above

        if (useGradient) {
            const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
            gradient.addColorStop(0, getTypeColor(source.type));
            gradient.addColorStop(1, getTypeColor(target.type));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (isHover ? 2.5 : 1) / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = getTypeColor(source.type);
            ctx.lineWidth = 1 / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        }

        const isManual = source.manualConnections?.includes(target.id) || target.manualConnections?.includes(source.id);

        if (!isManual) { // isPath is handled above
            ctx.setLineDash([3 / globalScale, 3 / globalScale]);
        } else {
            ctx.setLineDash([]);
        }"""

new_paint = """        if (isDimmed) {
            ctx.globalAlpha = isDark ? 0.1 : 0.05;
        } else if (isPath || isHover) {
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = isDark ? 0.75 : 0.4;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        const useGradient = globalScale > 0.8 || isHover; // isPath is handled above

        if (useGradient) {
            const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
            gradient.addColorStop(0, getTypeColor(source.type));
            gradient.addColorStop(1, getTypeColor(target.type));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (isHover ? 3 : (isDark ? 1.5 : 1)) / globalScale;
            if (isHover || isDark) {
                ctx.shadowBlur = isHover ? 8 : 4;
                ctx.shadowColor = getTypeColor(source.type);
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = getTypeColor(source.type);
            ctx.lineWidth = (isDark ? 1.5 : 1) / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        }

        const isManual = source.manualConnections?.includes(target.id) || target.manualConnections?.includes(source.id);

        if (!isManual) { // isPath is handled above
            ctx.setLineDash([4 / globalScale, 4 / globalScale]);
        } else {
            ctx.setLineDash([]);
        }"""

content = content.replace(old_paint, new_paint)

# Fix 3D link color
old_3d = """        const isDimmed = hoverNode && (srcId !== hoverNode.id && tgtId !== hoverNode.id);
        if (isDimmed) return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';"""

new_3d = """        const isDimmed = hoverNode && (srcId !== hoverNode.id && tgtId !== hoverNode.id);
        if (isDimmed) return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        // Enhance visibility in 3D by returning actual category colors instead of faint white
        return isDark ? getTypeColor(src.type) : 'rgba(0,0,0,0.25)';"""

content = content.replace(old_3d, new_3d)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(content)

