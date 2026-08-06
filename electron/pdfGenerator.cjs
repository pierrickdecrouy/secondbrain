const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const { app, dialog } = require('electron');

// Escape special LaTeX characters
const escapeLatex = (str) => {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\textbackslash ')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/~/g, '\\textasciitilde ')
        .replace(/\^/g, '\\textasciicircum ');
};

// Extremely basic Markdown to LaTeX converter
const markdownToLatex = (md) => {
    if (!md) return '';
    
    let tex = md;
    
    // Bold
    tex = tex.replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}');
    // Italic
    tex = tex.replace(/\*(.*?)\*/g, '\\textit{$1}');
    tex = tex.replace(/_(.*?)_/g, '\\textit{$1}');
    
    // Lists (very basic)
    const lines = tex.split('\n');
    let inList = false;
    let result = [];
    
    for (let line of lines) {
        if (line.trim().startsWith('- ')) {
            if (!inList) {
                result.push('\\begin{itemize}');
                inList = true;
            }
            result.push(`  \\item ${line.trim().substring(2)}`);
        } else {
            if (inList) {
                result.push('\\end{itemize}');
                inList = false;
            }
            result.push(line);
        }
    }
    
    if (inList) {
        result.push('\\end{itemize}');
    }
    
    return result.join('\n');
};

const getTectonicPath = () => {
    const isDev = !app.isPackaged;
    
    if (isDev) {
        return path.join(app.getAppPath(), 'resources', 'bin', process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');
    } else {
        return path.join(process.resourcesPath, 'bin', process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');
    }
};

const generatePdf = async (courseData, mainWindow) => {
    return new Promise(async (resolve, reject) => {
        try {
            const templatePath = app.isPackaged 
                ? path.join(process.resourcesPath, 'app', 'electron', 'latex', 'template.tex')
                : path.join(__dirname, 'latex', 'template.tex');
                
            if (!fs.existsSync(templatePath)) {
                return reject(new Error('LaTeX template not found at ' + templatePath));
            }
            
            let template = fs.readFileSync(templatePath, 'utf8');
            
            // Inject metadata
            template = template.replace('{{TITLE}}', escapeLatex(courseData.title || 'Course PDF'));
            template = template.replace('{{DESCRIPTION}}', escapeLatex(courseData.description || ''));
            
            // Build Content
            let contentTex = '';
            
            if (courseData.cards && Array.isArray(courseData.cards)) {
                for (const card of courseData.cards) {
                    const cardTitle = escapeLatex(card.title || 'Untitled');
                    const cardContent = markdownToLatex(escapeLatex(card.content || ''));
                    
                    let boxType = 'standardbox';
                    if (card.type === 'medicine') boxType = 'medicinebox';
                    if (card.type === 'pathology') boxType = 'pathologybox';
                    if (card.type === 'data') boxType = 'databox';
                    
                    contentTex += `\\begin{${boxType}}[${cardTitle}]\n`;
                    contentTex += `${cardContent}\n`;
                    contentTex += `\\end{${boxType}}\n\n`;
                }
            } else {
                contentTex = markdownToLatex(escapeLatex(courseData.content || 'No content provided.'));
            }
            
            template = template.replace('{{CONTENT}}', contentTex);
            
            // Create tmp dir
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pharmabrain-pdf-'));
            const texFilePath = path.join(tmpDir, 'document.tex');
            const pdfFilePath = path.join(tmpDir, 'document.pdf');
            
            fs.writeFileSync(texFilePath, template, 'utf8');
            
            const tectonicPath = getTectonicPath();
            if (!fs.existsSync(tectonicPath)) {
                return reject(new Error('Tectonic binary not found at ' + tectonicPath + '. Please run setup script.'));
            }
            const child = child_process.execFile(tectonicPath, ['document.tex'], { cwd: tmpDir }, async (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(`Tectonic compilation failed: ${stderr || error.message}`));
                }
                
                if (!fs.existsSync(pdfFilePath)) {
                    return reject(new Error('Tectonic succeeded but no PDF was found.'));
                }
                
                // Show Save Dialog
                const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                    title: 'Enregistrer le PDF',
                    defaultPath: `Cours_${courseData.title ? courseData.title.replace(/[^a-z0-9]/gi, '_') : 'Export'}.pdf`,
                    filters: [
                        { name: 'PDF Document', extensions: ['pdf'] }
                    ]
                });
                
                if (canceled || !filePath) {
                    return resolve({ success: false, canceled: true });
                }
                
                // Copy generated PDF to destination
                fs.copyFileSync(pdfFilePath, filePath);
                
                resolve({ success: true, filePath });
            });
            
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generatePdf
};
