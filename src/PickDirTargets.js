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
 * @param {function<fs.Dirent>} params.pick Specifies the call-back function that will be called for each direftory entry.  Targets can be added 
 * within this callback.
 * @param {object?} options Specifies the options that are generated for sub-projects.
 */
async function pick_dir_targets({
   options,
   filter
}) {
   return new Promise((accept, reject) => {
      fs.readdir(process.cwd(), {withFileTypes: true}).then((files) => {
         for(let file of files)
         Promise.resolve(filter(file, options)).then((filter_accept) => {
            filter_accept(true);
         });
      }).then(() => {
         accept(true);
      }).catch((error) => {
         reject(error);

      });
   });
}


module.exports = {
   pick_dir_targets
};