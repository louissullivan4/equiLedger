require('dotenv').config();

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
        }
    }
}).single('receipt_image');

const uploadToCloudinary = (req, res, next) => {
    if (!req.file) return next();

    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
        }
        req.file.path = result.secure_url;
        next();
    });

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
};

module.exports = {
    upload,
    uploadToCloudinary
};
