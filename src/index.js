const Target = require("./Target");
const Execute = require("./Execute");
const MakeCDecl = require("./MakeCDecl");
const Subdir = require("./Subdir");


module.exports = {
   Target,
   execute: Execute.execute,
   make_cdecl: MakeCDecl.make_cdecl,
   subdir: Subdir.subdir
};

