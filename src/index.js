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
const Rm = require("./rm");
const Logger = require("./Logger");
const SvgToIco = require("./SvgToIco");
const SvgToPng = require("./SvgToPng");
const WaitForSync = require("./WaitForSync");
const Rename = require("./Rename");
const WriteFile = require("./WriteFile");
const GitlabTriggerPipeline = require("./GitlabTriggerPipeline");
const Touch = require("./Touch");
const MakeCSecrets = require("./MakeCSecrets");
const CMake = require("./CMake.js");
const DockerBuild = require("./DockerBuild.js");

module.exports = {
   Target,
   Logger,
   target: Target.target,
   execute: Execute.execute,
   make_cdecl: MakeCDecl.make_cdecl,
   subdir: Subdir.subdir,
   pick_dir_targets: PickDirTargets.pick_dir_targets,
   http_request: HttpRequest.http_request,
   gitlab_trigger_pipeline: GitlabTriggerPipeline.gitlab_trigger_pipeline,
   msbuild: MsBuild.msbuild,
   docker_container: DockerContainer.docker_container,
   pull_docker_container: DockerContainer.pull_docker_container,
   rsync: RSync.rsync,
   copy_file: CopyFile.copy_file,
   mk_dir: MkDir.mk_dir,
   make_dir: MkDir.mk_dir,
   pdf_latex: PdfLatex.pdf_latex,
   svg_to_ico: SvgToIco.svg_to_ico,
   svg_to_png: SvgToPng.svg_to_png,
   rm: Rm.rm,
   wait_for_sync: WaitForSync.wait_for_sync,
   rename: Rename.rename,
   write_file: WriteFile.write_file,
   write_c_header: WriteFile.write_c_header,
   touch: Touch.touch,
   make_csecrets: MakeCSecrets.make_csecrets,
   cmake_configure: CMake.cmake_configure,
   docker_build: DockerBuild.docker_build 
};

