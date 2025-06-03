import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModels.js";
import { Book } from "../models/bookModels.js";
import { User } from "../models/userModels.js";
import { calculateFine } from "../utils/fineCalculator.js";

export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.body;

  const book = await Book.findById(id);
  if (!book) {
    return next(new ErrorHandler(404, "Book not found"));
  }
  const user = await User.findOne({ email, accountVerified: true });
  if (!user) {
    return next(new ErrorHandler(404, "User not found"));
  }
  if (book.quantity === 0) {
    return next(new ErrorHandler(400, "Book not available"));
  }

  const isAlreadyBorrowed = user.borrowedBooks.find(
    (b) => b.bookId.toString() === id && b.returened== false
  );
  if (isAlreadyBorrowed) {
    return next(new ErrorHandler(400, "Book already borrowed"));
  }
  book.quantity -= 1;
  book.availability = book.quantity > 0;
  await book.save();

  user.borrowedBooks.push({
    bookId: book._id,
    bookTitle: book.title,
    borrowedDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();
  await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    book: book._id,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price: book.price,
  });
  res.status(200).json({
    success: true,
    message: "Borrowed book recorded successfully..",
  });
});
export const returnBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const { bookId } = req.params;
  const { email } = req.body;
  const book = await Book.findById(bookId);

  if (!book) {
    return next(new ErrorHandler(404, "Book not found"));
  }
  const user = await User.findOne({ email, accountVerified: true });
  if (!user) {
    return next(new ErrorHandler(404, "User not found"));
  }
  const borrowedBook = user.borrowedBooks.find(
    (b) => b.bookId.toString() === bookId && b.returened === false
  );
  if (!borrowedBook) {
    return next(new ErrorHandler(400, "You have not borrowed this book"));
  }
  borrowedBook.returened = true;
  await user.save();

  book.quantity += 1;
  book.availability = book.quantity > 0;
  await book.save();

  const borrow = await Borrow.findOne({
    book: bookId,
    "user.email": email,
    returnDate: null,
  });
  if (!borrow) {
    return next(new ErrorHandler(400, "You have not borrowed this book"));
  }
  borrow.returnDate = new Date();
  const fine = calculateFine(borrow.dueDate);
  borrow.fine = fine;
  await borrow.save();
  res.status(200).json({
    success: true,
    message:
      fine !== 0
        ? `The book has been returned successfully. The total charges, including a fine, are ₹${fine + book.price}`
        : `The book has been returned successfully. The total charges are ₹${book.price}`,
  });
});

export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const {borrowedBooks} = req.user;
  res.status(200).json({
    success: true,
    borrowedBooks,
  })
});

export const getBorrowedBooksForAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const borrowedBooks = await Borrow.find()
    res.status(200).json({
      success: true,
      borrowedBooks,
    })
  }
);
