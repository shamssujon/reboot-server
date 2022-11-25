const express = require("express");
const cors = require("cors");
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