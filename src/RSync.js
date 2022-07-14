const Target = require("./Target");
const rsyncjs = require("rsyncjs");

async function do_rsync() {
   return new Promise((accept, reject) => {
      const async = rsyncjs.async;
      async(this.source, this.dest, {
         deleteOrphaned: this.delete_orphaned,
         exclude: this.exclude,
         filter: this.filter,
         onError: function(error) {
            reject(error);
         }
      }).then(() => {
         if(this.reported_error)
            reject(this.reported_error);
         else
            accept(true);
      });
   });
}


/**
 * @description Creates a target that will ensure that all of the files in the
 * source path parameter are copied to the dest path parameter,
 * 
 * @param {string} options.name Specifies the name of the new target.
 * @param {string[] = []} options.depends Specifies the targets that must be built before this target can be built.
 * @param {string} options.source Specifies the source path from which files will be copied.
 * @param {string} options.dest Specifies the path to which the source files will nbe copied.
 * @param {boolean = true} options.delete_orphaned Set to true if files that are in the dest path that are not present
 * in the source path should be copied.
 * @param {string? | string[]? | RegExp? | function<string>?} options.filter Specifies file name(s), regular expressions, or
 * a callback function that can be used to determine whether a given file or directory should be skipped.
 * @param {object} options.options Specifies the sub-project options that can be created when the target is created from a parent project.
 */
async function rsync({
   name,
   depends = [],
   source,
   dest,
   delete_orphaned = true,
   exclude = null,
   filter = undefined,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: do_rsync
   });
   rtn.source = source;
   rtn.dest = dest;
   rtn.delete_orphaned = delete_orphaned;
   rtn.exclude = exclude;
   rtn.filter = filter;
   rtn.reported_error = null;
   return rtn;
}

module.exports = {
   rsync
};
