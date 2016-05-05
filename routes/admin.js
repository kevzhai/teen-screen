var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET admin page. */
router.get('/', function(req, res, next) {
	fs.readFile('./private/sections.txt', function (err, content) {
      if (err) {
        return next(err);
      }
      res.render('admin', { title: 'Teen Screen Admin Page', lines : content.toString().split('\n') });
  });

  
});

module.exports = router;
