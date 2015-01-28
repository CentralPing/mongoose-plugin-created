var mongoose = require('mongoose');
var _ = require('lodash-node/modern');

module.exports = function createdPlugin(schema, options) {
  /* jshint eqnull:true */
  options = _.merge({
    useVirtual: true,
    datePath: 'created.date',
    byPath: 'created.by',
    byRef: undefined,
    expires: undefined
  }, options || {});

  if (!schema.path(options.datePath)) {
    if (options.useVirtual && options.expires === undefined) {
      schema.virtual(options.datePath).get(function convertIdToTimestamp() {
        return new Date(this._id.getTimestamp());
      });
    }
    else {
      schema.path(options.datePath, {
        type: Date,
        default: Date.now
      });

      if (options.expires) {
        schema.path(options.datePath).expires(options.expires);
      }
    }
  }

  if (options.byRef != null && !schema.path(options.byPath)) {
    schema.path(options.byPath, {
      type: mongoose.Schema.Types.ObjectId,
      ref: options.byRef,
      required: true
    });
  }
};
