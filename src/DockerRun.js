const Execute = require("./Execute.js");

/**
 * @typedef DockerRunMountType Describes the properties of a mount point as given in the docker run
 * command.
 * @property {string} source Specifies the name of the directory on the host machine that will be bound
 * or the name of the docker volume that will be bound
 * @property {string} target Specifies the path within the container to which the data will be mounted
 * @property {bool} bind_mount Set to true if the data is to be shared with the host machine using a bind mount.
 * This value is set to true by default.  If false, the mount type will be for a volume.
 * @property {bool} read_only Set to true if the mounted data should not be changed.
 */
/**
 * @typedef DockerRunOptionsType Describes the option names that can be passed to the `docker_run()` 
 * target function.
 * @property {string} name Specifies the name of the target to be generated
 * @property {string[]} depends Specifies the list of names for targets that must be built before this
 * target can be built.
 * @property {string} image Specifies the name and tag for the image to be executed
 * @property {string?} entry_point_dir Specifies the directory from which the entry point will be executed
 * @property {string} entry_point Specifies the name of the program that should be executed when the 
 * container has been started.
 * @property {string[]?} entry_point_args Specifies the command line arguments that will be passed to the entry point
 * process.
 * @property {bool} interactive Set to true (defaults to false) if the standard I/O for the container should be 
 * directed to the host.
 * @property {DockerRunMountType[]?} mounts Specifies the mount points for the container.  Defaults to an
 * empty list.
 * @property {object?} env Specifies an object that will define environment variables within the container
 * before the entry point is executed.  The keys of this object will be environment variable names whereas
 * the values will be rendered as environment variable value strings.
 * @property {object} options Must specify the `options` argument that is passed to the exported function
 * from `makefile.js` 
 */
/**
 * Defines an async function that will generate a task to execute a program within a docker container
 * @param {DockerRunOptionsType} parameters Specifies the target parameters.
 * @return {object} Returns an object that will represent the allocated target
 */
async function docker_run({
   name,
   depends,
   image,
   entry_point_dir = "/home",
   entry_point = "bin/bash",
   entry_point_args = [],
   interactive = false,
   mounts = [],
   env = {},
   options
}) {
   const argv = [ "run", "--rm", "--workdir", entry_point_dir ];
   const env_keys = Object.keys(env);
   if(interactive) {
      argv.push("-it");
   }
   env_keys.forEach((key) => { 
      argv.push("--env", `${key}=${env[key]}`)
   });
   mounts.forEach((mount) => {
      const mount_options = [];
      if(mount.bind_mount) {
         mount_options.push("type=bind", `source=${mount.source}`, `target=${mount.target}`);
      }
      else {
         mount_options.push(`source=${mount.source}`, `target=${mount.target}`);
      }
      if(mount.read_only) {
         mount_options.push("ro");
      }
      argv.push(...mount_options.join(","));
   });
   argv.push(image, entry_point, ...entry_point_args);
   return Execute.execute({
      name,
      depends,
      program_name: "docker",
      argv,
      options
   });
}

module.exports = {
   docker_run
}