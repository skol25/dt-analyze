import fs from 'fs';
import path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';

// Función para obtener todos los archivos JavaScript/TypeScript/JSX del directorio
async function getSourceFiles(dir, files = []) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory() && !res.includes('node_modules')) {
      await getSourceFiles(res, files);  // Recursividad para buscar en subdirectorios
    } else if (dirent.isFile() && /\.(js|jsx|ts|tsx)$/.test(res)) {  // Busca archivos js, jsx, ts, tsx
      files.push(res);
    }
  }

  return files;
}

// Función recursiva para recorrer el AST y detectar dependencias usadas
function walkAST(node, callback) {
  if (!node || typeof node !== 'object') return;

  // Ejecutar la función callback sobre el nodo actual
  callback(node);

  // Recorrer los hijos del nodo si existen
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      // Si es un array, recorrer los elementos
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          walkAST(child, callback);
        }
      } else {
        // Si es un objeto, recorrer el nodo hijo
        walkAST(node[key], callback);
      }
    }
  }
}

// Función para analizar el AST y detectar dependencias usadas
function analyzeASTForDependencyUse(ast, importedSymbols, file) {
  const usedSymbols = new Set();
  const fileIsJSX = file.endsWith('.tsx') || file.endsWith('.jsx');
  let containsJSX = false;

  walkAST(ast, (node) => {
    // Detect JSX Elements and mark React as used
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      containsJSX = true;
      usedSymbols.add('React');
    }

    // Detect identifiers used in member expressions (e.g., lodash.method())
    if (node.type === 'MemberExpression' && node.object.type === 'Identifier') {
      const objectName = node.object.name;
      if (importedSymbols.has(objectName)) {
        console.log(`Detected member expression usage: ${objectName}`);
        usedSymbols.add(objectName);
      }
    }

    // Detect instantiation of new classes (e.g., new Command())
    if (node.type === 'NewExpression' && node.callee.type === 'Identifier') {
      const className = node.callee.name;
      if (importedSymbols.has(className)) {
        console.log(`Detected instantiation of class: ${className}`);
        usedSymbols.add(className);
      }
    }

    // Detect direct invocation of imported functions (e.g., parse())
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const functionName = node.callee.name;
      if (importedSymbols.has(functionName)) {
        console.log(`Detected direct function call: ${functionName}`);
        usedSymbols.add(functionName);
      }
    }

    // Detect asynchronous function calls (e.g., await readPkg())
    if (node.type === 'AwaitExpression' && node.argument.type === 'CallExpression') {
      const functionCall = node.argument.callee;
      if (functionCall.type === 'Identifier' && importedSymbols.has(functionCall.name)) {
        console.log(`Detected async function call: ${functionCall.name}`);
        usedSymbols.add(functionCall.name);
      }
    }

    // Detect function calls from imported objects (e.g., lodash.sortBy())
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier') {
      const objectName = node.callee.object.name;
      if (importedSymbols.has(objectName)) {
        console.log(`Detected method call on imported object: ${objectName}`);
        usedSymbols.add(objectName);
      }
    }
  });

  // If the file is JSX/TSX and contains JSX, we automatically mark React as used
  if (fileIsJSX && containsJSX) {
    usedSymbols.add('React');
  }

  return usedSymbols;
}




async function getUsedDependencies(spinner) {
  const usedDepsGlobal = new Set();
  const unusedDepsByFile = [];
  const importedButUnused = [];

  try {
    spinner.text = "Finding source files (js, jsx, ts, tsx)...";
    const files = await getSourceFiles(process.cwd());
    console.log(`Found ${files.length} source files.`);

    if (files.length === 0) {
      console.log("No source files found. Is the search path correct?");
      return { usedDependencies: [], unusedDependenciesByFile: [], importedButUnused: [] };
    }

    spinner.text = `Found ${files.length} source files. Starting analysis...`;

    // Recorremos cada archivo encontrado
    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      let ast;
      
      try {
        ast = parse(content, {
          loc: true,
          range: true,
          tokens: true,
          comment: true,
          errorOnUnknownASTType: true,
          jsx: file.endsWith('.jsx') || file.endsWith('.tsx'),  // Verifica si es JSX o TSX
          ecmaVersion: 2020,  
        });
      } catch (err) {
        console.error(`Error parsing ${file}:`, err);
        continue;
      }

      // Aquí continúa el análisis del archivo después de hacer el parseo exitoso
      const importRegex = /import\s+(.+?)\s+from\s+['"`]([^'"]+)['"`]/g;
      const requireRegex = /require\s*\(\s*['"`]([^'"]+)['"`]\s*\)/g;
    
      let match;
      const importedDeps = new Set();
      const importedSymbols = new Set();
    
      // Procesamos importaciones con 'import ... from ...'
      while ((match = importRegex.exec(content)) !== null) {
        const dep = match[2];
        const symbols = match[1].replace(/[{}]/g, '').split(/\s*,\s*/).map(s => s.trim());
    
        if (dep && !dep.startsWith('.') && dep !== '') {
          const depName = dep.split('/')[0];
          importedDeps.add(depName);
          symbols.forEach(symbol => importedSymbols.add(symbol));
        }
      }
    
      // Procesamos las importaciones con require(...)
      while ((match = requireRegex.exec(content)) !== null) {
        const dep = match[1];
        if (dep && !dep.startsWith('.') && dep !== '') {
          const depName = dep.split('/')[0];
          importedDeps.add(depName);
          importedSymbols.add(depName);
        }
      }
    
      // Analizamos el AST para encontrar dependencias usadas en este archivo
      const usedSymbols = analyzeASTForDependencyUse(ast, importedSymbols, file);
      
      const fileIsJSX = file.endsWith('.tsx') || file.endsWith('.jsx');
      let containsJSX = usedSymbols.has('React');
      
      // Inicializa 'unusedDepsInFile' aquí
      const unusedDepsInFile = [];

      // Aquí va el ciclo corregido:
      for (const dep of importedDeps) {
        const symbolsForDep = Array.from(importedSymbols).filter(symbol => symbol.startsWith(dep));
        
        // Si React es usado en JSX, no lo marques como no usado
        if (dep === 'react' && fileIsJSX && containsJSX) {
          usedDepsGlobal.add(dep);
          continue;
        }
        // Si alguna parte del símbolo es utilizada, marca la dependencia como usada
        if (symbolsForDep.some(symbol => usedSymbols.has(symbol))) {
          usedDepsGlobal.add(dep);
        } else {
          unusedDepsInFile.push(dep); // Aquí se agregan las no usadas al archivo
          importedButUnused.push({ dep, file }); // También se agregan a la lista general de importadas pero no usadas
        }
      }

      // Añade 'unusedDepsInFile' al array global después de procesar el archivo
      unusedDepsByFile.push({ file, unusedDeps: unusedDepsInFile });
    }

    return {
      usedDependencies: Array.from(usedDepsGlobal),
      unusedDependenciesByFile: unusedDepsByFile,
      importedButUnused: importedButUnused,
    };
  } catch (err) {
    spinner.fail('Error during file search');
    console.error('File search error:', err);
    throw err;
  }
}



function findUnusedDependencies(allDeps, usedDeps) {
  return allDeps.filter(dep => !usedDeps.includes(dep)); 
}

export { findUnusedDependencies, getUsedDependencies };
