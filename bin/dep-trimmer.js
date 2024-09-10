

import { Command } from 'commander';
import ora from 'ora';
import { analyze, removeUnused } from '../src/index.js';

const program = new Command();

program
  .version('1.0.0')
  .description('A CLI tool to trim unused npm dependencies')
  .option('-a, --analyze', 'Analyze dependencies and report unused ones')
  .option('-r, --remove', 'Remove unused dependencies')
  .parse(process.argv);

const options = program.opts();  

const spinner = ora('Processing...').start();

if (options.analyze) {
  analyze().then(() => spinner.succeed('Analysis complete!')).catch((err) => spinner.fail(err.message));
}

if (options.remove) {
  removeUnused().then(() => spinner.succeed('Unused dependencies removed!')).catch((err) => spinner.fail(err.message));
}
