const child_process = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const Target = require("./Target");

async function do_check_inputs(check, cwd) {
   return new Promise((accept) => {
      if(typeof check === "object")
      {
         const sources = check.sources ?? [];
         const outputs = check.outputs ?? [];
         const source_stats = sources.map((input_name) => {
            const input_path = path.join(cwd ?? ".", input_name);
            return fs.statSync(input_path, { throwIfNoEntry: false });
         });
         const output_stats = outputs.map((output_name) => {
            const output_path = path.join(cwd ?? ".", output_name);
            return fs.statSync(output_path, { throwIfNoEntry: false });
         });
         const dirty = output_stats.find((output_stat) => {
            let rtn = output_stat === undefined;
            if(!rtn)
            {
               // the file will be considered dirt if the last changed stamp on the output is 
               // less than any of the last changed stamps on any of the inputs
               const dirty_input = source_stats.find((source_stat) => {
                  return source_stat === undefined || source_stat.mtime > output_stat.mtime;
               });
               return (dirty_input === undefined);
            }
            return rtn;
         });
         accept(dirty === undefined);
      }
      else
         accept(true);
   })
}


/**
 * @typedef CheckInputsType
 * @property {string[]} sources Specifies the collection of input files.
 * @property {string[]} outputs Specifies the collection of outputs.
 */
/**
 * Defines a target type that executes a child process.
 * @return {object} Returns the data for the target.
 * @param {string} options.name Specifies the name of this target
 * @param {string[] = []} options.depends Specifies the dependencies of this target.
 * @param {boolean=false} options.ignore_exit_code Set to true if the exit code for the child process shouuld be ignored
 * @param {string | function<string>} options.program_name Specifies the name of the program to be run
 * @param {string[] = [] | function<string[]>} options.argv Specifies the program arguments
 * @param {string=process.cwd() | function<string>} options.cwd Specifies the directory from which the process will be executed.  If not specified,
 * will default to the current working directory for the jon-make process.
 * @param {object = {} | function<object>} options.env Specifies the environment variables for the child process.
 * @param {boolean | string = false} options.shell Set to true if the process is to be run within a shell.  Set to a string to
 * specify the shell.
 * @param {CheckInputsType?} options.check_inputs Specifies the collection of input and output files that are checked before running the
 * child process.  If this argument is specified, the child process will not be run unless one or more of the outputs do not exist
 * or one or more of the inputs has a newer last changed stamp.
 * @param {object?} options.options Specifies the options object that is created when this target is generated within a sub-project.
 */
async function execute({
   name,
   depends = [],
   ignore_exit_code = false,
   program_name,
   argv,
   cwd = process.cwd(),
   env = { },
   shell = false,
   check_inputs = undefined,
   options = {}
}) {
   const rtn = await Target.target({
      name,
      depends,
      action: async function() {
         const effective_env = (typeof env === "function" ? env() : env);
         const effective_argv = (typeof argv === "function" ? argv() : argv);
         const effective_program = (typeof program_name === "function" ? program_name() : program_name);
         const effective_cwd = (typeof cwd === "function" ? cwd() : cwd);
         const child_env = { 
            ...process.env, 
            ...effective_env 
         };
         return new Promise((accept, reject) => {
            do_check_inputs(check_inputs, effective_cwd).then((dirty) => {
               if(dirty)
               {
                  const process = child_process.spawn(effective_program, effective_argv, { 
                     stdio: "inherit",
                     cwd: effective_cwd,
                     shell: shell,
                     env: child_env,
                     options
                  });
                  process.on("close", (exit_code) => {
                     if(ignore_exit_code || exit_code === 0)
                        accept();
                     else
                        reject(Error(`${program_name} exited with ${exit_code}`));
                  });
                  process.on("error", (error) => {
                     reject(`failed to launch program: ${error}`);
                  });
               }
               else
                  accept();
            });
         });
      },
      options
   });
   return rtn;
}

module.exports = {
   execute
};