const tools = require("./src/index");
const os = require("node:os");
const path = require("node:path");


module.exports = async function(options) {
   const rsync_dest = path.join(os.homedir(), "temp", "src");
   await tools.subdir({ name: "src", options });   
   await tools.rsync({
      name: "copy-to-temp",
      source: "src",
      dest: path.join(os.homedir(), "temp", "src"),
      delete_orphaned: true,
      filter: (file_name) => { return !file_name.endsWith(".h") },
      options
   });
   await tools.rm({
      name: "rm-temp",
      depends: [ "copy-to-temp" ],
      path: rsync_dest,
      ignore_error: false,
      options
   });
};