const Target = require("./Target");
const fs = require("node:fs");

async function rm({
   name,
   depends = [],
   path,
   ignore_error = true,
   options = { }
}) {
   const rtn = Target.target({
      name,
      depends,
      options,
      action: async function() {
         const path_info = fs.statSync(path);
         if(path_info)
         {
            try {
               await fs.promises.rm(path, { recursive: true });
            }
            catch(error) {
               if(!ignore_error)
                  throw error;
            }
         }
         else if(!ignore_error)
            throw Error(`no file found: ${path}`);
         return true;
      }
   });
   return rtn;
}

module.exports = {
   rm
};