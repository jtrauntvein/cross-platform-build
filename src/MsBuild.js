const Execute = require("./Execute");


async function make_msbuild({
   name,
   depends = [],
   options = {},
   project_file,
   cwd,
   platform = undefined,
   config = "Release"
}) {
   const msbuild_args = [
      project_file,
      `/p:Configuration=${config}`
   ];
   if(platform)
      msbuild_args.push(`/p:Platform=${platform}`);
   Execute.execute({
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