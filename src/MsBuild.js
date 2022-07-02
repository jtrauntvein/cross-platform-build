const Execute = require("./Execute");

/**
 * @typedef MsBuildOptionsType
 * @property {string} name Specifies the target name
 * @property {Array<string> = []} depends Specifies the target names upon which the generated target will depend.
 * @property {string} project_file Specifies the name of the project file
 * @property {string?} cwd Specifies the directory from which the project should be built.
 * @property {string?} platform Specifies the platform identifier ("x86" or "x64").  If not specified, the default platform will be used.
 * @property {string="Release"} config Specifies the build configuration to be built.
 * @property {string[] = []} msbuild_options Specifies any other command line arguments that should be passed to msbuild.
 * @property {Object={}} options Specifies target options.  If the makefile.js exported function is passed an options
 * parameter, that parameter must be passed for this value.
 */
/**
 * @description Generates a target that will invoke the visual studio build tool (msbuild) with a specified configuration and optional
 * platform.
 * @param {MsBuildOptionsType} options Specifies the options for the target.
 */
async function make_msbuild({
   name,
   depends = [],
   project_file,
   cwd = undefined,
   platform = undefined,
   config = "Release",
   msbuild_options = [],
   options = {}
}) {
   const msbuild_args = [
      project_file,
      `/p:Configuration=${config}`,
      ...msbuild_options
   ];
   if(platform)
      msbuild_args.push(`/p:Platform=${platform}`);
   return Execute.execute({
      name,
      depends,
      ignore_exit_code: false,
      program_name: "msbuild",
      cwd,
      args: msbuild_args,
      options
   });
}


module.exports = {
   make_msbuild
};