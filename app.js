
const express = require('express')
const app = express()
const port = 8080

app.use(express.static("public"));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

app.post('/logs', (req, res) => {
    console.log(req.body);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
