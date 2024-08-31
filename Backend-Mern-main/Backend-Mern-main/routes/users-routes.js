const express = require('express');
const { check } = require('express-validator');



const UsersController = require('../controllers/users-controllers');

const router = express.Router();




router.get('/', UsersController.getUsers);



router.post('/signup',[
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(), // changes any errors in 
    check('password').isLength({min: 8})
], UsersController.signup);

router.post('/login', UsersController.login);


module.exports = router;