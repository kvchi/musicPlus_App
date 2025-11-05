import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.CLOUDIANRY_API_KEY)

cloudinary.config({
     cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDIANRY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
    
})

export default cloudinary;
