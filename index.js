import express from "express";
import cors from "cors";
import driver from "bigchaindb-driver";

const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());

// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BigchainDB code
const API_PATH = "http://localhost:9984/api/v1/";
const conn = new driver.Connection(API_PATH);

const keyPair = new driver.Ed25519Keypair();
const publicKey = keyPair.publicKey;
const privateKey = keyPair.privateKey;

// Push user to DB
const createUserToDB = async (user) => {
  try {
    const tx = driver.Transaction.makeCreateTransaction(
      user,
      null,
      [
        driver.Transaction.makeOutput(
          driver.Transaction.makeEd25519Condition(publicKey)
        ),
      ],
      publicKey
    );
    const txSigned = driver.Transaction.signTransaction(tx, privateKey);
    const txResponse = await conn.postTransactionCommit(txSigned);

    console.log("Transaction ID: ", txResponse.id);
    console.log("Asset pushed to database successfully.");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

app.get("/", (req, res) => {
  res.send("Server is active.");
});

app.post("/create-user", async (req, res) => {
  try {
    const user = req.body;
    await createUserToDB(user);

    res
      .status(200)
      .json({ message: "Asset pushed to the database successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      error: "An error occurred while pushing the asset to the database.",
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await conn.searchAssets("23");
    res.send(result);

    console.log("Assets retrieved from the database.");
  } catch (err) {
    console.log("Failed to retrieve assets: ", err);
    res.status(500).send("Error retrieving assets");
  }
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});
