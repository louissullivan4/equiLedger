const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/')); // Ensure the directory path is correct
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!'); // Reject files that are not images
    }
}

// Initialize multer with storage and file filter settings
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('receipt_image'); // Expecting a single file upload with the key 'receipt_image'

module.exports = upload;