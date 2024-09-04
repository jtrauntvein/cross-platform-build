const Target = require("./Target");
const fsp = require("node:fs/promises");
const path = require("node:path");

/**
 * @typedef TouchOptions Specifies the options that will be passed to the touch() function.
 * @property {string} name Specifies the name for the new target
 * @property {string[] = []} depends Specifies the list of target names on which this target depends
 * @property {string | string[]} source specifies the path to the file to be touched or an array of files
 * names to be touched
 * @property {object} options Specifies the subproject options for this target.  
 */
/**
 * @description Creates a target that can set the last updated time for one or more files
 * @param {TouchOptions} options Specifies the options for this function
 */
async function touch({
   name,
   depends = [],
   source,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      source,
      options,
      action: async () => {
         // we need to get the list of source files on which to operate
         const source_files = [];
         if(Array.isArray(source)) {
            source_files.push(...source);
         }
         else if(typeof source === "string") {
            source_files.push(source);
         }
         else {
            throw Error("touch: invalid source type");
         }

         // for each referenced file, we will set the current time as the last modified time
         const now = new Date();
         for(let i = 0; i < source_files.length; ++i) {
            const file = source_files[i];
            const file_stat = await fsp.stat(file);

            if(options.logger) {
               options.logger.info(`touching ${file}`);
            }
            await fsp.utimes(file, file_stat.atime, now);
         }
      }
   });
   return rtn;
}

module.exports = {
   touch
};