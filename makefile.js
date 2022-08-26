const Subdir = require("./src/Subdir");
const RSync = require("./src/RSync");
const SvgToIco = require("./src/SvgToIco");
const SvgToPng = require("./src/SvgToPng");
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
   });
   await SvgToIco.svg_to_ico({
      name: "svg-to-ico",
      depends: [ "copy-to-temp" ],
      source: "logview.svg",
      dest: path.join(os.homedir(), "temp", "logview.ico"),
      options
   });
   await SvgToPng.svg_to_png({
      name: "logview128.png",
      depends: [ "copy-to-temp" ],
      source: "logview.svg",
      dest: path.join(os.homedir(), "temp", "logview128.png"),
      width: 128,
      height: 128,
      options
   });
};