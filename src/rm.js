const Target = require("./Target");
const fs = require("node:fs");

/**
 * @return {object} Returns a target object that will remove a file or directory
 * @param {string} params.name Specifies the name of the target
 * @param {string[]=[]} param.depends Specifies the names of targets that must be built before this target
 * @param {string | function<string>} params.path Specifies the path of the file system object to be removed
 * @param {boolean = true} params.ignore_error Set to true if any errors will be ignored.
 * @param {object} params.options Must specify the options passed to the makefile function.
 * @returns 
 */
async function rm({
   name,
   depends = [],
   path,
   ignore_error = true,
   options
}) {
   const rtn = Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_path = (typeof path === "function" ? path() : path);
         const path_info = fs.statSync(effective_path, { throwIfNoEntry: false });
         if(path_info)
         {
            try {
               await fs.promises.rm(effective_path, { recursive: true });
            }
            catch(error) {
               if(!ignore_error)
                  throw error;
            }
         }
         else if(!ignore_error)
            throw Error(`no file found: ${effective_path}`);
         return true;
      }
   });
   rtn.path = path;
   rtn.ignore_error = ignore_error;
   return rtn;
}

module.exports = {
   rm
};