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
* env (object, optional): Specifies a collection of environment variables that can be defined for the child process.
* shell (boolean, optional): Set to true if the child process should be run within a shell.
* ignore_exit_code (boolean, optional): Set to true if the exit code for the child process should be ignored.
* check_inputs (object, optional): Optionally specifies properties "sources" and "outputs" which should both be an array of strings.
  the "sources" property identifies the list of file names (with paths relative to the target working dir) that are operated upon
  and the "outputs" property also identifies a list of file names (with paths relative to the target working dir) that are expected
  to be output by the process.  If any of the expected inputs are missing or have last changed time stamps that are newer than 
  any of the outputs, then the target program will be run.  If not, the target program will not be run.  If this parameter is not specified,
  the target program will be run unconditionally.
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


#### 3.1.8 mk_dir()

The mk_dir() function generates a target that will ensure the existence of a directory for a given path and will create any parent directories for that path as necessary.  The options for this function are as follows:

* name (string, required): Specifies the name of the target to be created.
* depends (string[], optional): Specifies the names of targets that must be built before this target is built.
* path (string, required): Specifies the path for the directory to be created if needed.  If the directory already exists, the target will still be considered a success.
* options (object, optional): Specifies the object that can be passed when the target is created within a sub-project.

The return value from this function will be the object that was created to track the status of the target.


#### 3.1.9 copy_file()

The copy_file() function generates a target that will copy one or more files to a given directory and will also clone the created time and last modified time for the copied files.  The parameters for this function are as follows:

* name (string, required): Specifies the name for the generated target.
* depends (string[], optional): Specifies the names of targets that must be built before this target is built.
* source (string or string[], required): Specifies the path to the source file to be copied or, if specified as an array, will specify the paths of the source files to be copied.
* dest (string, required): Specifies the directory to which the source files will be copied.
* rename (string, optional): Optionally specifies the name to be assigned to the file in the dest directory.  This parameter will be ignored if there are kore than one files to be copied.  If not specified, the destination file will be given the same name as the source file.
* options (object, optional): Specifies the object that can be passed when the target is created within a sub-project.

The return value from this function will be the object that was created to track the target.


#### 3.1.10 rsync()

The rsync() function will generate a target that will use the rsyncjs node module to mirror the contents of a destination directory with the contents of a source directory.  The parameters for this function are as follows:

* name (string, required): Specifies the name of the target.
* depends (string[], optional): Specifies the names of targets that must be built before this target is built.
* source (string, required): Specifies the path of the source directory to be mirrored to the destination directory.
* dest (string, required): Specifies the path of the destination directory that will be modified to mirror the source directory.
* delete_orphaned (boolean, optional): Set to true (the default) if any contents of the destination directory exist that are not in the source directory should be deleted from the destination directory.
* filter (function(string): boolean, optional): Optionally specifies a function that will be called with the path of every file or directory in the source path.  If defined, this function must return true if the file or subdirectory is to be included or false if the file or subdirectory should be excluded.  If the function is not defined, all files and subdirectories will be included in the synch operation.
* filter_orphan (function(string): boolean, optional): Optionally specifies a function that will be called with the path to any objects in the dest directory that are not in the source directory.  If not specified or the function returns true, these orphaned objects will be removed from the dest directory when the delete_orphans parameter is set to true.
* options (object, optional): Specifies the object that can be passed when the target is created within a sub-project.

The return value from this function will be the object used to track the target.

#### 3.1.11 pdf_latex()

The pdf_latex() function will generate a target that will invoke pdflatex command (provided by TexLive or MikTex depending upon the host OS) repeatedly, if needed,
to generate a PDF output document and to resolve any reference or layout issues that requires the TeX command to be run again.  The parameters for this function are as follows:

* name (string, required): Specifies the name of the target
* depends (string[], optional): Specifies the names of targets that must be built before this target will be built.
* document (string, required): Specifies the name of the LaTex source document.  In the case that the project consists of multiple source documents that are all included in the same source, the name of the single source must be the one specified.
* defines (object[], optional):  Optionally specifies a collection of macros that should be defined for the LaTeX compiler.  Each object in this array must contain a "name" string property that defines the name of the macro and must also contain a "body" string property that defines the body of that macro.  If this parameter is specified, any macros will be generated in the command line for pdflatex.
* check_output (object, optional): Optiionally specifies an object that has an "inputs" property of type string[] and an "outputs" property of type string.  If this parameter is specified, the target function will first check to see if any of the specified inputs have a newer modified time than any of the specified outputs and will prevent the execution if these time stamps indicate that the target is up to date.
* options (object, optional): Should specify the options structure that is passed as a parameter into the makefile.js module function.

The return value for this function will be the object that was created to track the target.

#### 3.1.12 - svg_to_ico()

The svg_to_ico() function creates a target that will convert if needed an SVG file into an ICON format file.  This conversion will only take place if the dest file does not exist or is older than the source file.  The parameters for this function are as follows:

* name (string, required): Specifies the name for this target.
* depends (string[], optional): Specifies the names of the targets that must be built before this target is built.
* source (string, required): Specifies the path to the source SVG format file.
* dest (string, required): Specifies the path to the destination PNG file.
* sizes (number[], optional): Specifies the sizes for the bitmap files to be included within the icon format.  If not specified, the function will default to [ 16, 32, 48, 64, 128, 256 ]
* options (object, required): Must specify the value of the options argument to the makefile.js function.

The return value will be the object created to track the target.


#### 3.1.13 - svg_to_png()

The svg_to_png() function creates a target that will convert if needed an SVG file to a PNG file with the given number of pixels.  It uses the sharp node module to do this work.  The parameters to this function are as follows:

* name (string, required): Specifies the name of the target to be created.
* depends (string[], optional): Specifies the names of the targets that should be built before this target.
* source (string, required): Specifies the path to the SVG source file.
* dest (string, required): Specifies the path of the output .ico file.
* width (number, required): Specifies the maximum width of the output file in pixels.
* height (number, required): Specifies the maximum height of the output file in pixels.
* resize_options (object, optional): Specifies other options that should be passed to the sharp resize() function.
* options (object, required): Should specify the options parameter passed to the makefile.js function that called this function.

The return value will be the object that was allocated to track the target.

#### 3.1.14 rm()

The rm() function will generate a target that will delete a specified file or directory from a given path.  The parameters for this function are as follows:

* name (string, required): Specifies the name for the target.
* depends (string[], optional): Specifies the collection of targets that must be built before this target is built.
* path (string, required): Specifies the path to the file or directory that should be removed.
* ignore_error (boolean, optional): Set to true if a failure to delete should be ignored.  If not specified, this value will default to true.
* options (object, optional): Should specify the options structure passed as a parameter to the makefile.js entry point.

The return value for this function will be the object that is created to track the target.

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

#### 3.2.3 - Logger()

This function is the constructor for a Logger object that is used to help manage logs outputs from the build engine.  Objects built using this constructor
can be specified as the "logger" property of the options parameter for all targets.  This function accepts the following structured parameters:

* output (function(string), optional): Specifies how the log messages will be written.  If not specified, all messages will be written to the process.stdout handle.
* log_level (string | number, optional): Specifies the maximum level of message that will be written to the log.  This can be one of the properties of the Logger.all_log_levels static property or it can be a string that names one of those properties.

