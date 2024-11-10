const Job = require('../models/Job')
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const getAllJobs = async (req, res) => {
  const { position, company, status, page = 1, limit = 10, search } = req.query;
  const queryObject = { createdBy: req.user.userId };

  if (position) queryObject.position = position;
  if (company) queryObject.company = company;
  if (status) queryObject.status = status;

  if (search) {
    queryObject.$or = [
      { position: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  let result = Job.find(queryObject);

  const skip = (page - 1) * limit;
  result = result.skip(skip).limit(Number(limit));

  const jobs = await result;
  const totalJobs = await Job.countDocuments(queryObject);

  res.status(StatusCodes.OK).json({
    jobs,
    count: jobs.length,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: page,
  });
};


const getJob = async(req, res) => {
    const {
        user: { userId },
        params: { id: jobId },} = req
    
      const job = await Job.findOne({
        _id: jobId,
        createdBy: userId,
      })
      if (!job) {
        throw new NotFoundError(`No job with this id`)
      }
      res.status(StatusCodes.OK).json({ job })
}

const createJob = async(req, res) => {
  req.body.createdBy = req.user.userId
  if (req.file) {
    req.body.material = req.file.path;
  }
  const job = await Job.create(req.body)
  res.status(StatusCodes.CREATED).json({ job })
};

const updateJob = async(req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  if (req.file) {
    req.body.material = req.file.path;
  }

  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with this id`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const deleteJob = async(req, res) => {
    const {
        user: { userId },
        params: { id: jobId },
      } = req
    
      const job = await Job.findByIdAndRemove({
        _id: jobId,
        createdBy: userId,
      })
      if (!job) {
        throw new NotFoundError(`No job with this id`)
      }
      res.status(StatusCodes.OK).send()
}

const addFavoriteJob = async (req, res) => {
  const { userId } = req.user;
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: jobId } },
    { new: true }
  );

  res.status(StatusCodes.OK).json({ favorites: user.favorites });
}

// Remove a job from favorites
const removeFavoriteJob = async (req, res) => {
  const { userId } = req.user;
  const { jobId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { favorites: jobId } },
    { new: true }
  );

  res.status(StatusCodes.OK).json({ favorites: user.favorites });
}

const getFavoriteJobs = async (req, res) => {
  const { userId } = req.user;

  const user = await User.findById(userId).populate('favorites');
  if (!user) {
    throw new NotFoundError(`No user found`);
  }

  res.status(StatusCodes.OK).json({ favoriteJobs: user.favorites });
}

module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    addFavoriteJob,
    removeFavoriteJob,
    getFavoriteJobs,
}