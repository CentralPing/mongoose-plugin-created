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
    },
    expires: {
      path: 'created.expires',
      options: {}
    }
  }, options || {});

  // No check for `options.date.path` since it's assumed this is what the plugin
  // is for.
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

    if (options.date.options.expires && options.expires.path) {
      (Object.keys(options.expires.options).length === 0 ?
        schema.virtual(options.expires.path) :
        schema.path(options.expires.path, options.expires.options)
      ).get(function getExpiration() {
        var expires = new Date(this.get(options.date.path));

        expires.setMilliseconds(expires.getMilliseconds() + options.date.options.expires);

        return expires;
      });
    }
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
