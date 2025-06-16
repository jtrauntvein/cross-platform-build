const { execute } = require("./Execute.js");
const process = require("node:process");

/**
 * @typedef DockerBuildParamsType Specifies the parameters for thr `docker_build` target type
 * @property {string} name Specifies the name for the target
 * @property {string[]} depends Specifies the names of targets that must be built before this targate
 * can be built
 * @property {object?} env Specifies the environment variables that should be defined for the docker process
 * @property {string} image_name Specifies the name to be assigned to the created docer image
 * @property {string?} docker_file Specifies the name of the file to use for building the image
 * @property {string?} working_dir Specifies the path from which the container should be built.
 * @property {object} options Must specify the `options` object passed to or derived from the
 * options argument passed to the makefile exported function.
 */
/**
 * 
 * @param {DockerBuildParamsType} parameters Specifies the target parameters
 * @returns {object} Returns the object generated to track the created target
 */
async function docker_build({
   name,
   depends,
   env = {},
   image_name,
   docker_file = ".",
   working_dir = process.cwd(),
   options
}) {
   const argv = [ 
      "-f", docker_file, 
      "--secret", "id=npmrc,src=$HOME/.npmrc"]
      "-t", image_name,
      working_dir
   return await execute({
      name,
      depends,
      program_name: "docker",
      argv,
      cwd: working_dir,
      env,
      options
   });
}

module.exports = {
   docker_build
}