import {app } from './app.js';
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
})


.then(() => [
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
])
.catch((err) => console.log("MongoDB connection failed !!!",err))