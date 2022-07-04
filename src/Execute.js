const child_process = require("node:child_process");
const Target = require("./Target");

/**
 * Implements the code that executes the child process.
 */
async function do_execute(options) {
   return new Promise((accept, reject) => {
      const process = child_process.spawn(this.program_name, this.argv, { 
         stdio: "inherit",
         cwd: this.cwd,
         shell: this.shell,
         options
      });
      process.on("close", (exit_code) => {
         if(this.ignore_exit_code || exit_code === 0)
            accept();
         else
            reject(Error(`${this.program_name} exited with ${exit_code}`));
      });
      process.on("error", (error) => {
         reject(`failed to launch program: ${error}`);
      });
   });
}


/**
 * Defines a target type that executes a child process.
 * @return {object} Returns the data for the target.
 * @param {string} options.name Specifies the name of this target
 * @param {string[] = []} options.depends Specifies the dependencies of this target.
 * @param {boolean=false} options.ignore_exit_code Set to true if the exit code for the child process shouuld be ignored
 * @param {string} options.program_name Specifies the name of the program to be run
 * @param {string[] = []} options.argv Specifies the program arguments
 * @param {string=process.cwd()} options.cwd Specifies the directory from which the process will be executed.  If not specified,
 * will default to the current working directory for the jon-make process.
 * @param {string[] = []} options.env Specifies the environment variables for the child process.
 * @param {boolean | string = false} options.shell Set to true if the process is to be run within a shell.  Set to a string to
 * specify the shell.
 * @param {object?} options.options Specifies the options object that is created when this target is generated within a sub-project.
 */
function execute({
   name,
   depends = [],
   ignore_exit_code = false,
   program_name,
   argv,
   cwd = process.cwd(),
   env = process.env,
   shell = false,
   options = {}
}) {
   const rtn = Target.target({
      name,
      depends,
      action: do_execute,
      options
   });
   rtn.program_name = program_name;
   rtn.argv = argv;
   rtn.ignore_exit_code = ignore_exit_code;
   rtn.cwd = cwd;
   rtn.env = env;
   rtn.shell = shell;
   return rtn;
}

module.exports = {
   execute
};