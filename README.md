mongoose-plugin-created
====================

[ ![Codeship Status for CentralPing/mongoose-plugin-created](https://codeship.com/projects/e23c0930-4b41-0132-6abf-22e4e23acdc5/status)](https://codeship.com/projects/46701)

A [mongoose.js](https://github.com/LearnBoost/mongoose/) plugin to create a document creation timestamp with optional user identifier.

## API Reference
**Example**  
```js
var createdPlugin = require('mongoose-plugin-created');
var schema = Schema({...});
schema.plugin(createdPlugin[, OPTIONS]);
```
<a name="module_mongoose-plugin-created..options"></a>
### mongoose-plugin-created~options
**Kind**: inner property of <code>[mongoose-plugin-created](#module_mongoose-plugin-created)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| [options.date] | <code>object</code> |  | options for configuring the path for storing the date. |
| options.date.useVirtual | <code>boolean</code> | <code>true</code> | use a virtual path to infer the document creation date from the ObjectId `_id`. Will revert to a real path if `options.date.options` are specified. |
| options.date.path | <code>string</code> | <code>&quot;created.date&quot;</code> | the path for storing the creation date if not a virtual. |
| options.date.options | <code>object</code> |  | property options to set (`type` will always be `Date`). `(e.g. {select: false})` |
| [options.by] | <code>object</code> |  | options for configuring the path for storing the creator. |
| options.by.path | <code>string</code> | <code>&quot;created.by&quot;</code> | the path for storing the document creator. |
| options.by.ref | <code>string</code> |  | the reference model to use `(e.g. {by: {ref: 'ModelRefName'}})` |
| options.by.options | <code>object</code> |  | property options to set (if not a reference the `type` will always be `String`). `(e.g. {select: false})` |
| [options.expires] | <code>object</code> |  | options for configuring the path to store the expiration time for the document based on the date path. |
| options.expires.path | <code>string</code> | <code>&quot;created.expires&quot;</code> | the path for storing the document expiration timestamp. *This is an approimation due to MongoDB's method for expiring documents* |
| options.expires.options | <code>object</code> |  | property options to set ()`type` will always be `Date`). `(e.g. {select: false})` |


## Examples

### With Defaults
```js
var createdPlugin = require('mongoose-plugin-created');
var schema = Schema({foo: String});
schema.plugin(createdPlugin);

var Foo = mongoose.model('Foo', schema);
var foo = Foo(); // foo.created --> {date: 'Wed May 05 2015 12:05:50 GMT-0400 (EDT)'}
```

### With Options
```js
var createdPlugin = require('mongoose-plugin-created');
var schema = Schema({foo: String});
schema.plugin(createdPlugin, {by: {ref: 'UserModel'}});

var Foo = mongoose.model('Foo', schema);
var foo = Foo(); // foo.created --> {date: 'Wed May 05 2015 12:05:50 GMT-0400 (EDT)'}
foo.created.by = userA; // foo.created --> {date: 'Wed May 05 2015 12:05:50 GMT-0400 (EDT)', by: '507f191e810c19729de860ea'}
```
