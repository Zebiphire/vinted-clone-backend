const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const formidableMiddleware = require("express-formidable");
router.use(formidableMiddleware());

const stripe = createStripe(process.env.API_STRIPE);

router.post("/payment", async (req, res) => {
  try {
    let { status } = await stripe.charges.create({
      amount: req.fields.amount.toFixed(0),
      currency: "eur",
      description: `Paiement vinted pour : ${req.fields.title}`,
      source: req.fields.token,
    });
    // TODO add purchase to database
    // Remove article in database
    res.json({ status });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
