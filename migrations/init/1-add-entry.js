const v1_0 = require('../versions/1.0/1-add-tables');

module.exports = {
  up: async opts => {
    return v1_0.up(opts);
  },
  down: async opts => {
    return v1_0.down(opts);
  },
}
