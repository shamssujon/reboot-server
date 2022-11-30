const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

// Verify JWT
const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		res.status(401).send("Unauthorized access");
	}

	const token = authHeader.split(" ")[1];

	jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
		if (error) {
			return res.status(403).send({ message: "Forbidden Access" });
		}
		req.decoded = decoded;
		next();
	});
};

const run = async () => {
	try {
		const database = client.db("rebootDB");
		const usersCollection = database.collection("users");
		const productCategoryCollection = database.collection("productCategories");
		const productsCollection = database.collection("products");
		const ordersCollection = database.collection("orders");

		// Send access token
		app.get("/jwt", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);

			// if a user has found in the usersCollection, generate a token
			if (user) {
				const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "72h" });
				return res.send({ accessToken: token });
			}

			// if user not user in the DB, send a 401/403 status
			res.status(403).send({ accessToken: "" });
		});

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

		// Delete user from DB
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await usersCollection.deleteOne(query);
			res.send(result);
		});

		// Check user role
		app.get("/users/role/:email", async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			res.send({ userRole: user?.role });
		});

		// Add a category to DB
		app.post("/categories", async (req, res) => {
			const category = req.body;
			const categorySlug = category.name.trim().split(" ").join("-").toLowerCase();
			category.slug = categorySlug;
			const result = await productCategoryCollection.insertOne(category);
			res.send(result);
		});

		// Get all categories
		app.get("/categories", async (req, res) => {
			const limit = parseInt(req.query.limit);
			const categories = await productCategoryCollection
				.find({})
				.limit(limit ? limit : 0)
				.toArray();
			res.send(categories);
		});

		// Add a product to DB
		app.post("/products", async (req, res) => {
			const product = req.body;
			product.postingDate = new Date();
			const result = await productsCollection.insertOne(product);
			res.send(result);
		});

		// Get all products
		app.get("/products", async (req, res) => {
			let query = {};
			const limit = parseInt(req.query.limit);
			const email = req.query.email;
			const status = req.query.status;
			const sponsored = req.query.sponsored;

			// Qeury with email
			// "seller.email" is for matching nested object filed
			// https://www.geeksforgeeks.org/mongodb-query-embedded-documents-using-mongo-shell/
			if (email) {
				query = { "seller.email": email };
			}

			// filter avialable products
			if(status) {
				query = { status: status };
			}

			// Qeury for sponsored products
			if (sponsored === "true") {
				query = { sponsored: true };
			}

			const products = await productsCollection
				.find(query)
				.limit(limit ? limit : 0)
				.toArray();
			res.send(products);
		});

		// Delete a product from DB
		app.delete("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await productsCollection.deleteOne(query);
			res.send(result);
		});

		// Update product for advertise
		app.put("/products/makesponsored/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };

			const updatedDoc = {
				$set: {
					sponsored: true,
				},
			};

			const result = await productsCollection.updateOne(filter, updatedDoc, options);
			res.send(result);
		});

		// Get category wise products
		app.get("/products/:categorySlug", async (req, res) => {
			const categorySlug = req.params.categorySlug;
			const filter = { category: categorySlug };
			const categoryWiseProducts = await productsCollection.find(filter).toArray();
			console.log(categoryWiseProducts);
			res.send(categoryWiseProducts);
		});

		// Get a single product from DB
		app.get("/product/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const product = await productsCollection.findOne(query);
			res.send(product);
		});

		// Add a order to DB
		app.post("/orders", async (req, res) => {
			const order = req.body;
			order.orderDate = new Date();
			const result = await ordersCollection.insertOne(order);
			res.send(result);
		});

		// Get orders from DB
		app.get("/orders", async (req, res) => {
			const email = req.query.email;
			const filter = { buyerEmail: email };
			const orders = await ordersCollection.find(filter).toArray();
			res.send(orders);
		});
	} finally {
	}
};

run().catch(console.dir);
