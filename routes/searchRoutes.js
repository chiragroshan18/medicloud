const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, searchStore } = require("../utils/helpers");

router.get("/", (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return errorResponse(res, "Search query 'q' parameter is required and cannot be empty", 400);
  }

  const results = searchStore(store, q);
  return successResponse(res, results);
});

module.exports = router;
