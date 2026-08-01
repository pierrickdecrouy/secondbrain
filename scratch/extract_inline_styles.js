const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const MagicString = require('magic-string').default || require('magic-string');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Provide a file path');
  process.exit(1);
}

const componentName = path.basename(filePath, path.extname(filePath));
const sourceCode = fs.readFileSync(filePath, 'utf8');
const s = new MagicString(sourceCode);

const cssRules = [];
let classCounter = 1;

const camelToKebab = (str) => {
    // Handle Webkit prefix
    if (str.startsWith('Webkit')) {
        str = 'webkit' + str.slice(6);
        return '-' + str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    }
    return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
};

const unitless = new Set([
  'animationIterationCount', 'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup',
  'columnCount', 'fillOpacity', 'flex', 'flexGrow', 'flexPositive', 'flexShrink',
  'flexNegative', 'flexOrder', 'fontWeight', 'lineClamp', 'lineHeight', 'opacity',
  'order', 'orphans', 'stopOpacity', 'strokeDashoffset', 'strokeOpacity',
  'strokeWidth', 'tabSize', 'widows', 'zIndex', 'zoom'
]);

const ast = babel.parseSync(sourceCode, {
  filename: filePath,
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
});

let hasCssImport = false;

traverse(ast, {
  ImportDeclaration(path) {
    if (path.node.source.value.includes(`styles/${componentName}.css`)) {
      hasCssImport = true;
    }
  },
  JSXOpeningElement(path) {
    const styleAttr = path.node.attributes.find(attr => attr.type === 'JSXAttribute' && attr.name.name === 'style');
    if (!styleAttr || styleAttr.value.type !== 'JSXExpressionContainer' || styleAttr.value.expression.type !== 'ObjectExpression') {
      return;
    }
    
    const objExpr = styleAttr.value.expression;
    const staticProps = [];
    const dynamicProps = [];
    
    objExpr.properties.forEach(prop => {
      if (prop.type === 'ObjectProperty' && (prop.key.type === 'Identifier' || prop.key.type === 'StringLiteral')) {
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
        if (prop.value.type === 'StringLiteral' || prop.value.type === 'NumericLiteral') {
          staticProps.push({ key, value: prop.value.value });
        } else {
          dynamicProps.push(prop);
        }
      } else {
        dynamicProps.push(prop);
      }
    });
    
    if (staticProps.length > 0) {
      const className = `${componentName.toLowerCase()}-style-${classCounter++}`;
      let cssBlock = `.${className} {\n`;
      staticProps.forEach(({ key, value }) => {
        let cssKey = camelToKebab(key);
        let cssVal = value;
        if (typeof value === 'number' && value !== 0 && !unitless.has(key)) {
          cssVal = `${value}px`;
        }
        cssBlock += `    ${cssKey}: ${cssVal};\n`;
      });
      cssBlock += `}\n`;
      cssRules.push(cssBlock);
      
      const classAttr = path.node.attributes.find(attr => attr.type === 'JSXAttribute' && attr.name.name === 'className');
      if (classAttr) {
        if (classAttr.value.type === 'StringLiteral') {
          s.overwrite(classAttr.value.start, classAttr.value.end, `"${classAttr.value.value} ${className}"`);
        } else if (classAttr.value.type === 'JSXExpressionContainer') {
            if (classAttr.value.expression.type === 'TemplateLiteral') {
                 const quasis = classAttr.value.expression.quasis;
                 const lastQuasi = quasis[quasis.length - 1];
                 const newQuasis = [
                     ...quasis.slice(0, -1),
                     t.templateElement({ raw: lastQuasi.value.raw + ` ${className}`, cooked: lastQuasi.value.cooked + ` ${className}` })
                 ];
                 const newTemplate = t.templateLiteral(newQuasis, classAttr.value.expression.expressions);
                 const generated = generate(newTemplate).code;
                 s.overwrite(classAttr.value.expression.start, classAttr.value.expression.end, generated);
            } else {
                const generated = generate(classAttr.value.expression).code;
                s.overwrite(classAttr.value.expression.start, classAttr.value.expression.end, `\`\${${generated}} ${className}\``);
            }
        }
      } else {
        s.appendLeft(styleAttr.start, `className="${className}" `);
      }
      
      if (dynamicProps.length === 0) {
        // Also remove preceding whitespace if possible
        s.overwrite(styleAttr.start, styleAttr.end, '');
      } else {
        const newObj = t.objectExpression(dynamicProps);
        const generated = generate(newObj).code;
        s.overwrite(objExpr.start, objExpr.end, generated);
      }
    }
  }
});

if (cssRules.length > 0) {
  if (!hasCssImport) {
    let lastImportEnd = 0;
    traverse(ast, {
      ImportDeclaration(path) {
        lastImportEnd = Math.max(lastImportEnd, path.node.end);
      }
    });
    if (lastImportEnd > 0) {
      s.appendRight(lastImportEnd, `\nimport './styles/${componentName}.css';`);
    } else {
      s.prepend(`import './styles/${componentName}.css';\n`);
    }
  }
  
  const outPath = path.join(path.dirname(filePath), 'styles', `${componentName}.css`);
  if (!fs.existsSync(path.dirname(outPath))) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }
  
  const existingCss = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  fs.writeFileSync(outPath, existingCss + (existingCss ? '\n\n' : '') + cssRules.join('\n'));
  
  // Clean up empty style attributes: style={} or style={ }
  let finalSource = s.toString();
  finalSource = finalSource.replace(/\s*style=\{\s*\}\s*/g, ' ');
  fs.writeFileSync(filePath, finalSource);
  
  console.log(`Processed ${componentName}: Extracted ${cssRules.length} rules.`);
} else {
  console.log(`No inline styles extracted for ${componentName}.`);
}
