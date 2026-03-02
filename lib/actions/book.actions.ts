"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, IBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

//To fetch data form the database
export const getAllBooks = async (): Promise<{ success: true; books: IBook[] } | { success: false; error: unknown }> => {
    try {
        //To connect to database
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return { 
            success: true, 
            books: serializeData(books) as IBook[]
        }

    }catch (e) {
        console.error('Error connecting to database', e);
        return { 
            success : false , error : e
        }
    }
}



//To check the book if already exists or not
export const checkBookExists = async (title : string ) => {
    try{
        await connectToDatabase();
        const slug = generateSlug(title);

        const existingBook = await Book.findOne({slug}).lean();
        
        if(existingBook){
            return {
                exists: true ,book: serializeData(existingBook)
            }
        }

        return { 
            exists: false
        }

    }catch (error){
        console.error('Error checking book exists', error);
        return {
            exists: false, error: error
        }
    }
}

//To create books 
export const createBook = async ( data : CreateBook ) => {
    try {
        //To connect to the database
        await connectToDatabase();

        const slug = generateSlug(data.title);
        const existingBook = await Book.findOne({ slug }).lean();

        if(existingBook) {
            return {
                success: true ,
                data: serializeData(existingBook) , //Simply it will clear the selected data for Frontend data
                alreadyExists: true 
            }
        }

        //Todo: Check subscription  limits before createing a book.

        const book = await Book.create({ ...data, slug , totalSegments: 0 }); 

        return {
            success: true,
            data: serializeData(book),
            alreadyExists: false
        };
    } catch (error) {
        console.error('Error createing a book',error);

        return {
            success: false,
            error: error
        }
    }
}

//To save the books or we can say update the books
export const saveBookSegments = async (bookId: string , clerkId: string, segments : TextSegment[])=> {
    try{
        await connectToDatabase();
        console.log('Savig book segments');

        const segmentsToInsert = segments.map(({text, segmentIndex , pageNumber , wordCount}) => ({
            clerkId, bookId, content: text, segmentIndex, pageNumber , wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments : segments.length });
        
        console.log('Book segments saved successfully');

        return {
            success: true, 
            data: {
                segmentsCreated: segments.length
            }
        }
    }catch (e) {
        console.error('Error saving book segments', e);

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        console.log('Deleted book segments and book due to failure to save segments.');
        return{
            success: false, 
            error: e
        }
    }
}

// To fetch a book by its slug
export const getBookBySlug = async (slug: string): Promise<{ success: true; data: IBook } | { success: false; error?: unknown }> => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return { success: false };
        }

        return {
            success: true,
            data: serializeData(book) as IBook
        };
    } catch (error) {
        console.error('Error fetching book by slug', error);
        return {
            success: false,
            error
        };
    }
}