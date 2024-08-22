import axios from "axios";
import { VectorDB } from 'imvectordb';

const db = new VectorDB();

db.addText("text for semantic search")
// ...add additional text as needed

db.queryText("text to search")


// import { AxiosError } from "axios";


// const generateEmbedding = async (text: string): Promise<number[]> => {
//   try {
//     const response = await axios.post(
//       "https://api.openai.com/v1/embeddings",
//       {
//         input: text,
//         model: "text-embedding-ada-002"
//       },
//       {
//         headers:
//         {
//           "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );
//   } catch (error) {
//     const axiosError = error as AxiosError;
//     console.error(axiosError);
//   }

//   return response.data.data[0].embedding;
// }