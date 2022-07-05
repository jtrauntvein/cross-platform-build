#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { program: parser } = require("Commander");
const Pino = require("pino");
const Target = require("./src/Target");
let logger;


async function execute() {
   // parse the command line
   parser.option("-f, --file", "Specifies the makefile name", "makefile.js");
   parser.option("-l, --log-level", "Specifies the log level", "info");
   parser.parse(process.argv);
   const project_file = parser.opts().file;
   const targets = parser.args;
   if(!fs.existsSync(project_file))
      throw Error(`${project_file} does not exist`);

   // we can now load the makefile module and invoke it to add its targets
   const makefile_module = require(path.join(process.cwd(), project_file));
   logger = Pino.pino({ name: "cross-platform-build", level: parser.opts().logLevel});
   await Promise.resolve(makefile_module({ }, logger));
   await Target.evaluate(targets, logger);
}

execute().then(() => {
   process.exit(0);
}).catch((error) => {
   if(logger)
      logger.error(Error(`make failed: ${error}`));
   else
      console.log(`make failed: ${error}`);
   process.exit(1);
});
