const path = require("node:path");
const fs = require("node:fs");

/**
 * 
 * @param {string} name Specifies the name of the subdirectory to include
 * @param {object={}} options Specifies the options that will get passed to any targets in the 
 * subdiredtory's makefile.js file.
 */
function subdir({
   name,
   options = {}
}) {
   return new Promise((accept, reject) => {
      const current_path = process.cwd();
      const sub_path = path.join(current_path, name);
      const subdir_options = {
         ...options,
         target_prefix: name,
         target_path: sub_path
      };
      const subdir_makefile_name = options.makefile_name ?? "makefile.js";
      const subdir_makefile_path = path.join(sub_path, subdir_makefile_name);
      if(fs.existsSync(subdir_makefile_path))
      {
         const subdir_module = require(subdir_makefile_path);
         process.chdir(sub_path);
         Promise.resolve(subdir_module(subdir_options)).then(() => {
            process.chdir(current_path);
            accept();
         }).catch((error) => {
            process.chdir(current_path);
            reject(error);
         });
      }
      else
         reject(Error(`makefile.js not found in subdir "${sub_path}`));
   });
}


module.exports = {
   subdir
};