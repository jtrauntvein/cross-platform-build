const Target = require("./Target.js");
const Axios = require("axios").default;

/**
 * @typedef GitlabTriggerPipelineParamsType
 * @property {string} name Specifies a unique name for the target
 * @property {string[]} depends Specifies the collection of targets that must be builts before this target is built.
 * @property {string} project Specifies thr gitlab identifier for the project that owns the pipeline
 * @property {string} token Specifies the access token to trigger the pipeline
 * @property {string} ref Specifies the branch or tag of the project to build
 * @param {object} options Must specify the options that were passed to the makefile function.
 * @param {object?} variables Specifies the colllection of environment variables that will be passed to the CI/CD environment
 */
/**
 * Triggers a pipeline on a GitLab project 
 * @param {GitlabTriggerPipelineParamsType} params Specifies the target parameters. 
 * @returns {object} Returns the object allocated to track this target.
 */
async function gitlab_trigger_pipeline({
   name,
   depends,
   project,
   token,
   ref,
   variables = {},
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      options,
      action: async function() {
         return new Promise((accept, reject) => {
            const data = {
               token,
               ref,
               variables
            };
            const url = `https://gitlab.com/api/v4/projects/${project}/trigger/pipeline`;
            Axios.postForm(url, data).then(() => {
               accept(true);
            }).catch((error) => {
               reject(error);
            });
         });
      }
   });
   return rtn;
}

module.exports = {
   gitlab_trigger_pipeline
};
