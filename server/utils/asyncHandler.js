const asyncHandler = (requestHAndler) =>{
    return (req, res, next) => {
        Promise.resolve(requestHAndler(req,res,next)).catch(err => next(err));
    }
}

export {asyncHandler}