const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, validateProfile } = require("../utils/helpers");

router.get("/", (req, res) => {
  return successResponse(res, store.profile);
});

router.patch("/", (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, "Update payload cannot be empty", 400);
  }

  const errors = validateProfile(req.body);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for profile update", 400, errors);
  }

  store.profile = {
    ...store.profile,
    ...(req.body.name !== undefined && { name: req.body.name.trim() }),
    ...(req.body.dob !== undefined && { dob: req.body.dob.trim() }),
    ...(req.body.gender !== undefined && { gender: req.body.gender.trim() }),
    ...(req.body.bloodGroup !== undefined && { bloodGroup: req.body.bloodGroup.trim() }),
    ...(req.body.phone !== undefined && { phone: req.body.phone.trim() }),
    ...(req.body.emergencyContact !== undefined && { emergencyContact: req.body.emergencyContact.trim() }),
    ...(req.body.allergies !== undefined && { allergies: req.body.allergies.trim() }),
    ...(req.body.existingConditions !== undefined && { existingConditions: req.body.existingConditions.trim() }),
    ...(req.body.height !== undefined && { height: parseFloat(req.body.height) || 0 }),
    ...(req.body.weight !== undefined && { weight: parseFloat(req.body.weight) || 0 }),
    ...(req.body.bloodPressure !== undefined && { bloodPressure: req.body.bloodPressure.trim() })
  };

  return successResponse(res, store.profile, 200, "Health profile updated successfully");
});

module.exports = router;
