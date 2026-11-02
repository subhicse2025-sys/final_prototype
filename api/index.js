const { app, initialize } = require("../backend/server");

module.exports = async function handler(request, response) {
  await initialize();
  return app(request, response);
};
