const User = require('../models/User')
const sendOTP = require('../services/otpService');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

const register = async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (user) {
    const otp = user.generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });
  } else {
    user = new User({ ...req.body });
    const otp = user.generateOTP();
    await user.save();
  }

  await sendOTP(user.email, user.otp);

  res.status(StatusCodes.CREATED).json({
    message: 'OTP sent to your email. Verify to complete registration.',
  });
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    throw new UnauthenticatedError('Invalid or expired OTP');
  }

  user.otp = null;
  user.otpExpires = null;
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  const token = user.createJWT()
  res.status(StatusCodes.OK).json({ user: { name: user.name }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password')
  }

  const user = await User.findOne({ email })
  if (!user || !user.isVerified) {
    throw new UnauthenticatedError('No such user registered successfully yet');
  }

  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('wrong password')
  }

  const token = user.createJWT()
  res.status(StatusCodes.OK).json({ user: { name: user.name }, token })
};

module.exports = {
  register,
  verifyOTP,
  login,
};
