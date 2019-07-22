#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const fs = require('fs')

const aliyunService = require('../packages/commands/aliyunService')


program
  .version(require('../package').version, '-v, --version')

program
  .command('aliyunService <cmd> <dir>')
  .option('-d, --debug', 'output extra debugging')
  .action(function(cmd, dir, options){
    if (!aliyunService[cmd]) {
      return console.error('no cmd "%s"', cmd)
    }
    let config = {}
    let pkg = {}
    const pkgFilePath = path.resolve(dir, 'package.json')
    if (fs.existsSync(pkgFilePath)) {
      pkg = require(pkgFilePath)
      config = pkg.weidian || {}
    }
    config.rootPath = path.resolve(dir)
    config.name = config.name || pkg.name
    aliyunService[cmd](config, options)
  }).on('--help', function () {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ weidian aliyunService init .');
  });


program.parse(process.argv);
