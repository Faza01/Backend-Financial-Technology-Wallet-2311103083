const bcrypt = require('bcryptjs');
const User = require('../models/user');

const isValidTransactionPin = (pin) => {
  return typeof pin === 'string' && /^\d{6}$/.test(pin);
};

const hashTransactionPin = async (pin) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
};

const verifyTransactionPin = async (userId, pin) => {
  if (!isValidTransactionPin(pin)) {
    return false;
  }

  const storedPin = await User.getTransactionPinById(userId);
  if (!storedPin || !storedPin.transaction_pin) {
    return false;
  }

  return bcrypt.compare(pin, storedPin.transaction_pin);
};

module.exports = {
  isValidTransactionPin,
  hashTransactionPin,
  verifyTransactionPin,
};
