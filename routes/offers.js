const express = require("express");
const router = express.Router();

//import model and route
const User = require("../models/User");
const Offer = require("../models/Offer");
const Cloudinary = require("../services/CloudinarySettings");
const Authenticated = require("../middlewares/Authentification");

// Poster une annonce
router.post("/offer/publish", Authenticated, async (req, res) => {
  try {
    if (req.fields.product_name.length > 50) {
      return res.status(400).json({
        message: "Le titre ne doit pas dépasser 50 caractères.",
      });
    } else if (req.fields.product_description.length > 500) {
      return res.status(400).json({
        message: "La description ne doit pas dépasser 500 caractères.",
      });
    } else if (req.fields.product_price.length > 10000) {
      return res.status(400).json({
        message: "Le prix ne doit pas dépasser 10000 €.",
      });
    }

    const newOffer = new Offer({
      product_name: req.fields.product_name,
      product_description: req.fields.product_description,
      product_price: req.fields.product_price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ÉTAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: req.user,
    });

    let pictureToUpload = req.files.picture.path;
    const avatar = await Cloudinary.uploader.upload(pictureToUpload, {
      folder: "/vinted/offers/", // + newOffer._id,
      public_id: newOffer._id,
    });

    newOffer.product_image = avatar;
    await newOffer.save();

    res.status(200).json({
      message: "Offer posted !",
      newOffer: newOffer,
    });
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.put("/offer/update", Authenticated, async (req, res) => {
  try {
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.delete("/offer/delete", Authenticated, async (req, res) => {
  try {
    // Chercher les offres avec le bon ID
    const isOfferrExisting = await Offer.findOne({
      _id: req.fields._id, // 6256f1846b042100683562d6
      owner: req.user,
    });

    await deleteImageCloudinary(isOfferrExisting._id);

    // Supprimer l'offre
    isOfferrExisting.delete();

    res.status(200).json({
      message: "Offer deleted !",
    });
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    if (
      req.query.title &&
      req.query.priceMin &&
      req.query.priceMax &&
      req.query.sort &&
      req.query.page
    ) {
      let page = 0;
      if (req.query.page == 0 || req.query.page == 1) {
        // Do nothing
      } else {
        page = req.query.page;
      }
      const searchOffer = await Offer.find(
        { product_name: req.query.title },
        {
          product_price: { $gte: req.query.priceMin, $lte: req.query.priceMax },
        }
      )
        .limit(2)
        .skip(2 * page)
        .sort({ price: req.query.sort });

      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    } else if (req.query.title && req.query.sort) {
      const searchOffer = await Offer.find({
        product_name: req.fields.title,
      }).sort({ price: req.query.sort });

      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    } else if (req.query.title && req.query.priceMax) {
      const searchOffer = await Offer.find({
        product_name: req.query.title,
        product_price: { $lte: req.query.priceMax },
      });

      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    } else if (req.query.priceMin && req.query.priceMax) {
      const searchOffer = await Offer.find({
        product_price: { $gte: req.query.priceMin, $lte: req.query.priceMax },
      });

      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    } else if (req.query.sort) {
      if (req.query.sort === "price-desc") {
        const searchOffer = await Offer.find().sort({ price: "desc" });
        res.status(200).json({
          message: "We found some offers !",
          offerFound: searchOffer,
        });
      } else {
        const searchOffer = await Offer.find().sort({ price: "asc" });
        res.status(200).json({
          message: "We found some offers !",
          offerFound: searchOffer,
        });
      }
    } else if (req.query.title) {
      const searchOffer = await Offer.find({ product_name: req.query.title });
      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    } else if (req.query.page) {
      let page = 0;
      if (req.query.page == 0 || req.query.page == 1) {
        // Do nothing
      } else {
        page = req.query.page;
      }
      const searchOffer = await Offer.find()
        .limit(2)
        .sort({ product_name: "asc" })
        .skip(2 * page);

      res.status(200).json({
        message: "We found some offers !",
        offerFound: searchOffer,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "Error in the try catch",
      error: error,
    });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const searchOffer = await Offer.findOne({ id: req.query._id });

    res.status(200).json({
      message: "Offer found !",
      offer: searchOffer,
    });
  } catch (error) {
    res.json({ message: error.message });
  }
});

const deleteImageCloudinary = async (id) => {
  return await Cloudinary.uploader.destroy(
    "vinted/offers/" + id,
    { invalidate: true, resource_type: "image" },
    function (err, res) {
      if (err) {
        console.log(err);
        return res.status(400).json({
          ok: false,
          menssage: "Error deleting file",
          errors: err,
        });
      }
    }
  );
};

module.exports = router;
