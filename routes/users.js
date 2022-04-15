const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//import model and service
const User = require("../models/User");
const Cloudinary = require("../services/CloudinarySettings");

// Sign up
router.post("/user/signup", async (req, res) => {
  try {
    if (req.fields.username === null || req.fields.email === null) {
      res
        .status(400)
        .json({ message: "The username/email is/are not filled in." });
    }
    //let isExist = await isUserExist(req.fields.email);
    if ((await isUserExist(req.fields.email)) === false) {
      const password = req.fields.password;
      const username = req.fields.username;
      const email = req.fields.email;
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      // Upload and get picture object
      let pictureToUpload = req.files.picture.path;
      const avatar = await Cloudinary.uploader.upload(pictureToUpload);

      const newUser = new User({
        account: { username: username, avatar: avatar },
        email: email,
        password: password,
        newsletter: true,
        token: token,
        hash: hash,
        salt: salt,
      });

      await newUser.save();

      if ((await isUserExist(req.fields.email)) === true) {
        const userToShow = new User({
          _id: newUser._id,
          token: newUser.token,
          account: { username: newUser.account.username },
        });
        res.status(200).json({
          message: "User successfully created !",
          newUser: userToShow,
        });
      } else {
        res.status(400).json({
          message: "The user can't be saved in the database !",
        });
      }
    } else {
      res.status(400).json({
        message: "The user account already exists with this username/email!",
      });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

// Login
router.post("/user/login", async (req, res) => {
  try {
    if (req.fields.password === null || req.fields.email === null) {
      res.status(400).json({ message: "The password/email is/are missing." });
    }

    const isUserExisting = await User.findOne({
      email: req.fields.email,
    });

    if (isUserExisting) {
      const password = req.fields.password;
      const hash = SHA256(password + isUserExisting.salt).toString(encBase64);

      if (isUserExisting.hash === hash) {
        const userToFront = new User({
          _id: isUserExisting._id,
          token: isUserExisting.token,
          account: { username: isUserExisting.account.username },
        });

        res.status(200).json({
          message: "User successfully connected !",
          user: userToFront,
        });
      } else {
        res.status(400).json({
          message: "Wrong password !",
        });
      }
    } else {
      res.status(400).json({
        message: "The user account already exists with this username/email!",
      });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

let isUserExist = async (email) => {
  try {
    const isUserExisting = await User.findOne({
      email: email,
    });

    if (isUserExisting) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    res.json({ message: error.message });
  }
};

module.exports = router;
