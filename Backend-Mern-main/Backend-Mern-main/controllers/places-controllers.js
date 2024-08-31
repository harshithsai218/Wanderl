const { v4: uuid } = require('uuid');
const { validationResult } =require('express-validator');
const mongoose = require('mongoose');

const getCoordsForAddress = require('../util/location');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');



const getPlaceById = async (req, res, next) => {

    const placeId = req.params.pid; // find the pace that has the GET placeID

    let place;

    try{
        place = await Place.findById(placeId);
    } catch (err){
        const error = new HttpError('something went wrong while searching pid', 500);
        return next(error);
    }
    



    if(!place){
        const error =  new HttpError('could not  find a place with pid ', 404 );
        return next(error);
    }

    res.json({place: place.toObject( {getters: true} )}); //   => {place} => {place: place} to find the place that is similar to searched placeId
};




const getPlacesByUserId = async (req, res, next) => {

    const userId = req.params.uid;
    let places;
    try {
        places = await Place.find({creator: userId});
    } catch(err) {
        const error = new HttpError('error getting all places using userid', 500);
        return next(error);
    }
    


    if(!places || places.length === 0){
        return next( new Error('could not  find  places that is made by that user', 404));
        // to find and provide all the users palces that are made 
    }


    console.log('Get request in place');
    res.json({places: places.map(place => place.toObject( { getters: true }))});
}

const createPlace = async (req, res ,next) => {
    const errors = validationResult(req);


    if(!errors.isEmpty()) {
        console.log(errors);
        res.status(422);
        next( new HttpError('Invalid input, chech the data', 422));
    }
    const {title, description,  address, creator} = req.body;
    let coordinates;
    try{
         coordinates = await getCoordsForAddress(address);    
    }
    catch(error){
        return next(error);
    }
    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: 'https://imgs.search.brave.com/VU5Rz6CNeCqjmkG61mams1uFB-cqld3nG-1A8WPvQRE/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9pbWcu/d2F0dHBhZC5jb20v/ZGU5Yjk2NzQ0NDY3/NWY2ZTVkYjFmZThj/OTIxMTU0NTcyZTJh/ZTBmYS82ODc0NzQ3/MDczM2EyZjJmNzMz/MzJlNjE2ZDYxN2E2/ZjZlNjE3NzczMmU2/MzZmNmQyZjc3NjE3/NDc0NzA2MTY0MmQ2/ZDY1NjQ2OTYxMmQ3/MzY1NzI3NjY5NjM2/NTJmNTM3NDZmNzI3/OTQ5NmQ2MTY3NjUy/ZjUwMmQ3YTM1NGQ2/NDY5NGMzMTM1MzI2/NDU5NDEzZDNkMmQz/MTMxMzkzNjMyMzYz/NjMyMzQzMzJlMzEz/NjY0MzczMDM4MzMz/MzM1Mzc2MTMyNjYz/OTMyNjMzMzM1MzAz/NTMyMzIzNTM3Mzcz/MTM3MzYyZTZhNzA2/Nz9zPWZpdCZ3PTcy/MCZoPTcyMA',
        creator
    });


    let user;
    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError(' Creating place failed', 500);
        return next(error);
    }

    if(!user) {
        const error = new HttpError('Could not find the user that goes by the id', 404);
        return next(error);
    }
    console.log(user);

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session: sess});
        user.places.push(createdPlace);
        await user.save({ session: sess});
        await sess.commitTransaction();
    } catch (err){
        const error = new HttpError('creation of place failed', 500);
        return next(error);
    }
    

    res.status(201).json({place: createdPlace});
};


const updatePlacesById = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors);
        res.status(422);
        return next( new HttpError('Invalid data please check.', 422));
    }
    const { title , description } =req.body;
    const placeId = req.params.pid;

    let place;
    try{
        place = await Place.findById(placeId);
    } catch (err){
        const error = new HttpError('something went wrong while updating pid', 500);
        return next(error);
    }
    
    place.title = title;
    place.description = description;

    try{
        await place.save();
    } catch (err) {
        const error = HttpError('Something went wrong while updating the db', 500);
        return next(error);
    }

    res.status(200).json({place: place.toObject( {getters: true} )});
};


const deletePlacesById = async(req, res, next) => {
    const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place1.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({session: sess}) ;
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
  };

exports.getPlaceById = getPlaceById; 
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlacesById = updatePlacesById;
exports.deletePlacesById = deletePlacesById;
