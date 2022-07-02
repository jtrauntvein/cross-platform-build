# cross-platform-build

High level build platform that can be used to generate build targets with dependencies.  The build tool,
when invoked, will look for a file, makefile.js, that should export a single async function that will make calls to various platform functions that will generate targets.

## 1 - Installing cross-platform-build

The easiest way to use the cross-platform build package is to install it globally:

```bash
npm install -g cross-platform-build
```

This will set up a script that allows you to invoke the program as follows:

```bash
cross-platform-build target1 target2 ...
```

Alternatively, cross-platform-build can be installed as a dev dependency of a project.  In this case, the program can be installed as follows:

```bash
npm install --save-dev cross-platform-build
```

After successful local installation, the program can be invoked using the npx command:

```bash
npx cross-platform-build target1 target2 ...
```

## 2 - Running cross-platform-build

The cli has the following syntax:

```
command-line := "cross-platform-build" [ ("-f" | "--file") makefile-name ] { target-name }.
makefile-name := string. ; javascript file name
target-name := string.   ; name of a target defined in the makefile.
```

If the -f or --file option is not specified, the builder will look for a "makefile.js" file in the current working directory.  This file needs to be a common JS module that exports a single asynchronous function.  The builder will load the module and execute the exported function.  Following that, the builder will execute the build targets that are specified and will ensure that any dependencies of those targets are built first.  If no target names are specified on the command line, the builder will build all targets that were created in the makefile.

## 3 - Creating a Makefile

Consider the following example makefile:

```javascript
const { subdir, execute } = require("cross-platform-build");

module.exports = async function(options) {
   // pick up any targets in the "src" subdirectory
   subdir({
      name: "src",
      options
   });

   // execute the gcc compiler using an execute type target with a name
   execute({
      name: "build-name",
      program_name: "gcc",
      argv: [ "-o", "foo", "foo.c" ],
      depends: [ "src/libraries" ]
   });
};
```

### 3.1 - Target Types

The cross-platform-build module defines functions that can be called to generate specific types of targets.  This list is extensible in that the application could define its own custom target types.  The pre-built target types are described in this section.

#### 3.1.1 - target()

The target() function is general-purpose in that it associates the target name with an application-defined call-back function that carries out the work of building the target.  This function also serves as the basis for any more specialised target type.  The parameters for this function are as follows:

* name (string, required): Identifies the name of the target.  This value must be unique in the scope of the build environment and is used to resolve dependencies on this target from other targets.  This value will also be displayed to the user when the build environment is invoked interactively.

* depends (string[], optional): Identifies the collection of targets that must be built before this target can be built.  This array can include names of any targets within the current directory as well as the names of any targets generated in a sub-directory.

* action (function, required): Specifies the function that will be called to "build" this target.  This function can be declared as async or it can return a promise.  The target is not considered "built" until the promise is accepted.

* options (object, optional): Specifies an options argument that is created by the module when the task is being executed within a sub-project.  The properties of this object include the following:
   * target_prefix (string): Specifies the name of the sub-project
   * target_path (string): Specifies the path to the sub-project directory
   * other application defined properties

The return value from this function will be the object that was generated to track the state of the target and its options.


#### 3.1.2 - execute()

The execute() function returns a target that will invoke a child process.  The parameters for this function are as follows:

* name (string, required): Specifies the name of the target.
* depends (string[], required): Specifies the names of targets on which this target will depend.
* depends (string[], optional): Specifies the names of targets that must be built successfully before this target can be built.
* program_name (string, required): Specifies the name of the program that should be run to build this target.
* argv (string[], required): Specifies the options that will be passed on the command line to the child process.
* cwd (string, optional): Specifies the path to a directory from which the child process must be executed.
* env (string[], optional): Specifies a collection of environment variables that can be defined for the child process.
* shell (boolean, optional): Set to true if the child process should be run within a shell.
* ignore_exit_code (boolean, optional): Set to true if the exit code for the child process should be ignored.
* options (object, optional): Specifies the options structure that is created when this target type is built within a sub-project.

The return value for this function will be the object that is generated to track the state of the task.


#### 3.1.3 - make_cdecl()

The make_cdecl() function generates a target that will operate on any file and will generate a target file that formats the contents of that file as a C or C++ declaration of an array that can be linked into a program as a resource.  The output file will not be regenerated if the output file already exists and the last modified time of that file is greater than the last modified time of the source file.  This function accepts the following parameters:

* name (string, required): Specifies the name of the target.
* depends (string[], optional): Specifies the names of targets that must be built before this target.
* input (string, required): Specifies the name of the input file.
* output (string, required): Specifies the name of the output file.
* variable_name (string, required): Specifies the name of the variable that will be declared in the output file.
* namespaces (string, optional):  Specifies the names of C++ namespaces that will be generated in the output and will contain the generated declaration.
* options (object, optional): Specifies the options structure that is generated when this target is generated within a sub-project.

The return value from this function will be the object that is generated to track the state of the task.


#### 3.1.4 - msbuild()

The msbuild() function generates a target derived from the execute() target type that will invoke the Visual Studio msbuild tool with a given project, target configuration, and optional architecture.  The arguments for this function are as follows:

