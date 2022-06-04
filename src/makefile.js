const MakeCDecl = require("./MakeCDecl");

module.exports = function(options) {
   MakeCDecl.make_cdecl({
      name: "src/index.js.h",
      input: "index.js",
      output: "index.js.h",
      variable_name: "index_js",
      options
   });
   MakeCDecl.make_cdecl({
      name: "src/MakeCDecl.js.h",
      input: "MakeCDecl.js",
      output: "MakeCDecl.js.h",
      variable_name: "mkcdecl_js",
      depends: [ "src/index.js.h" ],
      options
   });
};