const Subdir = require("./src/Subdir");

module.exports = async function(options) {
   await Subdir.subdir({ name: "src", options });   
};