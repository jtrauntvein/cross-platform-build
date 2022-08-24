const Target = require("./Target");
const child_process = require("node:child_process");
const process = require("node:process");
const fs = require("node:fs");

async function do_pdf_latex(document, defines, quiet, once, options, check_output) {
   const command = "pdflatex";
   const argv = defines.map((define) => {
      return `\\def\\${define.name}{${define.body}}`;
   });
   const logger = options.logger;
   let run_count = 0;
   let complete = false;
   const iterate = async function() {
      return new Promise((accept, reject) => {
         const rtn = {
            error_count: 0,
            rerun_count: 0
         };
         const runner = child_process.spawn(command, argv, { stdio: "pipe" });
         runner.on("close", () => {
            accept(rtn);
         });
         runner.on("error", () => {
            rtn.error_count += 1;
            reject(Error("Failed to start pdflatex"));
         })
         runner.stdout.on("data", (data) => {
            const data_str = data.toString();
            const rerun_pos = data_str.indexOf("Rerun");
            const error_pos = data_str.indexOf("Error");
            if(rerun_pos >= 0)
               rtn.rerun_count += 1;
            if(error_pos >= 0)
               rtn.error_count += 1;
            if(!quiet)
               process.stdout.write(data);
         });
      });
   };
   let iterate_results;
   let output_checks = true;

   if(typeof check_output === "object")
   {
      // we are looking for the case where any of the inputs have a last modified date that is newer than any of the outputs.
      const outputs = check_output.outputs.map((output_name) => fs.statSync(output_name, { throwIfNoEntry: false })).filter((stat) => stat !== undefined);
      const inputs = check_output.inputs.map((input_name) => fs.statSync(input_name, { throwIfNoEntry: false })).filter((stat) => stat !== undefined);
      if(outputs.length > 0 && inputs.length > 0)
      {
         const newer_input = inputs.find((input_stat) => {
            const older_output = outputs.find((output_stat) => {
               return output_stat.mtime < input_stat.mtime;
            });
            return older_output !== undefined;
         });
         output_checks = newer_input !== undefined;
      }
   }
   argv.push(`\\input{${document}}`);
   while(output_checks && !complete)
   {
      if(logger)
         logger.info(`executing pass ${run_count + 1}`);
      iterate_results = await iterate();   
      complete = (iterate_results.error_count > 0 ||  once || iterate_results.rerun_count === 0);
   }
   return (output_checks || iterate_results.error_count === 0);
}


/**
 * @typedef PdfDefineType
 * @property {string} name Specifies the name for the TeX macro that will be defined
 * @property {string} body Specifies the content of the body of the TeX macro that will be defined.
 */
/**
 * @typedef PdfCheckOutputType
 * @property {string[]} inputs Specifies the collection of input files that are expected to influence the compiler output.
 * @property {string[]} outputs Specifies the collection of files that are expected to be generated.
 */
/**
 * Specifies a function that creates a target that will generate a PDF document from LaTeX source provided 
 * MikTex (for windows) or TEX-Live is installed for most other plartforms.  
 * @param {object} args
 * @param {string} args.name Specifies the name of the target to be generated.
 * @param {string[]?} args.depends Specifies the names of other targets that must be built before this target 
 * can be built.
 * @param {string} args.document Specifies the path to the LaTeX source file from which the output will be generated.
 * @param {PdfDefineType[]?} args.defines Optionally specifies an array of TeX macro definitions that will be passed into the TeX compiler.
 * @param {boolean=false} args.once Set to true if the compiler should only be run once.  if set to false (default), the compiler will be invoked repeatedly 
 * until the output from the compiler no longer indicates that the layout has changed.
 * @param {boolean=false} args.quiet Set to true if the console output of the compiler should be surpressed.
 * @param {PdfCheckOutputType[]?} check_output Optionally specifies an array of objects that has an "inputs" property that lists the names of all files that can influence
 * the output as well as an "outputs" property that lists the names of all expected outputs.  If this parameter is specified, the compiler will not be specified if all
 * of the expected outputs have last modified times newer than the last modified times of any of the inputs.
 * @returns {object} Returns the object created to track this target and its parameters.
 */
async function pdf_latex({
   name,
   depends = [],
   options = {},
   document,
   defines = [],
   once = false,
   quiet = false,
   check_output = undefined
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         await do_pdf_latex(document, defines, quiet, once, options, check_output);
      }
   });
   return rtn;
}


module.exports = {
   pdf_latex
}