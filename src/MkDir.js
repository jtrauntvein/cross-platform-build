const Target = require("./Target");
const fs = require("node:fs/promises");


/**
 * @description Creates a target that is responsible for ensuring the existence of a file system directory.
 * @param {string} options.name Specifies the name of the target.
 * @param {string[] = []} options.depends Specifies the list of names for targets that must be built before this
 * target is built.
 * @param {string | function<string>} options.path Specifies the path for the directory to be created.
 * @param {object = {}} options.options Specifies the object used to track sub-project targets.
 * @returns {object} Returns the object created to track the target.
 */
async function mk_dir({
   name,
   depends = [],
   path,
   options = {}
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_path = (typeof path === "function" ? path() : path);
         const rtn = await fs.mkdir(effective_path, {
            recursive: true
         });
         return rtn;
      }
   });
   rtn.path = path;
   return rtn;
}


module.exports = {
   mk_dir
};