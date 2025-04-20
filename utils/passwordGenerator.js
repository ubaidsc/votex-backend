const crypto = require('crypto');

/**
 * Generate a secure random password
 * @param {number} length - Length of the password (default: 10)
 * @returns {string} - Generated password
 */
const generatePassword = (length = 10) => {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed easily confused I and O
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // Removed easily confused l and o
  const numberChars = '23456789'; // Removed easily confused 0 and 1
  const specialChars = '!@#$%^&*_-+=?';
  
  // Combine all character sets
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Ensure the password has at least one character from each set
  let password = '';
  password += uppercaseChars.charAt(Math.floor(crypto.randomInt(0, uppercaseChars.length)));
  password += lowercaseChars.charAt(Math.floor(crypto.randomInt(0, lowercaseChars.length)));
  password += numberChars.charAt(Math.floor(crypto.randomInt(0, numberChars.length)));
  password += specialChars.charAt(Math.floor(crypto.randomInt(0, specialChars.length)));
  
  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(crypto.randomInt(0, allChars.length)));
  }
  
  // Shuffle the password characters
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};

module.exports = { generatePassword };