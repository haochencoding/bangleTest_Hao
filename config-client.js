/* eslint-disable camelcase */
// eslint-disable-next-line no-unused-vars
const config = {
  connectOAuth: {
    name: 'connect',
    oauth: {
      version: 2,
      auth: 'https://connect-project.io/authorize',
      grant: 'https://connect-project.io/oauth/token',
      response_type: 'token'
      // the response_type in the connect configuration must be set to 'token' instead of 'code'
    },
    base: 'https://connect-project.io/',
    get: { me: 'oauth/user' },
    xhr: function(p) {
      const token = p.query.access_token;
      delete p.query.access_token;
      if(token) {
        p.headers = {
          'Authorization': 'Bearer ' + token
        };
      }

      return true;
    }
  },
  clientId: 'pub_d9b7e3bf71bc47f28c1afd9072b23da6', //connectApp
  //clientId: 'pub_7c86d46ef00845449f1af4b71f659148', //Test19/01
  oauthProxy: 'http://localhost:3500/oauthproxy',
  redirectURI: 'redirect.html'
};
