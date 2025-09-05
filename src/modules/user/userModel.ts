import {Document, model, Schema} from 'mongoose';


export interface User extends Document {
    name: string;
    email: string;
    token: string[];
    password: string;
}

const userSchema = new Schema<User>({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    token: [{type: String}],
    password: {type: String, required: true},
});

export default model<User>('User', userSchema);

