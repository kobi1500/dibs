
const express = require('express');
const router = express.Router();
const Post = require('../models/post');

router.get('/add_post', (req, res) => {
    res.render('posts/add_post');

});
router.post('/add_post', (req, res) => {

    var newPost = new Post({
        subject: req.body.subject,
        content: req.body.content,
        author:req.user._id,
        pictureProfile:req.user.profileImageURL,
        nameOfAuthor:req.user.displayName
    });
    newPost.save().then(post =>{
        post=post
        res.redirect('../users/profile');
        
    });
});

module.exports = router;