const Target = require("./Target");
const SvgToIco = require("svg-to-ico");
const fs = require("node:fs");

/**
 * Creates a target that uses the https://www.npmjs.com/package/svg-to-ico conversion tool to convert an SVG image to
 * a collection of PNG images embedded within a .ico format.  The conversion will be aborted if both the source and dest
 * files exist and the dest last modified time is greater than or equal to the last modified time of the dest.
 * 
 * @param {object} config
 * @param {string} config.name Specifies the name of the target to be generated
 * @param {string[] = []} config.depends Specifies the name of the targets that must be built before this target.
 * @param {string | function<string>} config.source Specifies the name of the SVG source file
 * @param {string | function<string>} config.dest Specifies the name of the output .ico file.
 * @param {number=undefined} config.sizes Specifies the list of image sizes to be included in the icon file. If the default
 * of an empty array is given, svg-to-ico will use its own default of [ 16, 32, 48, 64, 128, 256 ].
 * @param {object} config.options Must specify the options object passed to the makefile function.
 * 
 * @returns Returns the object that was created to track the target.
 */
async function svg_to_ico({
   name,
   depends = [],
   source,
   dest,
   sizes = undefined,
   options = {}
}) {
   const rtn = Target.target({
      name,
      depends,
      options,
      action: async function() {
         const effective_source = (typeof source === "function" ? source() : source);
         const effective_dest = (typeof dest === "function" ? dest() : dest);
         const source_stat = fs.statSync(effective_source, { throwIfNoEntry: false });
         const dest_stat = fs.statSync(effective_dest, { throwIfNoEntry: false });
         let proceed = true;
         if(source_stat && dest_stat)
            proceed = (source_stat.mtime > dest_stat.mtime);
         if(proceed)
         {
            await SvgToIco({
               input_name: effective_source,
               output_name: effective_dest,
               sizes
            })
         }
         return true;
      }
   });
   rtn.source = source;
   rtn.dest = dest;
   return rtn;
}


module.exports = {
   svg_to_ico
};