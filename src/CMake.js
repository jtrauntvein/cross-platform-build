const Target = require("./Target");
const fs = require("node:fs");
const child_process = require("node:child_process");
const os = require("node:os");
const process = require("node:process");

/**
 * @typedef CMakeDefineType Defines the parameters required to define a cmake variable from the command line
 * @property {string} name Specifies the name of the cmake variable
 * @property {string?} type Specifies the type of the variable.  Defaults to `string` if not specified.
 * @property {string} value Specifies the value for the cmake variable
 */
/**
 * @typedef CMakeParametersType Defines the properties for the cmake target type
 * @property {string} name specifies the name of the new target
 * @property {string[]?} depends specifies the targets that must be built before the target
 * created by this call
 * @property {string?} source_dir specifies the path to the directory where the source
 * CMakeLists.txt file can be found
 * @property {string} build_dir Specifies the path to the directory where the cmake configuration and build 
 * files will be written.
 * @property {string?} generator Specifies the type of build files to generate.  Will default to makefile for 
 * linux builds and nmake for windows builds.
 * @property {CMakeDefineType[]?} variables Specifies the collection of cmake variables that should be
 * created through the command line.
 * @property {object} options Should specify the options object passed to the makefile.js entry point.
 */

/**
 * Creates a target that will invoke the cmake build utility
 * @param {CMakeParametersType} parameters Specifies the parameters for the target
 * @return returns the object used to track the new target
 */
async function cmake_configure({
   name,
   depends,
   source_dir = process.cwd(),
   build_dir,
   generator,
   variables = [],
   options
}) {
   const target_params = {
      name,
      depends,
      options,
      action: () => {
         return new Promise((accept, reject) => {
            // we need to ensure that the build directory exists
            fs.mkdir(build_dir, { recursive: true }, (err) => {
               if(!err) {
                  // we will now need to invoke cmake to configure the build
                  const cmake_vars = variables.map((variable) => {
                     return `-D${variable.name}:${variable.type ?? "string"}=${variable.value}`;
                  });
                  let effective_generator = generator;
                  if(!effective_generator) {
                     effective_generator = (os.platform() === "linux" ? "Unix Makefiles" : "NMake Makefiles");
                  }
                  const process = child_process.spawn(
                     "cmake", 
                     [ 
                        "-G", effective_generator, ...cmake_vars, source_dir ], {
                        stdio: "inherit",
                        cwd: build_dir,
                        shell: false
                     });
                  process.on("close", (exit_code => {
                     if(exit_code === 0) {
                        accept(true);
                     }
                     else {
                        reject(Error(`cmake exited with ${exit_code}`));
                     }
                  }));
                  process.on("error", (err) => {
                     reject(Error(`failed to launch cmake: ${err}`));
                  });
               }
               else {
                  reject(Error(`failed to create build directory (${build_dir}): ${err}`));
               }
            });
         });
         
         
      }
   };

   return Target.target(target_params);
}

module.exports = {
   cmake_configure
};

