/**
 * Specifies the collection of targets that must be evaluated.  Each time that target() is called, an item will be appended
 * to this array.  This collection is keyed by the target name.
 */
const all_targets = {};

/**
 * @typedef TargetOptionsType
 * @property {string=undefined} target_path Specifies the path from which the target should be evaluated
 */
/**
 * @typedef TargetType
 * @property {string} name Specifies the name of the target
 * @property {string[]} depends Specifies the names of the targets on which this target depends.
 * @property {Promise} action Specifies the action that should be taken to build the target.
 * @property {object={}} options Specifies the execution options for this task (such as target_prefix)
 */
/**
 * @description Constructor for a basic make target
 * @param {TargetType} options Specifies the options for this target
 */
async function target({
   name,
   depends =  [],
   options = { },
   action = function() {}
}) {
   const rtn = { name, depends, action, options };
   all_targets[rtn.name] = rtn;
   return rtn;
}


/**
 * Selects the specified target name but first selects any of the dependencies of that target.
 * @return {TargetType[]} Returns the list of selected targets with dependencies preceding the selected targets. 
 * @param {string} options.target_name Specifies the name of the target to pick
 * @param {Set<string>} options.picked Specifies the target names that have already been picked
 */
function pick_target_and_dependencies(target_name, picked) {
   const target = all_targets[target_name];
   let rtn = [];      
   if(target && !picked.has(target_name))
   {
      picked.add(target_name);
      target.depends.forEach((dependency) => {
         rtn.push(...pick_target_and_dependencies(dependency, picked));
      });
      rtn.push(target);
   }
   else if(!target)
      throw Error(`don't know how to build ${target_name}`);
   return rtn;
}

/**
 * @description Called to evaluate the specified targets. 
 * @param {string[]=[]} target_names Specifies the targets to evaluate. If not specified or specified as an empty array (the default),
 * all declared targets will be evaluated.
 * @param {Logger} logger Specifies the logging module. 
 */
async function evaluate(target_names = [], logger) {
   return new Promise((accept, reject) => {
      // For every target that can be found in the specified list, we will select that target but first select any dependencies.
      const target_keys = Object.keys(all_targets);
      const selected = target_keys.filter((key) => {
         return (target_names.length === 0 || target_names.indexOf(key) >= 0);
      });
      const picked = new Set();
      const required = [];
      selected.forEach((target_name) => {
         required.push(...pick_target_and_dependencies(target_name, picked));
      })

      // We now have the targets arranged in the order that they need to be executed in order to satisify dependencies.
      // we can use this to create the list of promises that must be executed.
      let task_chain = Promise.resolve();
      required.forEach((target) => {
         task_chain = task_chain.then(() => {
            return new Promise((accept_action, reject_action) => {
               const current_dir = process.cwd();
               if(target.options.target_path)
                  process.chdir(target.options.target_path);
               logger.info(`building task ${target.name}`);
               Promise.resolve(target.action()).then(() => {
                  if(target.options.target_path)
                     process.chdir(current_dir);
                  accept_action(target);
               }).catch((error) => {
                  if(target.options.target_path)
                     process.chdir(current_dir);
                  logger.error(Error(`build action ${target.name} failed: ${error}`));
                  reject_action(error);
               });
            });
         })
      });
      task_chain.then((results) => {
         accept(results);
      }).catch((error) => {
         reject(error);
      })
   });
}

/**
 * @typedef MissingDependsType
 * @property {object} target Specifies the object used to track the trrget status
 * @property {string[]} missing Specifies the list of dependent names that cannot be resolved.
 */
/**
 * Searches all targets that have been stored and looks up each of the depend names in order to
 * find missing dependencies
 * @returns {MissingDependsType[]} Returns an array of objects that specify the target object and the names
 * of any missing dependencies.  If all dependencies are resolved, this value will be an empty array.
 */
function find_missing_depends()
{
   const target_keys = Object.keys(all_targets);
   const rtn = [];
   target_keys.forEach((target_name) => {
      const target = all_targets[target_name];
      const missing = target.depends.filter((depend_name) => {
         return (all_targets[depend_name] === undefined);
      });
      if(missing.length > 0)
      {
         rtn.push({
            target: target,
            missing
         });
      }
   })
   return rtn;
}

module.exports = {
   target,
   evaluate,
   all_targets,
   find_missing_depends
};