const Target = require("./Target");
const fs = require("node:fs");
const { Resvg } = require("@resvg/resvg-js");

/**
 * 
 * @param {object} config
 * @param {string} config.name Specifies the name of the target
 * @param {string[]=[]} config.depends Specifies the names of targets that must be built before this target.
 * @param {string | function<string>} config.source Specifies the name of the source SVG file.
 * @param {string | function<string>} config.dest Specifies the name of the destination PNG file.
 * @param {number | function<number>} config.width Specifies the width of the bitmap in pixels.
 * @param {number | function<number>} config.height Specifies the height of the bitmap in pixels.
 * @param {object={} | function<object>} config.resize_options Specifies options that will be sent to the sharp resize() function along with the 
 * width and height.  By default, the options used will cause the image to be "contained" in the frame and to have a 
 * white, transparent background.
 * @param {object} config.options Specifies the options that should be passed into the makefile.js function when this target
 * is built.
 *  
 * @returns Returns the object that was allocated to track this target.
 */
async function svg_to_png({
   name,
   depends = [],
   source,
   dest,
   width,
   height,
   resize_options = {},
   options
}) {
   const rtn = Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_source = (typeof source === "function" ? source() : source);
         const effective_dest = (typeof dest === "function" ? dest() : dest);
         const effective_width = (typeof width === "function" ? width() : width);
         const effective_height = (typeof height === "function" ? height() : height);
         const effective_resize_options = (typeof resize_options === "function" ? resize_options() : resize_options);
         const source_stat = fs.statSync(effective_source, { throwIfNoEntry: true });
         const dest_stat = fs.statSync(effective_dest, { throwIfNoEntry: false });
         let proceed = true;
         if(source_stat && dest_stat)
            proceed = (dest_stat.mtime < source_stat.mtime);
         if(proceed) {
            const resvg_options = {
               fitTo: {
                  mode: (effective_width > effective_height ? "height" : "width"),
                  value: (effective_width > effective_height ? effective_width : effective_height)
               },
               ...resize_options
            };
            const input = await fs.promises.readFile(effective_source);
            const resvg = new Resvg(input, resvg_options);
            const rendered = resvg.render();
            const png = rendered.asPng();
            await fs.promises.writeFile(effective_dest, png);
         }
         return true;
      }
   });
   rtn.source = source;
   rtn.dest = dest;
   rtn.width = width;
   rtn.height = height;
   rtn.resize_options = resize_options;
   return rtn;
}


module.exports = {
   svg_to_png
}