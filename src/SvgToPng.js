const Target = require("./Target");
const sharp = require("sharp");
const fs = require("node:fs");


/**
 * 
 * @param {object} config
 * @param {string} config.name Specifies the name of the target
 * @param {string[]=[]} config.depends Specifies the names of targets that must be built before this target.
 * @param {string} config.source Specifies the name of the source SVG file.
 * @param {string} config.dest Specifies the name of the destination PNG file.
 * @param {number} config.width Specifies the width of the bitmap in pixels.
 * @param {number} config.height Specifies the height of the bitmap in pixels.
 * @param {object={}} config.resize_options Specifies options that will be sent to the sharp resize() function along with the 
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
         const source_stat = fs.statSync(source, { throwIfNoEntry: true });
         const dest_stat = fs.statSync(dest, { throwIfNoEntry: false });
         let proceed = true;
         if(source_stat && dest_stat)
            proceed = (dest_stat.mtime < source_stat.mtime);
         if(proceed)
         {
            const sharp_options = {
               fit: "contain",
               background: {r:0, g:0, b:0, alpha:0},  // white - transparent
               ...resize_options
            };
            const buffer = await sharp(source).resize(width, height, sharp_options).png({
               compressionLevel: 0
            }).toBuffer();
            await fs.promises.writeFile(dest, buffer);
         }
         return true;
      }
   });
   return rtn;
}


module.exports = {
   svg_to_png
}