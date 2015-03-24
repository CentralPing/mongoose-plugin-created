var _ = require('lodash-node/modern');

module.exports = function createdPlugin(schema, options) {
  options = _.merge({
    date: {
      useVirtual: true,
      path: 'created.date',
      options: {}
    },
    by: {
      path: 'created.by',
      ref: undefined,
      options: {}
    }
  }, options || {});

  if (options.date.useVirtual && Object.keys(options.date.options).length === 0) {
    schema.virtual(options.date.path).get(function convertIdToTimestamp() {
      return new Date(this._id.getTimestamp());
    });
  }
  else {
    schema.path(options.date.path, _.defaults(
      {type: Date},
      options.date.options,
      {default: Date.now}
    ));
  }

  if (options.by.path) {
    schema.path(options.by.path, _.defaults(
      options.by.ref ?
        {type: schema.constructor.Types.ObjectId, ref: options.by.ref} :
        {type: String},
      options.by.options
    ));
  }
};
