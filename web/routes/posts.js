const express = require('express');
const router = express.Router();

const User = require('../models/user');


router.get('/add_post', (req, res) => {

    res.render('posts/add_post');
});

module.exports = router;