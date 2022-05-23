/**
 * Specifies the collection of targets that must be evaluated.  Each time that target() is called, an item will be appended
 * to this array.  This collection is keyed by the target name.
 */
const all_targets = {};

/**
 * @typedef TargetType
 * @property {string} name Specifies the name of the target
 * @property {string[]} depends Specifies the names of the targets on which this target depends.
 * @property {Promise} action Specifies the action that should be taken to build the target.
 */
/**
 * @description Constructor for a basic make target
 * @param {TargetType} options Specifies the options for this target
 */
function target({
   name,
   depends =  [],
   action = new Promise((accept) => { accept(); })
}) {
   const rtn = { name, depends, action };
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
 */
async function evaluate(target_names = []) {
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
      const promises = required.map((target) => {
         return new Promise((accept_action, reject_action) => {
            Promise.resolve(target.action()).then(() => {
               accept_action(target);
            }).catch((error) => {
               reject_action(error);
            });
         });
      });
      Promise.all(promises).then((results) => {
         accept(results);
      }).catch((error) => {
         reject(error);
      });
      
   });
}


module.exports = {
   target,
   evaluate
};