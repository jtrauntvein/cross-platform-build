const Target = require("./Target");
const fs = require("node:fs");


/**
 * Implements the code for checking dependencies and generating the output.
 */
async function do_mkcdecl() {
   return new Promise((accept, reject) => { 
      const input_stat = fs.statSync(this.input, { throwIfNoEntry: false });
      if(input_stat.isFile())
      {
         let do_convert = true;
         if(fs.existsSync(this.output))
         {
            const output_stat = fs.statSync(this.output, { throwIfNoEntry: false });
            if(output_stat.mtimeMs >= input_stat.mtimeMs)
               do_convert = false;
         }
         if(do_convert)
         {
            fs.readFile(this.input, (error, data) => {
               if(!error)
               {
                  // We will start by formatting the output as a collection of hex numbers in groups of up to 16 numbers.
                  const hex_output = data.toString("hex");
                  const lines = [];
                  let line = [];
                  for(let i = 0; i < hex_output.length; i += 2)
                  {
                     line.push(`0x${hex_output.slice(i, i + 2)}`);
                     if(line.length >= 16)
                     {
                        lines.push(`${line.join(", ")}${i + 2 < hex_output.length ? "," : ""}`);
                        line = [];
                     }
                  }
                  if(line.length > 0)
                     lines.push(line.join(", "));

                  // We can now generate the output.  We'll start by generating the declarations of each namespace.
                  const output = [];
                  let line_pad = "";
                  this.namespaces.forEach((namespace) => {
                     output.push(`${line_pad}namespace ${namespace} \r\n${line_pad}{\r\n`);
                     line_pad = line_pad + "   ";
                  });
                  output.push(`${line_pad}const unsigned char ${this.variable_name}[] = {\r\n`)
                  lines.forEach((line) => {
                     output.push(`${line_pad}   ${line}\r\n`);
                  });
                  output.push(`${line_pad}};\r\n`);
                  output.push(`${line_pad}char const ${this.variable_name}_date[] = ${JSON.stringify(input_stat.mtime)};\r\n`);

                  // finally, we can append the lines needed to close the namespace brackets
                  this.namespaces.forEach(() => {
                     line_pad = line_pad.substring(3, line_pad.length);
                     output.push(`${line_pad}};\r\n`);
                  });
                  output.push("\r\n");

                  // we can now format the output lines to the output file.
                  fs.writeFile(this.output, output.join(""), (error) => {
                     if(error)
                        reject(Error(`write file failed: ${error}`));
                     else
                        accept();
                  });
               }
               else
                  reject(Error(`failed to read input: ${error}`));
            });
         }
      }
      else
         reject(Error(`input file ${this.input} does not exist or is not a file`));
   });
}


/**
 * Defines a task type that will convert the contents of any file into a "C++" array declaration of an array of
 * unsigned characters.
 * 
 * @return {object} Returns the object created for doing the process.
 * @param {string} options.name Specifies the name of this target
 * @param {string[] = []} options.depends Specifies the collection of dependency names
 * @param {string} options.input Specifies the input file name.
 * @param {string} options.output Specifies the output file name.
 * @param {string} options.variable_name Specifies the name of the variable to declared.
 * @param {string} options.namespaces Specifies the namespace names in which the variable will be declared.
 */
function make_cdecl({
   name,
   depends = [],
   input,
   output,
   variable_name,
   namespaces = []
}) {
   const rtn = Target.target({
      name,
      depends,
      action: do_mkcdecl
   });
   rtn.input = input;
   rtn.output = output;
   rtn.variable_name = variable_name;
   rtn.namespaces = namespaces;
   return rtn;
}


module.exports = {
   make_cdecl
};