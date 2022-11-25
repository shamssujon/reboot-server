const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 9000;

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send(`Sell Phone Server is running at port ${port}`);
});

app.listen(port, () => {
    console.log(`Sell Phone Server is running on port: ${port}`);
});