const {
  addBabelPlugin,
  override,
} = require('customize-cra');

module.exports = {
  webpack: override(
    addBabelPlugin(
      ['emotion'],
    ),
  ),
}
