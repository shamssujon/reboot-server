const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 9000;

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send(`Reboot Server is running at port ${port}`);
});

app.listen(port, () => {
	console.log(`Reboot Server is running on port: ${port}`);
});

// Mongo DB
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.9q7qmdx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const run = async () => {
	try {
		const database = client.db("rebootDB");
		const usersCollection = database.collection("users");
		const productCategoryCollection = database.collection("productCategories");

		// Get user from client, send to DB
		app.post("/users", async (req, res) => {
			const user = req.body;

			// Check for existing user
			const filter = { email: user.email };
			const existingUser = await usersCollection.findOne(filter);

			// Prevent insert existing user to DB
			if (existingUser) {
				return res.send({ message: "Existing user!" });
			}

			const result = await usersCollection.insertOne(user);
			res.send(result);
		});

		// Get users from DB with/without query
		app.get("/users", async (req, res) => {
			const role = req.query.role;
			let query = {};

			if (role) {
				query = { role: role };
			}

			const users = await usersCollection.find(query).toArray();
			res.send(users);
		});

		// Add a category to DB
		app.post("/categories", async (req, res) => {
			const category = req.body;
			const result = await productCategoryCollection.insertOne(category);
			res.send(result);
		});

		// Get all categories
		app.get("/categories", async (req, res) => {
			const categories = await productCategoryCollection.find({}).toArray();
			res.send(categories);
		});
	} finally {
	}
};

run().catch(console.dir);
