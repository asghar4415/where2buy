import express from 'express';
import { searchShops} from '../controllers/controller.js';

const router = express.Router();

router.post('/search', searchShops);

router.get('/', (req, res) => {
  res.send('Hello from the API!');
});



export default router;