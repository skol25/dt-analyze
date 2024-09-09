# Deptrimer

**Deptrimer** es una herramienta de línea de comandos para analizar y eliminar dependencias no utilizadas en proyectos Node.js. Permite a los desarrolladores identificar dependencias que no están siendo usadas en el código y eliminarlas de manera eficiente.

## Instalación

Asegúrate de tener [Node.js](https://nodejs.org/) instalado. Luego, instala `deptrimer` globalmente utilizando npm:

```bash
npm install -g deptrimer
Uso
La herramienta proporciona dos comandos principales:

Analizar dependencias

Este comando analiza el proyecto y reporta las dependencias que están importadas pero no usadas, así como las dependencias instaladas que no están importadas en el proyecto.

bash
Copiar código
dep-trimmer --analyze
Ejemplo de salida:

plaintext
Copiar código
⠋ Processing...
⠋ Analyzing your project...

    ____  ______                     __
   / __ \/_  __/  ____ _____  ____ _/ /_  ______  ___ 
  / / / / / /    / __ `/ __ \/ __ `/ / / /_  / / _ \
 / /_/ / / /    / /_/ / / / / /_/ / / /_/ / / /_/  __/
/_____/ /_/     \__,_/_/ /_/\__,_/_/\__, / /___/\___/ 
                                 /____/
⠙ Finding JavaScript files...5

Results of the analysis:

✅ Used dependencies: [ 'chalk', 'axios', 'express' ]

⚠️ Imported but unused dependencies:
- lodash: Imported in file C:\path\to\file.js but not used.

⚠️ Unused dependencies (installed but not imported): [ 'lodash', 'mocha' ]
✔ ✔ Dependency analysis complete.
✔ Analysis complete!
Eliminar dependencias no usadas

Este comando elimina las dependencias que se han identificado como no usadas en el análisis previo.

bash
Copiar código
dep-trimmer --remove
Ejemplo de salida:

plaintext
Copiar código
⠋ Processing...
⠋ Removing unused dependencies...
Removing unused dependencies: lodash, mocha
✔ Unused dependencies removed successfully!
Cómo funciona
Análisis de dependencias:

Encuentra todos los archivos JavaScript en el proyecto.
Analiza el código fuente para identificar las dependencias importadas y usadas.
Reporta las dependencias importadas pero no usadas, así como las dependencias instaladas pero no importadas.
Eliminación de dependencias:

Utiliza la información del análisis para eliminar las dependencias no usadas del archivo package.json.
Dependencias
commander para el manejo de la línea de comandos.
ora para mostrar indicadores de carga.
read-pkg para leer el archivo package.json.
chalk para colores en la consola.
figlet para generar arte ASCII.
Contribuciones
Las contribuciones son bienvenidas. Si encuentras algún problema o tienes sugerencias para mejorar la herramienta, por favor abre un issue o envía un pull request.