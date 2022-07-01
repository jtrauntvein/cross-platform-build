const fs = require("node:fs/promises");

/**
 * @typedef PickDirTargetsParamsType
 * @property {function<fs.Dirent>} pick Specifies the callback function that will be called for each directory entry in the working directory.
 * It is up to this function to add any targets that may be associated with the directory entry.
 * @property {object={}} options Specifies the options that should be registered for all added targets.
 */
/**
 * @description Defines a worker function that implements the mechanics of scanning the current working directory for files that could be converted
 * into targets. 
 * @param {PickDirTargetsParamsType} params Specifies the parameters for this function.
 */
async function pick_dir_targets({
   options,
   filter
}) {
   const files = await fs.readdir(process.cwd(), {withFileTypes: true});
   for(let file of files)
      await Promise.resolve(filter(file, options));
}


module.exports = {
   pick_dir_targets
};