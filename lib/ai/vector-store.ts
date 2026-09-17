import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Errors, Pinecone } from "@pinecone-database/pinecone";

import { getEmbeddingModel } from "./model";


const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const TOP_K = 4;

export type ChunkMetadata = {
    workspaceId: string;
    sourceId: string;
    sourceTitle: string;
    chunkIndex: number;
    text: string;
};
  
export type RetrievedChunk = {
    id: string;
    score: number;
    text: string;
    sourceId: string;
    sourceTitle: string;
    chunkIndex: number;
};

let pineconeClient:Pinecone | null = null;


function getPineconeClient() {
   
  
    if (!pineconeClient) {
      pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    }
  
    return pineconeClient;
  }

  export function workspaceNamespace(workspaceId: string) {
    return `workspace_${workspaceId}`;
  }
  
function getWorkspaceIndex(workspaceId: string) {
    const pc = getPineconeClient();
    return pc.index<ChunkMetadata>({
      name: process.env.PINECONE_INDEX!,
      namespace: workspaceNamespace(workspaceId),
    });
  }

function isMissingNamespaceError(error: unknown) {
    return (
      error instanceof Errors.PineconeNotFoundError ||
      error instanceof Errors.PineconeFailedPreconditionError
    );
  }

async function ignoreMissingNamespace(operation: () => Promise<void>) {
    try {
      await operation();
    } catch (error) {
      if (isMissingNamespaceError(error)) {
        return;
      }
      throw error;
    }
  }
  
  export async function upsertSourceChunks(input: {
    workspaceId: string;
    sourceId: string;
    sourceTitle: string;
    extractedText: string;
  }) {
    const docs = [
      new Document({
        pageContent: input.extractedText,
        metadata: {
          workspaceId: input.workspaceId,
          sourceId: input.sourceId,
          sourceTitle: input.sourceTitle,
        },
      }),
    ];

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    const chunks = await splitter.splitDocuments(docs);
    if (chunks.length === 0) {
      throw new Error("No chunks produced from source text");
    }
  
    const embeddings = await getEmbeddingModel();
    const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.pageContent));
    const index = getWorkspaceIndex(input.workspaceId);
    for (let start = 0; start < chunks.length; start += 100) {
      const batchChunks = chunks.slice(start, start + 100);
      const batchVectors = vectors.slice(start, start + 100);
  
      await index.upsert({
        records: batchChunks.map((chunk, offset) => {
          const chunkIndex = start + offset;
          return {
            id: `${input.sourceId}_${chunkIndex}`,
            values: batchVectors[offset]!,
            metadata: {
              workspaceId: input.workspaceId,
              sourceId: input.sourceId,
              sourceTitle: input.sourceTitle,
              chunkIndex,
              text: chunk.pageContent,
            },
          };
        }),
      });
    }
  }
  
  export async function deleteSourceVectors(workspaceId: string, sourceId: string) {
    await ignoreMissingNamespace(async () => {
      const index = getWorkspaceIndex(workspaceId);
      await index.deleteMany({
        filter: { sourceId: { $eq: sourceId } },
      });
    });
  }
  
  export async function deleteWorkspaceVectors(workspaceId: string) {
    await ignoreMissingNamespace(async () => {
      const index = getWorkspaceIndex(workspaceId);
      await index.deleteAll();
    });
  }
  
  export async function retrieveChunks(input: {
    workspaceId: string;
    sourceIds: string[];
    question: string;
  }) {
    if (input.sourceIds.length === 0) {
      return [];
    }
  
    const embeddings = await getEmbeddingModel();
    const queryVector = await embeddings.embedQuery(input.question);
    const index = getWorkspaceIndex(input.workspaceId);
  
    const response = await index.query({
      vector: queryVector,
      topK: TOP_K,
      includeMetadata: true,
      includeValues: false,
      filter: {
        workspaceId: { $eq: input.workspaceId },
        sourceId: { $in: input.sourceIds },
      },
    });
  
    return (response.matches ?? [])
      .filter((match) => match.metadata?.text)
      .map((match) => ({
        id: match.id,
        score: match.score ?? 0,
        text: String(match.metadata!.text),
        sourceId: String(match.metadata!.sourceId),
        sourceTitle: String(match.metadata!.sourceTitle),
        chunkIndex: Number(match.metadata!.chunkIndex),
      })) satisfies RetrievedChunk[];
  }
  