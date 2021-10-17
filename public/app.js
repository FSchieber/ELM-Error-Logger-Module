import { ErrorLogger } from "./lib/errorlogger.js";

const logger = new ErrorLogger({
    source: "app.js",
    interval: 10,
    log_uncaught: true,
    app_version: "1.0.0",
    api_url: "http://localhost:8080/logs"
});

const form = document.getElementById('formulario');

form.addEventListener("submit", (e) => {
    try {
        e.preventDefault();
        let nome = document.getElementById('nome').value;
        let sobrenome = document.getElementById('sobrenome').value;
        let mensagem = "O seu nome é " + primeiro_nome + " " + sobrenome;
        alert(mensagem);
    } catch (err) {
        logger.logError(err);
    }
}, false);