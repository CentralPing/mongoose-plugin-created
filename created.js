var mongoose = require('mongoose');
var _ = require('lodash-node/modern');

module.exports = function createdPlugin(schema, options) {
  /* jshint eqnull:true */
  options = _.assign({
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
    schema.path(options.datePath, _.defaults(
      {type: Date},
      options.dateOptions,
      {default: Date.now}
    ));
  }

  if (options.byPath != null && options.byPath !== '') {
    schema.path(options.byPath, _.defaults(
      options.byRef != null ?
        {type: mongoose.Schema.Types.ObjectId, ref: options.byRef} :
        {type: String},
      options.byOptions
    ));
  }
};
