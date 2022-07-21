const Target = require("./Target");
const child_process = require("node:child_process");
const process = require("node:process");


async function do_pdf_latex(document, defines, quiet, once, options) {
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

   argv.push(`\\input{${document}}`);
   while(!complete)
   {
      if(logger)
         logger.info(`executing pass ${run_count + 1}`);
      iterate_results = await iterate();   
      complete = (iterate_results.error_count > 0 ||  once || iterate_results.rerun_count === 0);
   }
   return (iterate_results.error_count === 0);
}


async function pdf_latex({
   name,
   depends = [],
   options = {},
   document,
   defines = [],
   once = false,
   quiet = false
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         await do_pdf_latex(document, defines, quiet, once, options);
      }
   });
   return rtn;
}


module.exports = {
   pdf_latex
}