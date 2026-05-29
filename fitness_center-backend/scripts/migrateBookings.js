/**
 * Migration Script: Fix Old Bookings
 *
 * This script migrates bookings that have email/string IDs
 * to use proper MongoDB ObjectId references
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");

const migrateBookings = async () => {
  try {
    console.log("Starting booking migration...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Get all users for reference
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    // Find bookings using raw MongoDB queries to bypass Mongoose schema validation
    const db = mongoose.connection.db;
    const bookingsCollection = db.collection("bookings");
    const allBookings = await bookingsCollection.find({}).toArray();
    console.log(`Found ${allBookings.length} total bookings\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const booking of allBookings) {
      try {
        let needsUpdate = false;
        let updates = {};

        console.log(`\nChecking booking ${booking._id}:`);
        console.log(
          `   customerId: ${booking.customerId} (${typeof booking.customerId})`,
        );
        console.log(
          `   coachId: ${booking.coachId} (${typeof booking.coachId})`,
        );

        // Check if customerId needs migration
        // Check if it's a string (including email) OR if it's not a valid ObjectId
        const customerIdStr = String(booking.customerId);
        if (
          customerIdStr.includes("@") ||
          (typeof booking.customerId === "string" &&
            !mongoose.Types.ObjectId.isValid(booking.customerId))
        ) {
          // Find user by email
          const customer = users.find(
            (u) =>
              u.email === customerIdStr || u.email === booking.customerEmail,
          );
          if (customer) {
            updates.customerId = customer._id;
            needsUpdate = true;
            console.log(`Customer: "${customerIdStr}" -> ${customer._id}`);
          } else {
            console.warn(
              `Warning: Customer not found for: ${customerIdStr} / ${booking.customerEmail}`,
            );
          }
        }

        // Check if coachId needs migration
        const coachIdStr = String(booking.coachId);
        if (
          typeof booking.coachId === "string" &&
          !mongoose.Types.ObjectId.isValid(booking.coachId)
        ) {
          // Try to find coach by various methods
          let coach = null;

          // If it's a number string like "6"
          if (!coachIdStr.includes("@") && !isNaN(coachIdStr)) {
            // Try to match by name since we have coachName
            coach = users.find(
              (u) => u.role === "coach" && u.name === booking.coachName,
            );
            console.log(
              `   Searching for coach by name "${booking.coachName}"...`,
            );
          } else if (coachIdStr.includes("@")) {
            // If it's an email
            coach = users.find((u) => u.email === coachIdStr);
          }

          if (coach) {
            updates.coachId = coach._id;
            needsUpdate = true;
            console.log(`Coach: "${booking.coachId}" -> ${coach._id}`);
          } else {
            console.warn(
              `Warning: Coach not found for: ${booking.coachId} (${booking.coachName})`,
            );
          }
        }

        // Update the booking if needed
        if (needsUpdate) {
          await bookingsCollection.updateOne(
            { _id: booking._id },
            { $set: updates },
          );
          migratedCount++;
          console.log(`Migrated booking ${booking._id}\n`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Error migrating booking ${booking._id}:`, error.message);
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Disconnect
    await mongoose.disconnect();
    console.log("\nMigration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
migrateBookings();
