const Target = require("./Target");
const fs = require("node:fs");


/**
 * Creates a target that will watch a targetted file and will be complete when the last modified time
 * of that target file is newer than the last modified time of the reference file.
 * 
 * @param {string} name Specifies the name of the target to be created.
 * @param {string[]} depends Specifies the collection of names of targets that must be built before this target build is started.
 * @param {string | function<string>} reference Specifies the path to the file from which the target will get its last modified time.
 * @param {string | function<string>} target Specifies the path of the file that the target will watch.
 * @param {number | function<number>} timeout Optionally specifies the amount of time in seconds that the target will wait for the target file to be updated before
 * reporting an error.
 * @param {number=0 | function<number>} delay_after Specifies the number of seconds to delay after a match is made.
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
            const effective_reference = (typeof reference === "function" ? reference() : reference);
            const effective_target = (typeof target === "function" ? target() : target);
            const effective_timeout = (typeof timeout === "function" ? timeout() : timeout);
            const effective_delay_after = (typeof delay_after === "function" ? delay_after() : delay_after);
            const state = {
               elapsed_base: Date.now(),
               elapsed_timer: null,
               reference_time: null,
               matched: false,
               targets: (Array.isArray(effective_target) ? effective_target : [ effective_target ])
            };
            const check_interval = 100;
            fs.stat(effective_reference, (ref_err, reference_stats) => {
               if(ref_err)
                  reject(ref_err);
               else
               {
                  state.reference_time = reference_stats.mtime;
                  state.elapsed_timer = setInterval(() => {
                     const current_time = Date.now();
                     const elapsed = (current_time - state.elapsed_base) / 1000;
                     const all_matched = state.targets.every((the_target) => {
                        const target_stat = fs.statSync(the_target, { throwIfNoEntry: false });
                        let rtn = false;
                        if(target_stat && target_stat.mtime > state.reference_time) {
                           rtn = true;
                        }   
                        return rtn;
                     });
                     if(all_matched) {
                        state.matched = true;
                        if(effective_delay_after === 0) {
                           options.logger.info(`targets are newer than reference`);
                           state.matched = true;
                           clearInterval(state.elapsed_timer);
                           accept(true);
                        }
                        else {
                           if(!state.matched) {
                              state.matched = true;
                              options.logger.info(`${name} targets are newer than reference`);
                              state.elapsed_base = Date.now();
                           }
                           if(elapsed > effective_delay_after) {
                              options.logger.info(`${name} wait_for_synch delay complete`)
                              clearInterval(state.elapsed_timer);
                              accept(true);
                           }
                        }
                     }
                     else if(!state.matched && elapsed > effective_timeout) {
                        clearInterval(state.elapsed_timer);
                        reject(Error(`timed out waiting for targets to update`));
                     }
                  }, check_interval);
               }
            });
         });
      }
   });
   rtn.target = target;
   rtn.reference = reference;
   rtn.timeout = timeout;
   rtn.delay_after = delay_after;
   return rtn;
}

module.exports = {
   wait_for_sync
};
