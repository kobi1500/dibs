const mongoose = require('mongoose');

const Schema = mongoose.Schema;
// Schema

const PostSchema = new Schema({
  subject:{
      type:String,
      trim:true,
      required:true
  },
  content:{
    type:String,
    trim:true,
    required:true
},
createdAt:{
    type:Date,
    default:Date.now
},
author:{
    type: Schema.ObjectId,
    ref: 'User'
},
pictureProfile:{
    type: String,
    ref: 'User'
},
nameOfAuthor:{
    type:String
}

});

 module.exports = mongoose.model('Post', PostSchema);
