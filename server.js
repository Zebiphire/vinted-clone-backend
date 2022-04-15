// Imports des packages :
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
app.use(formidable());
app.use(morgan("dev"));
app.use(cors());
require("dotenv").config();
mongoose.connect(process.env.MONGODB_URI);

//import des routes
const userRoutes = require("./routes/users");
app.use(userRoutes);
const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

app.listen(process.env.PORT, () => {
  console.log("*** ========= Server has started ========= ***");
});

app.all("*", (req, res) => {
  res.status(404).json("Page introuvable !");
});
