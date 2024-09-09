import { exec } from 'child_process';
import readPkg from 'read-pkg';
import { getUsedDependencies, findUnusedDependencies } from './utils.js';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';


async function analyze() {
  const spinner = ora('Analyzing your project...').start();
  console.log('\n')
  try {
    console.log(chalk.cyan(figlet.textSync('DT analyze', {
      font: 'Slant',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })));

    const pkg = await readPkg();
    const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

    const { usedDependencies, importedButUnused } = await getUsedDependencies(spinner);

    const unusedDependencies = findUnusedDependencies(allDeps, usedDependencies);

    console.log(chalk.bold('\nResults of the analysis:\n'));

    // Dependencias usadas
    if (usedDependencies.length > 0) {
      console.log(chalk.green('✅ Used dependencies:'), usedDependencies);
    } else {
      console.log(chalk.red('❌ No used dependencies found.'));
    }
    
    // Dependencias importadas pero no usadas
    if (importedButUnused.length > 0) {
      console.log(chalk.yellow('\n⚠️ Imported but unused dependencies:'));
      importedButUnused.forEach(({ dep, files }) => {
        console.log(chalk.yellow(`- ${dep}: Imported in files [${files.join(', ')}] but not used.`));
      });
    } else {
      console.log(chalk.green('\n✅ No dependencies are imported but unused!'));
    }
    
    // Dependencias no importadas
    if (unusedDependencies.length > 0) {
      console.log(chalk.yellow('\n⚠️ Unused dependencies (installed but not imported):'), unusedDependencies);
    } else {
      console.log(chalk.green('\n✅ All installed dependencies are imported!'));
    }
    
    spinner.succeed('✔ Dependency analysis complete.');
    
  } catch (error) {
    spinner.fail('An error occurred during analysis.');
    console.error(error);
  }
}



async function removeUnused() {
  const spinner = ora('Removing unused dependencies...').start();

  try {
    const pkg = await readPkg();
    const { usedDependencies } = await getUsedDependencies(spinner);
    const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

    
    if (unusedDeps.length > 0) {
      console.log(chalk.yellow(`Removing unused dependencies: ${unusedDeps.join(', ')}`));
      exec(`npm uninstall ${unusedDeps.join(' ')}`, (err) => {
        if (err) {
          console.log(chalk.red('Error while removing dependencies:', err));
        } else {
          console.log(chalk.green('Unused dependencies removed successfully!'));
        }
      });
    } else {
      console.log(chalk.green('No unused dependencies to remove!'));
    }

    spinner.succeed('Unused dependencies removal complete.');
  } catch (error) {
    spinner.fail('An error occurred during removal.');
    console.error(error);
  }
}

export { analyze, removeUnused };