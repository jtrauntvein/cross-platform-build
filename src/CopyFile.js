const Target = require("./Target");
const fs = require("node:fs/promises");
const path = require("node:path");


async function do_copy() {
   const files_to_copy = [];
   if(Array.isArray(this.source))
      files_to_copy.push(...this.source);
   else
      files_to_copy.push(this.source);
   for(let i = 0; i < files_to_copy.length; ++i)
   {
      const file = files_to_copy[i];
      const file_name = path.basename(file);
      const file_stat = await fs.stat(file);
      await fs.copyFile(file, this.dest);
      await fs.utimes(path.join(this.dest, file_name), file_stat.atimeMs, file.mtimeMs);
   }
}


/**
 * @description Creates a target that can copy one or more files to a destination path
 * 
 * @param {string} options.name Specifies the name for this target
 * @param {string[] = []} options.depends Specifies the list of names for targets that must be built
 * before this target can be built.
 * @param {string | string[]} options.source Specifies the path of the source file or an array of source paths for files
 * to be copied
 * @param {string} options.dest Specifies the path to which the source(s) will be copied.
 * @param {object = {}} options.options Specifies the subproject options created when this target
 * is created within a sub-project.
 * @returns {object} Returns the object created to track the target.
 */
async function copy_file({
   name,
   depends = [],
   source,
   dest,
   options = {}
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: do_copy
   });
   rtn.source = source;
   rtn.dest = dest;
   return rtn;
}

module.exports = {
   copy_file
};