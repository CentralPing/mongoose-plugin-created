/* jshint node: true */

var _ = require('lodash-node/modern');

/**
 * @module mongoose-plugin-created
 * @example
```js
var createdPlugin = require('mongoose-plugin-created');
var schema = Schema({...});
schema.plugin(createdPlugin[, OPTIONS]);
```
*/

module.exports = function createdPlugin(schema, options) {
  /**
   * @param {object} [options]
   * @param {object} [options.date] - options for configuring the path for storing the date.
   * @param {boolean} options.date.useVirtual=true - use a virtual path to infer the document creation date from the ObjectId `_id`. Will revert to a real path if `options.date.options` are specified.
   * @param {string} options.date.path=created.date - the path for storing the creation date if not a virtual.
   * @param {object} options.date.options - property options to set (`type` will always be `Date`). `(e.g. {select: false})`
   * @param {object} [options.by] - options for configuring the path for storing the creator.
   * @param {string} options.by.path=created.by - the path for storing the document creator.
   * @param {string} options.by.ref - the reference model to use `(e.g. {by: {ref: 'ModelRefName'}})`
   * @param {object} options.by.options - property options to set (if not a reference the `type` will always be `String`). `(e.g. {select: false})`
   * @param {object} [options.expires] - options for configuring the path to store the expiration time for the document based on the date path.
   * @param {string} options.expires.path=created.expires - the path for storing the document expiration timestamp. *This is an approimation due to MongoDB's method for expiring documents*
   * @param {object} options.expires.options - property options to set ()`type` will always be `Date`). `(e.g. {select: false})`
  */
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
      schema.path(options.expires.path, _.defaults(
        {type: Date},
        options.expires.options
      ));

      schema.pre('validate', function (next) {
        var expires;

        if (this.isNew) {
          // http://mongoosejs.com/docs/api.html#schema_date_SchemaDate-expires
          expires = this.schema.path(options.date.path)._index.expireAfterSeconds;

          if (_.isNumber(expires)) {
            expires = new Date(this.get(options.date.path).getTime() + (expires * 1000));
          }

          this.set(options.expires.path, expires);
        }

        next();
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
