const Target = require("./Target");
const Execute = require("./Execute");
const MakeCDecl = require("./MakeCDecl");
const Subdir = require("./Subdir");
const PickDirTargets = require("./PickDirTargets");
const MsBuild = require("./MsBuild");
const HttpRequest = require("./HttpRequest");
const DockerContainer = require("./DockerContainer");
const CopyFile = require("./CopyFile");
const MkDir = require("./MkDir");
const RSync = require("./RSync");
const PdfLatex = require("./PdfLatex");
const Logger = require("./Logger");


module.exports = {
   Target,
   Logger,
   target: Target.target,
   execute: Execute.execute,
   make_cdecl: MakeCDecl.make_cdecl,
   subdir: Subdir.subdir,
   pick_dir_targets: PickDirTargets.pick_dir_targets,
   http_request: HttpRequest.http_request,
   msbuild: MsBuild.msbuild,
   docker_container: DockerContainer.docker_container,
   pull_docker_container: DockerContainer.pull_docker_container,
   rsync: RSync.rsync,
   copy_file: CopyFile.copy_file,
   mk_dir: MkDir.mk_dir,
   make_dir: MkDir.mk_dir,
   pdf_latex: PdfLatex.pdf_latex
};

