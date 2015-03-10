var mongoose = require('mongoose');
var _ = require('lodash-node/modern');

module.exports = function createdPlugin(schema, options) {
  /* jshint eqnull:true */
  options = _.merge({
    useVirtual: true,
    datePath: 'created.date',
    dateOptions: {},
    byPath: 'created.by',
    byRef: undefined,
    byOptions: {}
  }, options || {});

  if (options.useVirtual && Object.keys(options.dateOptions).length === 0) {
    schema.virtual(options.datePath).get(function convertIdToTimestamp() {
      return new Date(this._id.getTimestamp());
    });
  }
  else {
    schema.path(options.datePath, _.merge({
      type: Date,
      default: Date.now
    }, options.dateOptions));
  }

  if (options.byRef != null) {
    schema.path(options.byPath, _.merge({
      type: mongoose.Schema.Types.ObjectId,
      ref: options.byRef
    }, options.byOptions));
  }
};
