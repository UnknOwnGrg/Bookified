import { IBookSegment } from "@/types";
import { model } from "mongoose";
import { models, Schema } from "mongoose";

//It needs to be shared with vapi by which user can speak with book

const BookSegmentSchema = new Schema<IBookSegment>({
    clerkId: { type: String , required: true }, 
    bookId: { type: Schema.Types.ObjectId , ref:'Book' , required: true , index: true },
    content: { type: String, required: true }, 
    segmentIndex: { type: Number, required: true, index: true },
    pageNumber: { type: Number, index: true },
    wordCount: { type : Number, required: true }
}, { timestamps : true });

//to use the efficient book retrival.
//without this index it will serach all the Contents.
//So it is important to split contents in the segments
BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
BookSegmentSchema.index({ bookId: 1, pageNumber: 1 });

BookSegmentSchema.index({ bookId: 1, content: 'text'});



const BookSegment = models.BookSegment || model<IBookSegment>('BookSegment', BookSegmentSchema);

export default BookSegment;
