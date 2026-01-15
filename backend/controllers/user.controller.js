import { User } from '../model/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/dataUri.js';


export const updateProfile = async (req, res) => {
  const { bio, userName, email } = req.body;
  let profilePic = 'https://res.cloudinary.com/meovercloud/image/upload/v1727717288/v0x-Vista/xxjnxeld58gfmbjm8vxi.jpg';

   try {
  if (req.file) {
    const uriData = getDataUri(req.file);
    const cloudResponse = await cloudinary.uploader.upload(uriData.content, {
      folder: 'Vox-Vista',
    });
    profilePic = cloudResponse.secure_url;
  }
        console.log("you are in updateprofiie",profilePic);
  const userId = req.id.userId;
 
    const updatedProfile = await User.findByIdAndUpdate(userId, {
      userName,
      email,
      profile: {
        profilePic,
        bio,
      }
    }, { new: true });

    if (!updatedProfile) {
      return res.status(400).json({
        message: 'user doesn\'t  exist',
        success: false
      })
    }

    return res.status(200).json({
      message: 'user Profile updated successfully',
      success: true
    })
  }catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'internal server error',
      success: false
    })
  }
}


export const searchUser = async (req, res) => {
  const currentUserId = req.id.userId;
  const { searchInput } = req.query;
  if (!searchInput || searchInput.trim() === '') {
    return res.json({ success: true, searchResult: [] });
  }

  try {
    const searchResult = await User.find({
      $or: [
        { email: { $regex: new RegExp(searchInput, 'i') } },
        { userName: { $regex: new RegExp(searchInput, 'i') } }
      ], _id: { $ne: currentUserId }
    });

    return res.status(200).json({
      message: 'User fetched successfully',
      searchResult,
      success: true
    });
  } catch (err) {
    console.error("Error fetching users:", err);

    return res.status(500).json({
      message: 'Error fetching users',
      success: false,
      error: err.message
    });
  }
};
