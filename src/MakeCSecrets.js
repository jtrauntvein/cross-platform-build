const target = require("./Target.js");
const fs = require("node:fs");
const crypto = require("node:crypto");

function format_namespaces(namespaces) {
   const rtn = {
      declare_prefix: [],
      declare_postfix: [],
      pad: ""
   };
   namespaces.forEach((namespace) => {
      const pad = rtn.pad;
      rtn.pad += "   ";
      rtn.declare_prefix.push(`${pad}namespace ${namespace} {`);
      rtn.declare_postfix.push(`${pad}};`);
   });
   rtn.declare_postfix.reverse();
   return rtn;
}

function make_key(length) {
   return crypto.randomBytes(length);
}

function format_binary(key, as_string) {
   const rtn = [];
   if(as_string) {
      rtn.push("\"");
      for(let i = 0; i < key.length; ++i) {
         if(key[i] <= 0x0f)
            rtn.push("\\x0");
         else
            rtn.push("\\x");
         rtn.push(key[i].toString(16));
      }     
      rtn.push("\"");
   }
   else {
      rtn.push("{ ");
      for(let i = 0; i < key.length; ++i) {
         if(i > 0)
            rtn.push(", ");
         rtn.push(`0x${key[i].toString(16)}`);
      }
      rtn.push(" }");
      
   }
   return rtn.join("");
}

/**
 * @typedef EncryptRtnType Specifies the structure of data that should be returned by the encrypt() function
 * @property {Buffer} encrypted specifies the encrypted buffer
 * @property {Buffer} iv specifies the initialisation vector
 */
/**
 * Implements the encryption algorithm 
 * @param {string} name specifies the name of the secret to encrypt
 * @param {Buffer} key specifies the key to be used for encryption
 * @param {string} secret specifies the secret to encrypt
 * @return {EncryptRtnType} returns the encrypted secret in a Buffer.
 */
function encrypt(name, key, secret) {
   const iv = crypto.randomBytes(16);
   const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
   const encrypted = Buffer.concat([ cipher.update(secret), cipher.final() ]);
   return {
      encrypted: encrypted,
      iv: iv
   };
}

/**
 * @typedef MakeCSecretsArgs 
 * @property {string} name specifies the name of the target
 * @property {string[]} depends specifies the collection of targets on which this target will
 * depend.
 * @property {string} output specifies the name of the C source file generated
 * @property {string} variable_name specifies the name of the secrets structure that will be generated
 * and, indirectly, the type names for the structure types
 * @property {string[]} namespaces optionally specifies the collection of namespaces in which the 
 * c++ code will be generated
 * @property {function<bool>} should_write optionally specifies a function that will be called when the target
 * executes that will determine whether the file should be generated.
 * @property {object} secrets specifies the secrets to encode
 * @property {object} options specifies the options structure passed to the makefile entry point
 */
/**
 * Defines a task type that will generate the c declarations for a secrets structure from the provided
 * map of secrets and an encryption function.  
 * 
 * @return {object} returns the object created to generate the output
 * @param {MakeCSecretsArgs} args specifies the argument for this target
 * 
 */
async function make_csecrets({
   name,
   depends = [],
   output,
   variable_name,
   secrets,
   namespaces = [],
   should_write = async () => true,
   options
}) {
   const rtn = await target.target({
      name,
      depends,
      options,
      action: async () => {
         // if should_write returns false, we can abort the target immediately
         if(!await should_write())
            return true;

         // we will store the lines to be output as an array of strings that will be concatenated with line endings
         // ("\r\n") before being output to the file
         const key = make_key(32);
         const namespace = format_namespaces(namespaces);
         const secret_keys = Object.keys(secrets);
         const formatted_secrets = secret_keys.map((name) => {
            const encrypted = encrypt(name, key, secrets[name]);
            const rtn = [
               `${namespace.pad}     { `,
               `${namespace.pad}        "${name}", ${secrets[name].length},`,
               `${namespace.pad}        ${format_binary(encrypted.encrypted, true)},`,
               `${namespace.pad}        ${format_binary(encrypted.iv, true)}`,
               `${namespace.pad}     },`
            ];
            return rtn.join("\r\n");
         });
         const file_contents = [
            ...namespace.declare_prefix,
            `${namespace.pad}struct ${variable_name}_entry_type {`,
            `${namespace.pad}   char const *name;`,
            `${namespace.pad}   size_t const length;`,
            `${namespace.pad}   unsigned const char *secret;`,
            `${namespace.pad}   unsigned const char *iv;`,
            `${namespace.pad}};`,
            `${namespace.pad}struct ${variable_name}_type {`,
            `${namespace.pad}   unsigned char const key[${key.length}];`,
            `${namespace.pad}   ${variable_name}_entry_type const entries[${secret_keys.length}];`,
            `${namespace.pad}} const ${variable_name} = {`,
            `${namespace.pad}   ${format_binary(key, false)},`,
            `${namespace.pad}   {`,
            ...formatted_secrets,
            `${namespace.pad}   }`,
            `${namespace.pad}};`,
            ...namespace.declare_postfix
         ];

         // we can noow attempt to write the formatted contents to the output file.
         await fs.promises.writeFile(output, file_contents.join("\r\n"));
         return true;
      }
   });
   return rtn;
}

module.exports = {
   make_csecrets
};
