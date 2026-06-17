import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable")
}

const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// In development, use a global variable so the value is preserved across
// module reloads caused by HMR (Hot Module Replacement).
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise
  // Database name is taken from the connection string ("eventtickets").
  return connectedClient.db()
}

export default clientPromise
