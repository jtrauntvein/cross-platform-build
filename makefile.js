const tools = require("./src/index");
const SvgToIco = require("./src/SvgToIco");
const SvgToPng = require("./src/SvgToPng");
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
   await tools.rm({
      name: "rm-temp",
      path: rsync_dest,
      ignore_error: true,
      options
   });
   await tools.write_c_header({
      name: "write-c-header",
      file_name: path.join(os.homedir(), "temp", "generated-header.h"),
      data: {
         macro1: "This should be the first macro encoded as a string",
         macro2: 3.14159,
      },
      options
   });
   await tools.touch({
      name: "touch-logview.svg",
      depends: [],
      source: "logview.svg",
      options
   })
};