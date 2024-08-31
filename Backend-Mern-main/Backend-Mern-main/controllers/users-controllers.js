const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const HttpError = require('../models/http-error');

const DUMMY_USERS = [
    {
            id: 'u1',
            name: 'Max vestappen',
            email: 'test@test.com',
            password: 'tested'
    }
];


const getUsers = async (req, res, next) => {
    let users;
    try {
        users =  await User.find({}, '-password');
    }
    catch (err) {
        const error = new HttpError('error fetching users ', 500);
        return next(error);
    }
    res.json({users: users.map(user => user.toObject({getters: true}))});
};

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors);
        res.status(422);
        return next (new HttpError ('The entered data is not valid, try again'));
    }
    let existingUser;
    const {name, email, password, places} = req.body;
    try{
        existingUser = await User.findOne({email: email});
    } catch (err) {
        return next(new HttpError('Signing up failed for some unknown reason', 500));
    }

    if(existingUser) {
        const error = new HttpError('Email already in use', 422);
        return next(error);
    }


    let createdUser =  new User( {
        name,
        email,
        image:'https://imgs.search.brave.com/obFZjTKWuHyq7MvT3up4_kXzahpa7roVx6kcR_aEczk/rs:fit:860:0:0/g:ce/aHR0cHM6Ly92aWRl/b2dhbWVzLnNpLmNv/bS8uaW1hZ2UvY19s/aW1pdCxjc19zcmdi/LHFfYXV0bzpnb29k/LHdfNzAwL01qQXhN/RFEwTnpjMU5UY3pN/ems1TWpBeS9nZW5z/aGluLWltcGFjdC1u/ZXV2aWxsZXR0ZS03/LnBuZw',
        password,
        places
    }); 


    try{
        await createdUser.save();
    } catch (err){
        const error = new HttpError('sign up of user failed', 500);
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject(({getters: true}))});
};

const login = async (req, res, next) => {
    const { email, password} = req.body;

    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    } catch (err) {
        return next(new HttpError('Signing up failed for some unknown reason', 500));
    }

    if (!existingUser || existingUser.password !== password){
        return next(new HttpError('invalid cred', 401));
    }

    res.status(200).json({message: 'loggedin'});

};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;