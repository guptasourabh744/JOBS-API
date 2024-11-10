const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authentication');
const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  addFavoriteJob,
  removeFavoriteJob,
  getFavoriteJobs
} = require('../controllers/jobs');
const upload = require('../middleware/upload');

router.use(authenticateUser);

router.route('/favorites')
  .get(getFavoriteJobs);

router.route('/')
  .get(getAllJobs)
  .post(upload.single('material'), createJob);

router.route('/:id')
  .get(getJob)
  .patch(upload.single('material'), updateJob)
  .delete(deleteJob);

router.route('/:jobId/favorite')
  .post(addFavoriteJob)
  .delete(removeFavoriteJob);

module.exports = router;
