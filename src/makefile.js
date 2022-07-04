const MakeCDecl = require("./MakeCDecl");
const PickDirTargets = require("./PickDirTargets");

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
};