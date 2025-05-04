const { encrypt, decrypt } = require("./encryption");

// Mongoose plugin to add encryption functionality
const encryptionPlugin = (schema, options = {}) => {
  // Get fields to encrypt from options
  const fieldsToEncrypt = options.fields || [];

  // Pre-save middleware to encrypt fields
  schema.pre("save", function (next) {
    fieldsToEncrypt.forEach((field) => {
      if (this[field] !== undefined && this[field] !== null) {
        this[field] = encrypt(this[field]);
      }
    });
    next();
  });

  // Pre-update middleware
  schema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    // Handle $set operator
    if (update.$set) {
      fieldsToEncrypt.forEach((field) => {
        if (update.$set[field] !== undefined) {
          update.$set[field] = encrypt(update.$set[field]);
        }
      });
    }

    // Handle direct field updates
    fieldsToEncrypt.forEach((field) => {
      if (update[field] !== undefined) {
        update[field] = encrypt(update[field]);
      }
    });

    next();
  });

  // Post-find middleware to decrypt fields
  schema.post(/^find/, function (result, next) {
    // Handle array of documents
    if (Array.isArray(result)) {
      result.forEach((doc) => {
        if (doc) {
          fieldsToEncrypt.forEach((field) => {
            if (doc[field]) {
              doc[field] = decrypt(doc[field]);
            }
          });
        }
      });
    }
    // Handle single document
    else if (result && typeof result === "object") {
      fieldsToEncrypt.forEach((field) => {
        if (result[field]) {
          result[field] = decrypt(result[field]);
        }
      });
    }

    next();
  });

  // Add static methods to the schema to handle finding by encrypted fields
  schema.statics.findByEncryptedField = async function (field, value) {
    if (!fieldsToEncrypt.includes(field)) {
      // If not an encrypted field, use regular find
      const query = {};
      query[field] = value;
      return this.find(query);
    }

    // Get all documents (can be optimized for larger collections)
    const documents = await this.find();

    // Filter after decryption
    return documents.filter((doc) => decrypt(doc[field]) === value);
  };

  schema.statics.findOneByEncryptedField = async function (field, value) {
    const results = await this.findByEncryptedField(field, value);
    return results.length > 0 ? results[0] : null;
  };

  // Store the encrypted fields in the schema for reference
  schema.statics.encryptedFields = fieldsToEncrypt;
};

module.exports = encryptionPlugin;
