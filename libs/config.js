var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: './libs/config.json' });

module.exports = nconf;
