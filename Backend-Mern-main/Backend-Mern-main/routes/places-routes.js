const express = require('express');
const {check} = require('express-validator');

const PlacesController = require('../controllers/places-controllers');

const router = express.Router();




router.get('/:pid', PlacesController.getPlaceById);


router.get('/user/:uid', PlacesController.getPlacesByUserId);

router.post('/', [
    check('title').not().isEmpty(),
    check('description').isLength({min: 5}),
    check('address').not().isEmpty()
    ]
    ,PlacesController.createPlace);

router.patch('/:pid', [
    check('title').not().isEmpty(),
    check('description').isLength({min: 5})
], PlacesController.updatePlacesById);

router.delete('/:pid', PlacesController.deletePlacesById);

module.exports = router;