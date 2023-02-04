const Target = require("./Target");
const fs = require("node:fs");
const path = require("node:path");


/**
 * Creates a target object that will rename a file or directory.
 * 
 * @param {string} name Specifies the name of the new target
 * @param {string[] = []} depends Specifies the list of target names that must be built before this target is built.
 * @param {string | function<string>} source Specifies the name and path of the file or directory to be renamed.
 * @param {string | function<string>} new_name Specifies the new name that should be assigned.
 * @param {object} options Must specify the options argument that was passed to the makefile.js entry point.
 */
async function rename({
   name,
   depends = [],
   source,
   new_name,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_source = (typeof source === "function" ? source() : source);
         const effective_new_name = (typeof new_name === "function" ? new_name() : new_name);
         const source_path = path.dirname(effective_source);
         const dest_name = path.basename(effective_new_name);
         let dest_path = path.dirname(effective_new_name);
         if(dest_path == ".")
            dest_path = source_path;
         await fs.promises.rename(source, path.join(dest_path, dest_name));
         return true;
      }
   });
   return rtn;
}


module.exports = {
   rename
};