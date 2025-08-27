import {Document, model, Schema, Types} from 'mongoose';


export interface Token extends Document {
    id_user: string | Types.ObjectId;
    token: string;
    createdAt: Date;
    expireAt: Date;
}

const tokenSchema = new Schema<Token>({
    id_user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    token: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, expires: '7d'},
    expireAt: {type: Date, required: true}
});

export default model<Token>('Token', tokenSchema);

