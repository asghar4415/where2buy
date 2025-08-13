import express from 'express';
import {getLocation, inputText} from '../controllers/controller.js';

const router = express.Router();

router.post('/getlocation', getLocation);
router.post('/inputtext', inputText);

router.get('/', (req, res) => {
  res.send('Hello from the API!');
});



export default router;
