const Axios = require("axios").default;
const Target = require("./Target");


/**
 * @typedef HttpRequestParamsType
 * @property {string} name Specifies the name of the target.
 * @property {string[]} depends Specifies the names of targets on which the generated target will depend.
 * @property {string | function<string>} endpoint Specifies the URL for the web service to invoke.
 * @property {string="POST"} method Specifies the HTTP method for the request
 * @property {object={} | function<object>} query_params Optionally specifies the query parameters that will be passed along with the endpoint.
 * @property {object={} | function<object>} headers Optionally specifies the HTTP header fields that will be passed with the request.
 * @property {*?} data Optionally specifies the data that should be passed with the request.  This can be any of the 
 * types supported by the axios module but can also be specified as a function that would be
 * called before the request that would return the actual data to be sent.
 * @property {object={} | function<object>} other_axios_props Optionally specifies other properties that should be
 * passed to the axios request.
 * @property {function<object>?} response_handler Optionally specifies a function that will handle the response from the request.
 * @property {object={}} options Specifies the options used when this target is generated within a sub-project.
 */
/**
 * Defines a target type that performs an HTTP request for GET, POST, PUT, and other 
 * HTTP methods.  
 * @param {HttpRequestParamsType} params Specifies the parameters
 * @returns {Target} Returns the target that is generated by calling this function.
 */
async function http_request({
   name,
   depends,
   endpoint,
   method = "POST",
   query_params = {},
   headers = {},
   data = undefined,
   other_axios_props = {},
   response_handler = undefined,
   options
}) {
   const rtn = await Target.target({
      name,
      depends,
      action: async function() {
         return new Promise((accept, reject) => {
            const request_method = method.toUpperCase();
            const request_headers = (typeof headers === "function" ? headers() : headers);
            const request_params = (typeof query_params === "function" ? query_params() : query_params);
            const request_axios_props = (typeof axios_props === "function" ? other_axios_props() : other_axios_props)
            const request_endpoint = (typeof endpoint === "function" ? endpoint() : endpoint);
            const axios_config = {
               headers: request_headers,
               params: request_params,
               ...request_axios_props
            };
            let effective_data = (typeof data === "function" ? data(axios_config) : data);
            if(typeof effective_data === "object")
               effective_data = JSON.stringify(effective_data);
            if(request_method === "POST")
            {
               Axios.post(request_endpoint, effective_data, axios_config).then((response) => {
                  let rtn = response;
                  if(typeof response_handler === "function")
                     rtn = response_handler.call(this, response);
                  accept(rtn);
               }).catch((error) => {
                  reject(error);
               });
            }
            else if(request_method === "GET")
            {
               Axios.get(request_endpoint, axios_config).then((response) => {
                  let rtn = response;
                  if(typeof response_handler === "function")
                     rtn = response_handler.call(this, response);
                  accept(rtn);
               }).catch((error) => {
                  reject(error);
               });
            }
            else if(request_method === "PUT")
            {
               Axios.put(request_endpoint, effective_data, axios_config).then((response) => {
                  let rtn = response;
                  if(typeof response_handler === "function")
                     rtn = response_handler.call(this, response);
                  accept(rtn);
               }).catch((error) => {
                  reject(error);
               });
            }
            else
               reject(Error(`Unsupported HTTP method: ${this.method}`));
         });
      },
      options
   });
   return rtn;
}

module.exports = {
   http_request
}
