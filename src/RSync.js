const Target = require("./Target");
const fs = require("node:fs/promises");
const path = require("node:path");

let sync_dir;
const file_types = {
   directory: 0,
   file: 1,
   other: 2
};
const file_ops = {
   copy: async function(op_desc, logger) {
      logger.info(`copying ${op_desc.source} to ${op_desc.dest} with time ${op_desc.mtime}\n`)
      await fs.copyFile(op_desc.source, op_desc.dest);
      await fs.utimes(op_desc.dest, new Date(op_desc.mtime), new Date(op_desc.mtime));
   },
   rm: async function(op_desc, logger) {
      logger.info(`removing ${op_desc.path}\n`);
      await fs.rm(op_desc.path, { force: true, recursive: true });
   },
   sync: async function(op_desc, logger) {
      logger.info(`synching ${op_desc.source} to ${op_desc.dest}\n`);
      await sync_dir(op_desc.target, op_desc.source, op_desc.dest, op_desc.target.filter, op_desc.target.delete_orphaned, op_desc.target.filter_orphan);
   }
};

sync_dir = async function(target, source, dest, filter, delete_orphaned, filter_orphan) {
   return new Promise((accept, reject) => {
      try {
         // we need to ensure that the destination directory exists.
         fs.mkdir(dest, { recursive: true }).then(() => {
            // we need to read the source directory
            fs.readdir(source).then((items) => {
               // we need to consider whether the each source item passes the filter
               const source_items = items.filter((item) => {
                  const source_path = path.join(source, item);
                  let rtn = true;
                  if(typeof filter === "function")
                     rtn = filter(source_path);
                  else if(typeof filter === "object" && filter instanceof RegExp)
                     rtn = source_path.match(filter);
                  return rtn;
               });
               fs.readdir(dest, { withFileTypes: true }).then((dest_items) => {
                  // we need to get the stats for each of the source and dest items.  Once we have those, we can 
                  // determine what, if any operations need to be done on each.
                  const source_stat_promises = source_items.map((file_name) => {
                     return new Promise((stat_accept, stat_reject) => {
                        fs.stat(path.join(source, file_name)).then((stat) => {
                           stat.name = file_name;
                           stat_accept(stat);
                        }).catch((error) => {
                           stat_reject(error);
                        });
                     });
                  });
                  Promise.allSettled(source_stat_promises).then((source_stat_results) => {
                     const source_stats = source_stat_results.map((result) => result.value);
                     const dest_stat_promises = dest_items.map((dest_item) => {
                        return new Promise((stat_accept, stat_reject) => {
                           fs.stat(path.join(dest, dest_item.name)).then((stat) => {
                              stat.name = dest_item.name;
                              stat_accept(stat);
                           }).catch((stat_error) => {
                              stat_reject(stat_error);
                           });
                        });
                     });
                     Promise.allSettled(dest_stat_promises).then((dest_results) => {
                        // we need to generate the list of operations that will need to be performed.
                        const ops = [];
                        const dest_stats = dest_results.map((result) => result.value);
                        source_stats.forEach((source_stat) => {
                           const matching_dest = dest_stats.find((dest_stat) => dest_stat.name.toUpperCase() === source_stat.name.toUpperCase());
                           const source_path = path.join(source, source_stat.name);
                           const dest_path = path.join(dest, source_stat.name);
                           if(matching_dest !== undefined)
                           {
                              const source_type = (source_stat.isDirectory() ? file_types.directory : (source_stat.isFile() ? file_types.file : file_types.other));
                              const dest_type = (matching_dest.isDirectory() ? file_types.directory : (matching_dest.isFile() ? file_types.file : file_types.other));
                              if(source_type === dest_type && source_type === file_types.file) 
                              {
                                 if(source_stat.mtime.toString() !== matching_dest.mtime.toString())
                                    ops.push({ op: "copy", source: source_path, dest: dest_path, atime: source_stat.atime, mtime: source_stat.mtime });
                              }
                              if(source_type === dest_type && source_type === 0)
                                 ops.push({ target, op: "sync", source: source_path, dest: dest_path });
                              if(source_type !== dest_type)
                              {
                                 // we will first add an op to delete the directory and will then add an op 
                                 ops.push({ op: "rm", path: dest_path });
                                 if(source_type === 0)
                                    ops.push({ target, op: "sync", source: source_path, dest: dest_path });
                                 if(source_type === 1)
                                    ops.push({ target, op: "copy", source: source_path, dest: dest_path, atime: source_stat.mtime, mtime: source_stat.mtime });
                              }
                           }
                           else
                           {
                              if(source_stat.isDirectory())
                                 ops.push({ target, op: "sync", source: source_path, dest: dest_path });
                              else if(source_stat.isFile())
                                 ops.push({ target, op: "copy", source: source_path, dest: dest_path, atime: source_stat.mtime, mtime: source_stat.mtime });
                           }
                        });

                        // if the delete orphaned flag is set, we will need to delete any dest items that are not in the source directory.
                        if(delete_orphaned)
                        {
                           dest_items.forEach((dest_item) => {
                              const source_item = source_items.find((source_item) => source_item.toUpperCase() === dest_item.name.toUpperCase());
                              const dest_path = path.join(dest, dest_item.name);
                              if(!source_item && filter_orphan(dest_path))
                                 ops.push({ op: "rm", path: dest_path });
                           });
                        }
                        target.pending_ops.push(...ops);
                        accept();
                     }).catch((error) => {
                        reject(error);
                     });
                  }).catch((error) => {
                     reject(error);
                  });
               }).catch((error) => {
                  reject(error);
               });
            }).catch((error) => {
               reject(error);
            })
         }).catch((error) => {
            reject(error);
         });
      }
      catch(error) {
         reject(error);
      }
   });
}

