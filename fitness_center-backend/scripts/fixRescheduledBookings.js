const mongoose = require('mongoose');
const Booking = require('../models/Booking');
require('dotenv').config();

const fixRescheduledBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all bookings with status "rescheduled" that were rescheduled by customer
    // and don't have rescheduleRequest (meaning they need to be converted to pending_reschedule)
    const bookingsToFix = await Booking.find({
      status: 'rescheduled',
      rescheduledBy: 'customer',
      rescheduleRequest: { $exists: false }
    });

    console.log(`Found ${bookingsToFix.length} bookings to potentially convert to pending_reschedule`);

    for (const booking of bookingsToFix) {
      console.log(`\nBooking ID: ${booking._id}`);
      console.log(`Customer: ${booking.customerName}`);
      console.log(`Current Status: ${booking.status}`);
      console.log(`Date: ${booking.date} at ${booking.time}`);

      // These bookings were directly rescheduled without approval
      // They should be converted to pending_reschedule if recent
      const hoursAgo = (Date.now() - new Date(booking.rescheduledAt).getTime()) / (1000 * 60 * 60);

      if (hoursAgo < 24) {
        // Recent reschedule - convert to pending approval
        booking.rescheduleRequest = {
          requestedDate: booking.date,
          requestedTime: booking.time,
          requestReason: booking.rescheduleReason || 'Customer requested reschedule',
          requestedAt: booking.rescheduledAt || new Date(),
          requestedBy: 'customer'
        };
        booking.date = booking.originalDate;
        booking.time = booking.originalTime;
        booking.status = 'pending_reschedule';

        await booking.save();
        console.log(`Converted to pending_reschedule - awaiting coach approval`);
      } else {
        console.log(`Skipped (older than 24 hours)`);
      }
    }

    console.log('\n Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

fixRescheduledBookings();
