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
      try {
         const subdir_module = require(subdir_makefile_path);
         process.chdir(sub_path);
         subdir_module(subdir_options);
      }
      finally {
         process.chdir(current_path);
      }
   }
   else
      throw Error(`cannot find subdir makefile: ${subdir_makefile_path}`);
}


module.exports = {
   subdir
};