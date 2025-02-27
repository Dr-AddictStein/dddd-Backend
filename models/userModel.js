import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  userName: {
    type: String,
    uniqe: true,
    required: true
  },
  email: {
    type: String,
    uniqe: true,
    required: true
  },
  password: {
    type: String
  },
});




userSchema.statics.signup = async function (fullName, userName, email, password) {
  const exist = await this.findOne({ email });
  const existU = await this.findOne({ userName });

  if (exist) {
    throw Error("Email already exists.!.");
  }
  if (existU) {
    throw Error("Username already taken.!.");
  }


  if (!email || !password || !userName || !fullName) {
    throw Error("All fields must be filled...");
  }

  if (!validator.isEmail(email)) {
    throw Error("Not a valid email.!.");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({ fullName, userName, email, password: hash });

  return user;
};



userSchema.statics.login = async function (userName, password) {
  if (!password || !userName) {
    throw Error("All fields must be filled...");
  }

  const user = await this.findOne({ userName });

  if (!user) {
    throw Error("Incorrect userName.!.");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw Error("Incorrect password.!.");
  }

  return user;
};



const user = mongoose.model("UserCollection", userSchema);

export default user;
