import jwt from 'jsonwebtoken';

export const auth =(req,res,next)=>{
   const {token} = req.cookies;

   if(!token){
    return res.status(401).json({
        message:'User not authorized',
        success:false
    })
   }
   try{
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.id = decoded; // { userId, iat, exp }
      return next();
   }catch(err){
      return res.status(401).json({
        message: "You are not authenticated , login first",
        success: false
      })
   }
}