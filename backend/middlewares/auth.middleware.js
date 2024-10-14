import jwt from 'jsonwebtoken';

export const auth =(req,res,next)=>{
   const {token} = req.cookies;

   if(!token){
    return res.status(401).json({
        message:'User not authorized hue',
        success:false
    })
   }
   try{
      jwt.verify(token,process.env.SECRET_KEY,(err,userId)=>{
         if(err){
            return res.status(401).json({
                 message:"You are not authenticated , login first",
                 success:false
             })
           }
           req.id=userId;
          })
          next();
   }catch(err){
      console.log(err);

   }
}