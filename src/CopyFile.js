const Target = require("./Target");
const fs = require("node:fs/promises");
const path = require("node:path");



/**
 * @description Creates a target that can copy one or more files to a destination path
 * 
 * @param {string} options.name Specifies the name for this target
 * @param {string[] = []} options.depends Specifies the list of names for targets that must be built
 * before this target can be built.
 * @param {string | string[] | function<string> | function<string[]} options.source Specifies the path of the source file or an array of source paths for files
 * to be copied
 * @param {string | function<string>} options.dest Specifies the path to the directory to which the source(s) will be copied.
 * @param {string | function<string>} options.rename Optionally specifies the name of the file in the destination directory.  This is only used when there is only one
 * source name specified.
 * @param {object} options.options Specifies the subproject options created when this target
 * is created within a sub-project.
 * @returns {object} Returns the object created to track the target.
 */
async function copy_file({
   name,
   depends = [],
   source,
   dest,
   rename = undefined,
   options = {}
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async() => {
         const effective_source = (typeof source === "function" ? source() : source);
         const effective_rename = (typeof rename === "function" ? rename() : rename);
         const effective_dest = (typeof dest === "function" ? dest() : dest);
         const files_to_copy = [];
         if(Array.isArray(effective_source))
            files_to_copy.push(...effective_source);
         else
            files_to_copy.push(effective_source);
         for(let i = 0; i < files_to_copy.length; ++i)
         {
            const file = files_to_copy[i];
            const file_name = (effective_rename && files_to_copy.length === 1 ? effective_rename : path.basename(file));
            const dest_name = path.join(effective_dest, file_name);
            const file_stat = await fs.stat(file);
            let dest_stat;
            try {
               dest_stat = await fs.stat(path.join(effective_dest, file_name));
            }
            catch(dest_stat_error) {
               // ignore exception
            }

            if(!dest_stat || dest_stat.mtime !== file_stat.mtime)
            {
               if(options.logger)
                  options.logger.info(`copying ${file} to ${path.join(effective_dest, file_name)}`);
               await fs.copyFile(file, dest_name);
               await fs.utimes(path.join(effective_dest, file_name), file_stat.atime, file_stat.mtime);
            }
         }
      }
   });
   rtn.source = source;
   rtn.dest = dest;
   rtn.rename = rename;
   return rtn;
}

module.exports = {
   copy_file
};