* name (string, required): Specifies the name of the target
* depends (string[], optional): Specifies the names of targets that must be built before this target is built.
* project_file (string, required): Specifies the name of the Visual Studio project which will be built.
* config (string, optional): Specifies the name of the Visual Studio project configuration that should be built.  If not specified to the "Release" configuration.
* platform (string, optional): Specifies the platform architecture for the target.
* cwd (string, optional): Specifies the directory from which the project should be built.
* msbuild_options (string[], optional): Specifies any extra command line options that should be passed to msbuild.  This could include environment options that get passed to the compiler.
* options (object, optional): Specifies the options object generated when this target is created within a sub-project.

The return value of this function will be the object that was allocated to track the state of the target.

#### 3.1.5 - http_request()

The http_request() function generates a target that will invoke an HTTP based service using the Axios node package.  It supports GET, PUT, and POST HTTP methods.  The arguments for this function are as follows:

* name (string, required): Specifies the name of the target
* depends (string[], optional): Specifies the collection of tasks that must be built before this target can be built.
* endpoint (string, required): Specifies the URL address and path for the web service.
* method (string, optional): Specifies the HTTP protocol method that should be used.  Can be one of "POST", "GET", or "PUT".
* query_params (object, optional): Specifies the query parameters that should be encoded in the URL.
* headers (object, optional): Specifies HTTP header values that will get passed in the request.
* data (function, string || object || ArrayBuffer || ArrayBufferView || FormData || File || Blob || node Stream || node Buffer, optional): Specifies the data that should get passed in the body of the request.  If a function is passed, it will be invoked when the target is built and expected to return one of the other types.
* other_axios_props (object, optional): Specifies other configuration options for the Axios request.
* response_handler (function<object>, optional): Specifies a call-back that will process the response data from the request.
* options (object, optional): Specifies the options that are generated when the target is created within a sub-project.


The return value of this function will be the object that is created the track the state of the target.


#### 3.1.6 - pull_docker_container()

The pull_docker_container() function generates a target that will run docker in a child process in order to pull a remote docker container image.

 The arguments for this function are as follows:

* name (string, required): Specifies the name of the target
* depends (string[], optional) Specifies the names of targets that must be built before this target.
* image (string, required): Specifies the URL for the container to pull.
* env (string[], optional): Specifies environment variables that must be defined while pulling the docker image.
* options (object, optional): Specifies the options that are generated when the target is built as a part of sub-project.


#### 3.1.7 - docker_container()

The docker_container() function generates a target that will run a targetting process within a docker container.  The working directory for the target will be mounted as a volume within the docker container.  The options for this function are as follows:

* name (string, required): Specifies the name of the target.
* depends (string, optional): Specifies the names of targets that must be built before this target.
* image (string, required): Specifies the URL for the docker docker container image
* entry_point (string, required): Specifies the program that will be run within the container.
* entry_point_argv (string[], optional): Specifies the command line arguments that will be sent to the entry point process.
* mount_point (string, optional): Specifies the path within the docker container where the target working directory will be mounted.
* cwd (string, optional): Specifies the host directory where the container should be run.
* env (string[], optional): Specifies the environment variables that should be defined within the docker container.
* options (object, optional): Specifies the object that can be passed when the target is created within a sub-project.


### 3.2 - Helper Functions

The cross-platform-build package also provides two helper functions that, while they do not directly generate any targets themselves, are useful for incorporating a sub-project or for dynamically selecting contents from a directory.  These functions are as follows:

#### 3.2.1 - pick_dir_targets()

This asynchronous function uses fs.readdir() to read the contents of a directory and to invoke an application defined callback method for each member of the directory.  It is up to that call-back to call any functions that would create targets associated with those files.  This function expects structured arguments with the following properties:

* pick (function<fs.DirEnt>): Specifies any asynchronous (must return a promise or be defined as async) callback that will be invoked for each entry in the process current working directory.  The directory entry will be passed as a parameter to this function.
* options (object): Specifies the task options that are passed whenever a makefile module entry point function is executed.

The following is an example that uses this function to create a make_cdecl task type for every JavaScript file in the current working directory:

```Javascript
const { pick_dir_targets, make_cdecl } = require("cross-platform-build");
module.exports = async function(options) {
   const match_js = /\.js$/;
   await PickDirTargets.pick_dir_targets({
      options,
      filter: (file) => {
         if(file.isFile() && file.name.match(match_js))
         {
            MakeCDecl.make_cdecl({
               name: `src/${file.name}.h`,
               input: file.name,
               output: `${file.name}.h`,
               variable_name: file.name.replace(".", "_"),
               options
            });
         }
      }
   });
}
```

#### 3.2.2 - subdir()

This asynchronous function temporarily changes the process current working directory to a specified sub-directory and processes the expected makefile in that subdirectory.  Any targets defined in that makefile will be added to the list of targets for the entire project so their names must reflect this by being unique.  Likely, the best approach is to prefix the target names within the sub-project with the directory name.

This function expects the following structured parameters:

* name (string - required): Specifies the name of the subdirectory to include.  This subdirectory must be a direct child to the process current working directory.

* options (object - optional): Specifies the options that should be provided to any targets created in the sub-project.  If this function is itself invoked in a sub-project, it is imperative that the options passed to that sub-project's makefile are passed to any targets created.  In addition to the book-keeping properties in the options structure, the application can supply a "makefile_name" string property that will control the name of the makefile that the function will look for in the target directory.