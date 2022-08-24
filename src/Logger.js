const process = require("node:process");
const log_levels = {
   ERROR: 5,
   INFO: 10,
   DEBUG: 15,
   ANY: -1
};

function do_output(buff) {
   process.stdout.write(buff);
}

/**
 * @constructor 
 * @param {object} options
 * @param {function<string | buffer>?} options.output Specifies the function that will generate the log output.  Defaults to writing to the process stdout device.
 * @param {("INFO"|"DEBUG"|"ERROR"|"ANY")|number}  options.log_level Specifies the maximum log level of message that should be output to the log through this object.
 */
function Logger({
   output = do_output,
   log_level = log_levels.INFO
}) {
   this.output = output;
   if(typeof log_level === "string")
   {
      // we need to sanitise the input
      const keys = Object.keys(log_levels);
      const log_level_key = keys.find((key) => log_level.toUpperCase() === key);
      if(log_level_key === undefined)
         this.log_level = log_levels.ANY;
      else
         this.log_level = log_levels[log_level_key];
   }
   else if(typeof log_level === "number")
      this.log_level = log_level;
   else
      throw Error(`unsupported log level specified: ${log_level}`);
}
Logger.all_log_levels = log_levels;

/**
 * Writes the given message to the output only if the given level is less than or equal to the initialised log level
 * @param {(object|array|string|any)} message Specifies the content to log.  If this is not already a string, the function will attempt to
 * convert it to a string prior to writing it.  A line feed will be added after the content if the message is written.
 * @param {*} message_level 
 */
Logger.prototype.out = function(message, message_level = 0) {
   if(message_level <= this.log_level)
   {
      const now = new Date();
      this.output(now.toLocaleString() + ": ");
      if(typeof message === "string")
         this.output(message);
      else if(typeof message === "object")
      {
         if(message instanceof Error)
            this.output(message.toString());
         else
            this.output(JSON.stringify(message, null, 2));
      }
      else if(message !== undefined && message !== null)
         this.output(message.toString());
      this.output("\n");
   }
};

/**
 * @param {*} message Specifies the content to log under the debug log level
 */
Logger.prototype.debug = function(message) {
   this.out(message, log_levels.DEBUG);
};

/**
 * 
 * @param {*} message Specifies the content to log under the info log level
 */
Logger.prototype.info = function(message) {
   this.out(message, log_levels.INFO);
};

Logger.prototype.error = function(message) {
   this.out(message, log_levels.ERROR);
};


module.exports = Logger;