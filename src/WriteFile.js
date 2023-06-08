const Target = require("./Target");
const fs = require("fs");
const { createHash } = require("crypto");
const path = require("path");

/**
 * @typedef WriteFileOptions
 * @property {string} name Specifies the name of the target
 * @property {string[]?} depends Specifies the set of target names that must be built before
 * this target
 * @property {string} file_name Specifies the name of the file to be written.
 * @property {string} contents Specifies the contents to be written to the file.
 * @property {object} options Must specify the options argument passed to the makefile.
 */
/**
 * @description Generates a target that will write the given contents to a file.
 * The file will only be written if the contents differ from it.
 * 
 * @param {WriteFileOptions} param Specifies the arguments for this target. 
 * @return {Target} Returns the target object created to track this request.
 */
async function write_file({
   name,
   depends = [],
   file_name,
   contents,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         let should_write = true;
         const file_stat = fs.statSync(file_name, { throwIfNoEntry: false });
         if(file_stat)
         {
            // we will calculate the checksum of the existing file.
            const existing_contents = await fs.promises.readFile(file_name);
            const existing_hash = createHash("sha256");
            existing_hash.update(existing_contents);

            // we also need to calculate the checksum of the specified content.
            const contents_hash = createHash("sha256");
            contents_hash.update(contents);

            // we can now compare the two digests.
            const existing_digest = existing_hash.digest("base64");
            const contents_digest = contents_hash.digest("base64");
            should_write = (existing_digest !== contents_digest);
         }
         if(should_write)
            await fs.promises.writeFile(file_name, contents);
         return true;
      }
   });
   return rtn;
}


/**
 * @typedef WriteCHeaderOptions
 * @property {string} name Specifies the name of the target to be created.
 * @property {string[]?} depends Specifies the names of other targets that must be built before this target can be built.
 * @property {string} file_name Specifies the name of the file to write.
 * @property {object} data Specifies the collection of name/value pairs that will be rendered as c #defines
 * @property {function<string, any>?} render Specifies a callback function that will be invoked for one key/value pair and its 
 * return value will define the contents rendered for the macro.  If not defined, the JSON.stringify() function will be used.
 * @property {object} options Must specify the options object passed to the makefile.
 */
/**
 * @description Generates a target that will encode a collection of name/value pairs as C #define macros into a header file.
 * @param {WriteCHeaderOptions} params Specifies the arguments for the target.
 * @return {object} Returns the object created to track the created target. 
 */
async function write_c_header({
   name,
   depends = [],
   file_name,
   data,
   render = (key, value) => JSON.stringify(value),
   options
}) {
   const keys = Object.keys(data);
   const defines = keys.map((key) => {
      const value = data[key];
      const rendered = render(key, value);
      const rtn = `#define ${key} ${rendered}`;
      return rtn;
   });
   const guard_name = path.basename(file_name).replace(".", "_").replace("-", "_");
   const header_content = `/** ${file_name} 
 */
#ifndef ${guard_name}
#define ${guard_name}

${defines.join("\n")}

#endif
`;
   const rtn = await write_file({
      name,
      depends,
      file_name,
      contents: header_content,
      options
   });
   return rtn;
}

module.exports = {
   write_file,
   write_c_header
};
