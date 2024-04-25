const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});
// exerciseSchema.virtual('id').get(function () {
//   return this._id;
// });
exerciseSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
      delete ret._id;
  }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
