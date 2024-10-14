import { User } from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const signup = async (req, res) => {
    console.log('hello');
    const { userName, email, password } = req.body;

    try {
        if (!userName || !email || !password || password.length < 6) {
            return res.status(400).json({
                message: password.length < 6
                    ? 'Password should not be less than 6 characters'
                    : 'Input fields can\'t be empty',
                success: false
            });
        }

        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({
                message: 'User already exist, try to login',
                success: false
            })
        }
        const userNameCheck = await User.findOne({ userName });
        if (userNameCheck) {
            return res.status(400).json({
                message: 'Username already taken try another name',
                success: false
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            userName,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: 'user registered successfully',
            success: true
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}


export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                message: 'Input field can\'t be empty',
                success: false
            });
        }

        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(401).json({
                message: 'User not found, signup first',
                success: false
            });
        }

        const passwordCheck = await bcrypt.compare(password, userExist.password);
        if (!passwordCheck) {
            return res.status(401).json({
                message: 'Incorrect password',
                success: false
            });
        }

        const tokenData = { userId: userExist._id };

        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });
        return res.status(200)
            .cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .json({
                message: 'Login successful',
                success: true,
                token,
            });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}


export const logOut = (req, res) => {
    try {
        return res.status(200).clearCookie('token').json({
            message: 'User successfully logged out',
            success: true
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}



export const checkSession = async (req,res) =>{
    const userId = req.id.userId;
 try{
     const profileData = await User.findById(userId);

     if(!profileData){
          return res.status(404).json({
             message:'profile not found',
             success:false
          })
     }
     return res.status(200).json({
           message:'user is authenticated',
           profileData,
           userId,
           success:true})

 }catch(err){
     console.log(err);
 }
}