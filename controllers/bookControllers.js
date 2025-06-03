import express from "express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModels.js";
import { Book } from "../models/bookModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

export const addBook = catchAsyncErrors(async (req, res, next) => {
  const { title, author, discription, price, quantity } = req.body;
  if (!title || !author || !discription || !price || !quantity) {
    return next(new ErrorHandler(400, "Please fill all the fields"));
  }
  const book = await Book.create({
    title,
    author,
    discription,
    price,
    quantity,
    availability: quantity > 0 ? true : false,
  });
  res.status(201).json({
    success: true,
    message: "Book added successfully",
    book,
  })
});


export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
    const books = await Book.find();
    res.status(200).json({
        success: true,
        books,
    })
});
export const deleteBook = catchAsyncErrors(async (req, res, next) => {
    const {id} = req.params;
    const book = await Book.findById(id);
    if(!book){
        return next (new ErrorHandler(404, "Book not found"))
    }
    await book.deleteOne();
    res.status(200).json({
        success:true,
        message:"Book deleted successfully",
    })
});
