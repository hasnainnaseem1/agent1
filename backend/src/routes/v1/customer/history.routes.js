const express = require('express');
const router = express.Router();
const { Analysis } = require('../../../models/customer');
const { auth } = require('../../../middleware/auth');

// @route   GET /api/history
// @desc    Get all analyses for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const total = await Analysis.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      analyses: analyses.map(analysis => ({
        id: analysis._id,
        title: analysis.originalListing.title,
        category: analysis.originalListing.category,
        score: analysis.score,
        createdAt: analysis.createdAt,
        status: analysis.status
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis history'
    });
  }
});

// @route   GET /api/history/:id
// @desc    Get single analysis by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.userId
    }).select('-__v');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      analysis: {
        id: analysis._id,
        originalListing: analysis.originalListing,
        recommendations: analysis.recommendations,
        competitors: analysis.competitors,
        score: analysis.score,
        status: analysis.status,
        processingTime: analysis.processingTime,
        createdAt: analysis.createdAt
      }
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis'
    });
  }
});

// @route   DELETE /api/history/:id
// @desc    Delete analysis by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting analysis'
    });
  }
});

// @route   DELETE /api/history
// @desc    Delete all analyses for current user
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const result = await Analysis.deleteMany({ userId: req.userId });

    res.json({
      success: true,
      message: `${result.deletedCount} analyses deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Delete all analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting analyses'
    });
  }
});

module.exports = router;