#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { program: parser } = require("commander");
const Logger = require("./src/Logger");
const prompts = require("prompts");
const Target = require("./src/Target");
let logger;


async function execute() {
   // parse the command line
   parser.option("-f, --file", "Specifies the makefile name", "makefile.js");
   parser.option("-l, --log-level", "Specifies the log level", "info");
   parser.parse(process.argv);
   const project_file = parser.opts().file;
   let targets = parser.args;
   if(!fs.existsSync(project_file))
      throw Error(`${project_file} does not exist`);

   // we can now load the makefile module to create the project and sub-project (if any) targets.
   const makefile_module = require(path.join(process.cwd(), project_file));
   logger = new Logger({ name: "cross-platform-build", level: parser.opts().logLevel});
   await Promise.resolve(makefile_module({ logger }, logger));

   // there may be unresolvable dependencies for the target, we will attempt to locate those dependent targets and, 
   // if not found, will write out messages for each missing dependencies.
   const targets_missing_depends = Target.find_missing_depends();
   if(targets_missing_depends.length > 0)
   {
      targets_missing_depends.forEach((invalid_target) => {
         logger.error(`target ${invalid_target.name} unresolved dependencies: ${invalid_target.missing}`);
      });
      process.exit(1);
   }

   // if no targets are specified, we will drop into interactive mode to select the targets
   if(targets.length === 0)
   {
      const all_targets_keys = Object.keys(Target.all_targets);
      const all_targets = all_targets_keys.map((key) => Target.all_targets[key]);
      const interactive_targets = all_targets.filter((target) => {
         return target.options.interactive ?? true;
      });
      const prompts_options = [
         {
            type: "multiselect",
            name: "selected_targets",
            message: "Select Targets to Build",
            choices: interactive_targets.map((target) => {
               return {
                  title: target.name,
                  value: target.name,
                  selected: true
               }
            })
         }
      ];
      const results = await prompts(prompts_options);
      targets = results.selected_targets;
   }
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
