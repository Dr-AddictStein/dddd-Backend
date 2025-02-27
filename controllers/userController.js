import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";



const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};


export const getAllUser = async (req, res) => {
  const users = await userModel.find({});
  return res.status(200).json({ users });
}
export const getSingleUser = async (req, res) => {
  const { id } = req.params;
  const data = await userModel.findById(id);
  return res.status(200).json({ data });
}

export const loginUser = async (req, res) => {


  const { userName, password } = req.body;
  try {
    const user = await userModel.login(userName, password);

    const token = createToken(user._id);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const singupUser = async (req, res) => {
  const { fullName, userName, teamName, email, password } = req.body;


  try {
    const user = await userModel.signup(fullName, userName, email, password, teamName);


    const token = createToken(user._id);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkUser = async (req, res) => {
  const { user } = req.body;
  if (!user._id) {
    return res.status(400).json({ success: false });
  }
  const userFind = await userModel.findById(user._id);
  if (userFind && userFind.userName && userFind.email && userFind.userName === user.userName && userFind.email === user.email) {
    return res.status(200).json({ success: true });
  }
  else return res.status(400).json({ success: false });
}
