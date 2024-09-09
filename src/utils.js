import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk'; 
// Función para obtener todos los archivos JavaScript del directorio
async function getJavaScriptFiles(dir, files = []) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory() && !res.includes('node_modules')) {
      await getJavaScriptFiles(res, files);
    } else if (dirent.isFile() && res.endsWith('.js')) {
      files.push(res);
    }
  }

  return files;
}

// Función para analizar el AST y detectar dependencias usadas
function analyzeASTForDependencyUse(ast, importedSymbols) {
  const usedSymbols = new Set();

  // Recorremos el AST para identificar las dependencias usadas
  walk.simple(ast, {
    Identifier(node) {
      if (importedSymbols.has(node.name)) {
        usedSymbols.add(node.name);
      }
    },
  });

  return usedSymbols;
}


async function getUsedDependencies(spinner) {
  const usedDepsGlobal = new Set(); 
  const unusedDepsByFile = []; 
  const importedButUnused = []; 

  try {
    spinner.text = "Finding JavaScript files...";
    const files = await getJavaScriptFiles(process.cwd());
    console.log(files.length);

    if (files.length === 0) {  // Línea donde podría estar fallando
      console.log("No JavaScript files found. Is the search path correct?");
      return { usedDependencies: [], unusedDependencies: [], importedButUnused: [] };
    }

    spinner.text = `Found ${files.length} JavaScript files. Starting analysis...`;

    // Recorremos cada archivo JS encontrado
    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      const ast = acorn.parse(content, { sourceType: 'module', ecmaVersion: 2020 });

      const importRegex = /import\s+(.*)\s+from\s+['"`]([^'"]+)['"`]/g;
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
      const usedSymbols = analyzeASTForDependencyUse(ast, importedSymbols);

      // Si una dependencia se usa, la marcamos como utilizada a nivel global
      const unusedDepsInFile = [];
      for (const dep of importedDeps) {
        const symbolsForDep = Array.from(importedSymbols).filter(symbol => symbol.startsWith(dep));
        if (symbolsForDep.some(symbol => usedSymbols.has(symbol))) {
          usedDepsGlobal.add(dep); // Marcar la dependencia como usada
        } else {
          unusedDepsInFile.push(dep); // Agregar a las no usadas en este archivo
          importedButUnused.push({ dep, file }); // Dependencia importada pero no usada
        }
      }

      // Si hay dependencias no usadas, las agregamos al reporte por archivo
      if (unusedDepsInFile.length > 0) {
        unusedDepsByFile.push({ file, unusedDeps: unusedDepsInFile });
      }
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
