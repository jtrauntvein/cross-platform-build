const Subdir = require("./src/Subdir");
const RSync = require("./src/RSync");
const os = require("node:os");
const path = require("node:path");


module.exports = async function(options) {
   await Subdir.subdir({ name: "src", options });   
   await RSync.rsync({
      name: "copy-to-temp",
      source: "src",
      dest: path.join(os.homedir(), "temp", "src"),
      delete_orphaned: true,
      filter: (file_name) => { return !file_name.endsWith(".h") },
      options
   })
};