const MakeCDecl = require("./MakeCDecl");
const PickDirTargets = require("./PickDirTargets");
const WaitForSync = require("./WaitForSync");
const MakeCSecrets = require("./MakeCSecrets");
const { docker_build } = require("./DockerBuild");
const path = require("node:path");
const os = require("node:os");

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
   await MakeCSecrets.make_csecrets({
      name: "src/make-secrets",
      depends: [],
      output: path.join("..", "_assets", "secrets.h"),
      variable_name: "my_secrets",
      namespaces: [ "Csi", "SigningSecrets" ],
      secrets: {
         low: "low",
         medium: "medium",
         high: "high",
         top: "top"
      },
      options
   });
   await docker_build({
      name: "src/test-docker_build",
      depends: [],
      image_name: "cpb-test:v1",
      docker_file: path.join("..", "_assets", "cpb-test.dockerfile"),
      secrets: [
         { name: "npmrc", source: path.join(os.homedir(), ".npmrc") }
      ],
      options
   })
};