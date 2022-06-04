#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { program: parser } = require("Commander");
const Target = require("./Target");


async function execute() {
   return new Promise((accept, reject) => {
      try
      {
         // parse the command line
         parser.option("-f, --file", "Specifies the makefile name", "makefile.js");
         parser.parse(process.argv);
         const project_file = parser.opts().file;
         const targets = parser.args;
         if(!fs.existsSync(project_file))
            throw Error(`${project_file} does not exist`);

         // we can now load the makefile module and invoke it to add its targets
         const makefile_module = require(path.join(process.cwd(), project_file));
         Promise.resolve(makefile_module({})).then(() => {
            // now, we can evaluate the targets that need to be built.  Evaluate will do this and build any of those
            // target dependencies.
            Target.evaluate(targets).then(() => {
               accept();
            }).catch((error) => {
               reject(error);
            });
         }).catch((error) => {
            reject(error);
         });
      }
      catch(error)
      { reject(error); }
   });
}

execute().then(() => {
   process.exit(0);
}).catch((error) => {
   console.log(`make failed: ${error}`);
   process.exit(1);
});
