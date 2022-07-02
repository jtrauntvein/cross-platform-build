const Target = require("./Target");
const Execute = require("./Execute");
const MakeCDecl = require("./MakeCDecl");
const Subdir = require("./Subdir");
const PickDirTargets = require("./PickDirTargets");
const MsBuild = require("./MsBuild");
const HttpRequest = require("./HttpRequest");


module.exports = {
   Target,
   target: Target.target,
   execute: Execute.execute,
   make_cdecl: MakeCDecl.make_cdecl,
   subdir: Subdir.subdir,
   pick_dir_targets: PickDirTargets.pick_dir_targets,
   http_request: HttpRequest.http_request,
   msbuild: MsBuild.msbuild
};

