const Target = require("./Target");
const fs = require("node:fs");


/**
 * Creates a target that will watch a targetted file and will be complete when the last modified time
 * of that target file is newer than the last modified time of the reference file.
 * 
 * @param {string} name Specifies the name of the target to be created.
 * @param {string[]} depends Specifies the collection of names of targets that must be built before this target build is started.
 * @param {string} reference Specifies the path to the file from which the target will get its last modified time.
 * @param {string} target Specifies the path of the file that the target will watch.
 * @param {number} timeout Optionally specifies the amount of time in seconds that the target will wait for the target file to be updated before
 * reporting an error.
 * @param {number=0} delay_after Specifies the number of seconds to delay after a match is made.
 * @param {object} options Specifies the options argument passed to the makefile.js entry-point.
 */
async function wait_for_sync({
   name,
   depends = [],
   reference,
   target,
   timeout = 300,
   delay_after = 0,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         return new Promise((accept, reject) => {
            const state = {
               elapsed_base: Date.now(),
               elapsed_timer: null,
               reference_time: null,
               matched: false
            };
            const check_interval = 100;
            fs.stat(reference, (ref_err, reference_stats) => {
               if(ref_err)
                  reject(ref_err);
               else
               {
                  state.reference_time = reference_stats.mtime;
                  state.elapsed_timer = setInterval(() => {
                     const current_time = Date.now();
                     const elapsed = (current_time - state.elapsed_base) / 1000;
                     const target_stat = fs.statSync(target, { throwIfNoEntry: false });
                     if(target_stat && target_stat.mtime > state.reference_time)
                     {
                        if(delay_after === 0)
                        {
                           options.logger.info(`target file is newer than the reference`)
                           state.matched = true;
                           clearInterval(state.elapsed_timer);
                           accept(true);
                        }
                        else
                        {
                           if(!state.matched)
                           {
                              state.matched = true;
                              options.logger.info(`target file is newer than the reference: waiting for ${delay_after} seconds`);
                              state.elapsed_base = Date.now();
                           }
                           if(elapsed > delay_after)
                           {
                              clearInterval(state.elapsed_timer);
                              options.logger.info(`${name} wait_for_synch delay is complete`);
                              accept(true);
                           }
                        }
                     }
                     else if(!state.matched && elapsed > timeout)
                     {
                        clearInterval(state.elapsed_timer);
                        reject(Error("timed out waiting for the target to update"));
                     }
                  }, check_interval);
               }
            });
         });
      }
   });
   return rtn;
}

module.exports = {
   wait_for_sync
};
