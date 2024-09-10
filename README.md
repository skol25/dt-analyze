
# Deptrimer

**Deptrimer** is a command-line tool designed to help developers manage and maintain their JavaScript applications by identifying and removing unused or deprecated dependencies. In large projects that evolve over time, dependencies can become outdated or redundant. This tool assists in keeping your project clean and up-to-date, ensuring that unused dependencies are removed to optimize your application's performance.





## Installation

Install dep-trimmer with npm

```bash
  npm install dep-trimmer
```
    
## How to use

**IMPORTANT* by the momnent you have 2 ways to implement this to your projects:

**Modify your package.json adding this line per command **
```bash
"scripts": {
    "analyze": "dep-trimmer --analyze"
  }
 ```
or you just global install but this second choice is not recommended 


To run this tool, use the following commands:

1. **Analyze your project's dependencies** to find unused ones:

   ```bash
   dep-trimmer --analyze
    ```
    This will scan your project and display a report of dependencies that are either unused or imported but not used.
2. **Remove unused dependencies** from your project:

   ```bash
   dep-trimmer --remove
    ```

This will uninstall all dependencies that are found to be unused based on the analysis.

3. **Display help information** to see all available options:

   ```bash
   dep-trimmer --help
    ```

This will uninstall all dependencies that are found to be unused based on the analysis.

**Note: It's recommended to first run the analysis before removing dependencies to avoid accidental deletion of needed packages.**
## Tech Stack

**commander:** para el manejo de la línea de comandos.

**ora:** para mostrar indicadores de carga.

**read-pkg:** para leer el archivo package.json.

**chalk:** para colores en la consola.

**figlet:** para generar arte ASCII.



## Authors

- [@skol25](https://github.com/skol25)


## Support

For support, email andres.lobolugo25@gmail.com or just make a issue

