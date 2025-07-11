import { Schema, Types, model, Document } from 'mongoose';


export interface User extends Document {
    name: string;
    email: string;
    token: string[];
    password: string;
    blog: string[] | Types.ObjectId[];
    like: string[] | Types.ObjectId[];
    saveBlog: string[] | Types.ObjectId[];
}

const userSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    token: [{ type: String }],
    password: { type: String, required: true },
    blog: [{ type: Types.ObjectId, ref: 'Blog' }],
    like: [{ type: Types.ObjectId, ref: 'Blog' }],
    saveBlog: [{ type: Types.ObjectId, ref: 'Blog' }],
});

export default model<User>('User', userSchema);

