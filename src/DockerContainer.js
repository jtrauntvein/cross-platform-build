const Execute = require("./Execute");


/**
 * @typedef PullDockerContainerOptions
 * @property {string} name Specifies the name of the target.
 * @property {string[]=[]} depends Specifies the names of targets that must be built before this target is built.
 * @property {string} image Specifies the URL for the docker image to pull
 * @property {string[]} env Specifies the collection of environment variables to be defined for the child process.
 * @property {object={}} options Specifies the options generated when this target is built within a sub-project.
 */
/**
 * 
 * @param {PullDockerContainerOptions} options Specifies the target options. 
 * @returns {object} Returns the object created to track the task status
 */
async function pull_docker_container({
   name,
   depends = [],
   image,
   env = [],
   options
   
}) {
   return Execute.execute({
      name,
      depends,
      options,
      program_name: "docker",
      argv: [
         "pull",
         image
      ],
      env
   });
}


/**
 * @typedef DockerContainerOptions
 * @property {string} name Specifies the name of the target
 * @property {string[]=[]} depends Specifies the dependencies for the target.
 * @property {string} image Specifies the URL for the docker image
 * @property {string} entry_point Specifies the name of the program to run within the container.
 * @property {string[]=[]} entry_point_argv Specifies the arguments to be passed to the container entry point
 * @property {string="/home"} mount_point Specifies the path where the task working directory will be mapped within the container.
 * @property {string=process.cwd()} cwd Specifies the working directory from which the container will be run.
 * @property {string[]=[]} env Specifies the environment variables to be defined within the container entry point.
 * @property {object={}} options Specifies the options generated when the target is built within a sub-project
 */
/**
 * Defines a task that will run a process within a docker container in order to build the task
 * @param {DockerContainerOptions} options Specifies the options to pass to the target 
 * @returns {object} Returns the object that is created to track the  target status.
 */
function docker_container({
   name,
   depends = [],
   image,
   entry_point,
   entry_point_argv = [],
   mount_point = "/home",
   cwd = process.cwd(),
   env = [],
   options = {}
}) {
   return Execute.execute({
      name,
      depends,
      options,
      program_name: "docker",
      argv: [
         "run",
         "-t",
         "--mount",
         `type=bind,src=${cwd},dst=${mount_point},consistency=cached`,
         image,
         entry_point,
         ...entry_point_argv
      ],
      cwd,
      env
   });
}

module.exports = {
   docker_container,
   pull_docker_container
}