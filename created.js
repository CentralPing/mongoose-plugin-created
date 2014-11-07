var mongoose = require('mongoose');

module.exports = function createdPlugin(schema, modelRef) {
  schema.add({
    created: {
      date: {
        type: Date,
        default: Date.now
      }
    }
  });

  if (modelRef) {
    schema.add({
      'created.by': {
        type: mongoose.Schema.Types.ObjectId,
        ref: modelRef,
        required: true
      }
    });
  }
};
