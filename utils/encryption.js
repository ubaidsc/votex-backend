const crypto = require("crypto");

// Get encryption key from environment variable
const ENCRYPTION_KEY = "IS_Semester_Project";
const ALGORITHM = "aes-256-cbc";

// Check if encryption key exists
if (!ENCRYPTION_KEY) {
  console.error("ENCRYPTION_KEY not set in environment variables");
  process.exit(1);
}

// Function to encrypt data
const encrypt = (text) => {
  if (text === null || text === undefined) return text;

  // Convert to string if needed
  const textToEncrypt = typeof text !== "string" ? String(text) : text;

  // Create initialization vector
  const iv = crypto.randomBytes(16);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );

  // Encrypt text
  let encrypted = cipher.update(textToEncrypt, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return `${iv.toString("hex")}:${encrypted}`;
};

// Function to decrypt data
const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") return encryptedText;

  try {
    // Check if text is encrypted (contains IV separator)
    if (!encryptedText.includes(":")) return encryptedText;

    // Split IV and encrypted data
    const [ivHex, encryptedData] = encryptedText.split(":");

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      Buffer.from(ivHex, "hex")
    );

    // Decrypt data
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedText; // Return original if decryption fails
  }
};

// Function to help with finding documents with encrypted fields
const findWithEncryption = async (model, encryptedFields, query) => {
  // If query contains encrypted fields, we need to create a special query
  const hasEncryptedField = Object.keys(query).some((key) =>
    encryptedFields.includes(key)
  );

  if (!hasEncryptedField) {
    // If no encrypted fields in query, just use normal find
    return model.find(query);
  }

  // Get all documents (not efficient for large collections)
  const documents = await model.find();

  // Filter documents manually after decryption
  return documents.filter((doc) => {
    return Object.keys(query).every((key) => {
      if (encryptedFields.includes(key)) {
        // For encrypted fields, compare with decrypted value
        return decrypt(doc[key]) === query[key];
      } else {
        // For regular fields, compare directly
        return doc[key] == query[key]; // Using == to handle ObjectId comparison
      }
    });
  });
};

// Function to find a single document with encrypted fields
const findOneWithEncryption = async (model, encryptedFields, query) => {
  const results = await findWithEncryption(model, encryptedFields, query);
  return results.length > 0 ? results[0] : null;
};

module.exports = {
  encrypt,
  decrypt,
  findWithEncryption,
  findOneWithEncryption,
};
