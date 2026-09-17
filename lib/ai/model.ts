import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";


let chatModel: ChatOpenAI | null = null;
let embeddingModel: OpenAIEmbeddings | null = null;

export async function getChatModel() {
    if (!chatModel) {
        chatModel = new ChatOpenAI({
            model: process.env.OPENAI_CHAT_MODEL,
            apiKey: process.env.OPENAI_API_KEY,
            streaming: true,
        });
    }
    return chatModel;
}

export async function getEmbeddingModel() {
    if (!embeddingModel) {
        embeddingModel = new OpenAIEmbeddings({
            model: process.env.OPENAI_EMBEDDING_MODEL,
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return embeddingModel;
}