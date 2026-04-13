const express = require('express');
const router = express.Router();
const {
    getAllSlots,
    addSlot,
    deleteSlot,
    recommendSlot,
    getSlotSchedule,
} = require('../controllers/slotController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, getAllSlots);
router.get('/recommend', authMiddleware, recommendSlot);
router.get('/:id/schedule', authMiddleware, getSlotSchedule);
router.post('/', authMiddleware, roleMiddleware, addSlot);
router.delete('/:id', authMiddleware, roleMiddleware, deleteSlot);

module.exports = router;