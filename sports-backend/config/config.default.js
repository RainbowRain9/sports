/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1570367216778_7082';

  exports.security = {
    csrf: { enable: false },
  };
  config.cors = {
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    origin: ctx => ctx.get('origin'),
  };
  // add your middleware config here
  config.middleware = [];
  // config.cluster = {
  //   listen: {
  //     port: 443,
  //   },
  // };
  // JWT配置
  config.jwt = {
    secret: 'sports-management-system-jwt-secret-key-2025',
    expiresIn: '2h'
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
