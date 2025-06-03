import cron from "node-cron"; // it is mainly used for scheduling the work that when the work has to be done.
import { Borrow } from "../models/borrowModels.js";
import {sendEmail} from "../utils/sendEmail.js"
import { User } from "../models/userModels.js";

export const notifyUsers = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const borrowers = await Borrow.find({
        dueDate: {
          $lt: oneDayAgo,
        },
        returnDate: null,
        notified: false,
      });

      for (const element of borrowers) {
        if (element.user && element.user.email) {
          await User.findById(element.user.id);
          sendEmail({
            email: element.user.email,
            subject: "Book Return Reminder",
            message: `Hi ${element.user.name},\n\nWe hope you're enjoying your current read from our Library Management System 📚\n\nJust a quick reminder — the book you borrowed, is to returned today\n\nTo avoid late return penalties and to help fellow readers, please return the book as soon as possible.\n\nIf you've already returned it, no worries — just ignore this message.Thank you for being a responsible reader! 🙌
            Best regards,  
            Library Team`,
          });
          element.notified = true;
          await element.save();
        }
      }
    } catch (error) {
        console.error("Error in sending book return reminders:", error);
    }
  });
};
