# cross-platform-build

High level build platform that can be used to generate build targets with dependencies.  The build tool,
when invoked, will look for a file, makefile.js, that should export a single async function that will make calls to various platform functions that will generate targets.

## Installing cross-platform-build

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

## Running cross-platform-build

The cli has the following syntax:

```
command-line := "cross-platform-build" [ ("-f" | "--file") makefile-name ] { target-name }.
makefile-name := string. ; javascript file name
target-name := string.   ; name of a target defined in the makefile.
```

If the -f or --file option is not specified, the builder will look for a "makefile.js" file in the current working directory.  This file needs to be a common JS module that exports a single asynchronous function.  The builder will load the module and execute the exported function.  Following that, the builder will execute the build targets that are specified and will ensure that any dependencies of those targets are built first.  If no target names are specified on the command line, the builder will build all targets that were created in the makefile.

## Creating a Makefile

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

### Target Types

The cross-platform-build package defines functions that can be called by the makefile and that are responsible for generating the build targets for the project.  These types are as follows:

* target(): Generates a target that will execute a project defined JavaScript callback in order to "build" the target.
* execute(): Generates a target that will execute a child process with provided arguments in order to build the target.
* make_cdecl(): Generates a target that will transform the content of any file into a C declaration for an unsigned char array that is initialised with the input file content and writes this declaration to an output file.  This represents an easy way to compile program resources directly into a C or C++ program which can then be accessed using a simple pointer reference.
* msbuild(): Generates a target that will invoke the Microsoft Visual Studio build tool, msbuild, with a specified configuration and optional architecture.

### Helper Functions

The cross-platform-build package also provides two helper functions that, while they do not directly generate any targets themselves, are useful for incorporating a sub-project or for dynamically selecting contents from a directory.  These functions are as follows:

#### pick_dir_targets()

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

#### subdir()

This asynchronous function temporarily changes the process current working directory to a specified sub-directory and processes the expected makefile in that subdirectory.  Any targets defined in that makefile will be added to the list of targets for the entire project so their names must reflect this by being unique.  Likely, the best approach is to prefix the target names within the sub-project with the directory name.

This function expects the following structured parameters:

* name (string - required): Specifies the name of the subdirectory to include.  This subdirectory must be a direct child to the process current working directory.

* options (object - optional): Specifies the options that should be provided to any targets created in the sub-project.  If this function is itself invoked in a sub-project, it is imperative that the options passed to that sub-project's makefile are passed to any targets created.  In addition to the book-keeping properties in the options structure, the application can supply a "makefile_name" string property that will control the name of the makefile that the function will look for in the target directory.