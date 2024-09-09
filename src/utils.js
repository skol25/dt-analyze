import fs from 'fs';
import path from 'path';

// Función para obtener archivos JS recursivamente
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

async function getUsedDependencies(spinner) {
  const usedDeps = new Set(); // Dependencias realmente usadas
  const importedButUnused = new Map(); // Dependencias importadas pero no usadas con referencia a los archivos

  try {
    spinner.text = "Finding JavaScript files...";
    const files = await getJavaScriptFiles(process.cwd());

    if (files.length === 0) {
      console.log("No JavaScript files found. Is the search path correct?");
      return { usedDependencies: [], importedButUnused: [] };
    }

    spinner.text = `Found ${files.length} JavaScript files. Starting analysis...`;

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');

      // Expresión regular para detectar imports y requires
      const importRegex = /import\s+(.*)\s+from\s+['"`]([^'"]+)['"`]/g;
      const requireRegex = /require\s*\(\s*['"`]([^'"]+)['"`]\s*\)/g;

      let match;
      const importedDeps = new Set(); // Para las dependencias importadas en este archivo

      // Procesar las importaciones 'import ... from ...'
      while ((match = importRegex.exec(content)) !== null) {
        const dep = match[2]; // Nombre de la dependencia importada
        const importedSymbols = match[1]; // Lo que fue importado (ej. '_', { ora })

        if (dep && !dep.startsWith('.') && dep !== '') {
          const depName = dep.split('/')[0];
          importedDeps.add(depName); // Registrar la dependencia como importada

          if (!importedButUnused.has(depName)) {
            importedButUnused.set(depName, new Set());
          }
          importedButUnused.get(depName).add(file); // Registrar el archivo donde fue importada

          // Verificar si alguna de las entidades importadas realmente se usa
          const symbols = importedSymbols.split(/\s*,\s*/).map(symbol => symbol.replace(/[\{\}\s]/g, ''));
          let isUsedInFile = symbols.some(symbol => new RegExp(`\\b${symbol}\\b`).test(content));

          if (isUsedInFile) {
            usedDeps.add(depName); // La dependencia fue utilizada
          }
        }
      }

      // Procesar 'require(...)'
      while ((match = requireRegex.exec(content)) !== null) {
        const dep = match[1];

        if (dep && !dep.startsWith('.') && dep !== '') {
          const depName = dep.split('/')[0];
          importedDeps.add(depName); // Registrar la dependencia como importada

          if (!importedButUnused.has(depName)) {
            importedButUnused.set(depName, new Set());
          }
          importedButUnused.get(depName).add(file);

          const isUsedInFile = new RegExp(`\\b${depName}\\b`).test(content);

          if (isUsedInFile) {
            usedDeps.add(depName); // La dependencia fue utilizada
          }
        }
      }
    }

    // Filtrar dependencias que fueron importadas pero no usadas
    const result = [];
    importedButUnused.forEach((files, dep) => {
      if (!usedDeps.has(dep)) {
        result.push({ dep, files: Array.from(files) });
      }
    });

    return {
      usedDependencies: Array.from(usedDeps),
      importedButUnused: result,
    };
  } catch (err) {
    spinner.fail('Error during file search');
    console.error('File search error:', err);
    throw err;
  }
}



function findUnusedDependencies(allDeps, usedDeps) {
  return allDeps.filter(dep => !usedDeps.includes(dep)); // Encontrar dependencias no usadas globalmente
}

export { findUnusedDependencies, getUsedDependencies };