/**
 * @description Creates a target that will ensure that all of the files in the
 * source path parameter are copied to the dest path parameter,
 * 
 * @param {string} options.name Specifies the name of the new target.
 * @param {string[] = []} options.depends Specifies the targets that must be built before this target can be built.
 * @param {string | function<string>} options.source Specifies the source path from which files will be copied.
 * @param {string | function<string>} options.dest Specifies the path to which the source files will nbe copied.
 * @param {boolean = true} options.delete_orphaned Set to true if files that are in the dest path that are not present
 * in the source path should be copied.
 * @param {function<string>?} options.filter_orphan Optionally specifies a function that will be called for any orphaned object 
 * in the dest directory that might be deleted because of the delete_orphaned object.  This parameter will be ignored if delete_orphaned is 
 * set to false.  If no parameter is specified, all orphaned objects will be deleted.
 * @param {function<string>?} options.filter Optionally specifies a call-back function that will be called with the path
 * to one of the source objects (file or directory).  This callback must return true if the object should be included or
 * false if the object is to be ignored.  If this parameter is not defined, all objects in the source path will be considered.
 * @param {object} options.options Specifies the sub-project options that can be created when the target is created from a parent project.
 */
async function rsync({
   name,
   depends = [],
   source,
   dest,
   delete_orphaned = true,
   filter = undefined,
   filter_orphan = () => true,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_source = (typeof source === "function" ? source() : source);
         const effective_dest = (typeof dest === "function" ? dest() : dest);
         await sync_dir(this, effective_source, effective_dest, filter, delete_orphaned, filter_orphan);
         while(this.pending_ops.length > 0)
         {
            const op = this.pending_ops[0];
            this.pending_ops.splice(0, 1);
            await file_ops[op.op](op, this.options.logger);
         }
         return true;
      }
   });
   rtn.source = source;
   rtn.dest = dest;
   rtn.delete_orphaned = delete_orphaned;
   rtn.filter_orphan = filter_orphan;
   rtn.filter = filter;
   rtn.reported_error = null;
   rtn.pending_ops = [];
   return rtn;
}

module.exports = {
   rsync
};
