const MakeCDecl = require("./MakeCDecl");
const PickDirTargets = require("./PickDirTargets");
const WaitForSync = require("./WaitForSync");

module.exports = async function(options) {
   const match_js = /\.js$/;
   await PickDirTargets.pick_dir_targets({
      options,
      filter: async (file) => {
         if(file.isFile() && file.name.match(match_js))
         {
            await MakeCDecl.make_cdecl({
               name: `src/${file.name}.h`,
               input: file.name,
               output: `${file.name}.h`,
               variable_name: file.name.replace(".", "_"),
               options
            });
         }
      }
   });
   await WaitForSync.wait_for_sync({
      name: "src/wait-sync-test",
      depends: [ "src/WaitForSync.js.h" ],
      reference: "WaitForSync.js",
      target: "WaitForSync.js.h",
      delay_after: 10,
      options
   });
};