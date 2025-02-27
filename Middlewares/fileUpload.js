import multer from 'multer';
import path from 'path';
import util from 'util';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from "dotenv";

import multerS3 from 'multer-s3';

dotenv.config();

const accessKey = process.env.BUCKET_ACCESS;
const secretKey = process.env.BUCKET_SECRET;

const s3Client = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
    },
    region: process.env.AWS_REGION
})


const storage = multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const labId = req.params.labId; // Get labId from request parameters
        const fileName = `${Date.now().toString()}${path.extname(file.originalname)}`;
        const fullPath = `thumbnail/${labId}/${fileName}`; // Construct the full path
        cb(null, fullPath);
    }
})


function checkFileType(file, cb) {

    console.log("FHFHF",file);

    const filetypes = /jpeg|jpg|png|gif|mp4|mov|png/;

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const mimetype = filetypes.test(file.mimetype);


    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images only (jpeg, jpg, png, gif, mp4, mov, png)!');
    }
}

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

const uploadMiddleWare = upload;

export default uploadMiddleWare;