class ErrorLogger {
    constructor(params = {
        /** @param {string} source — nome do arquivo fonte / arquivo em que estamos rastreando os erros */
        source: null,
        /** @param {number} interval — intervalo do buffer em segundos */
        interval: 10000,
        /** @param {boolean} log_uncaught — ativar ou desativar o log de erros não tratados */
        log_uncaught: true,
        /** @param {string} app_version — versão da aplicação */
        app_version: null,
        /** @param {text} api_url — URL da API POST que irá receber os logs */
        api_url: null,
    }) {
        this.source = params.source;
        this.interval = params.interval * 1000 || 10000; // recebe os intervalos em segundos e converte para millisegundos ou seta 10000ms como padrão
        this.app_version = params.app_version;
        this.log_uncaught = params.log_uncaught === false ? false : true; // caso o parâmetro log_uncaught não seja configurado, seta como true por padrão
        this.api_url = params.api_url;
        this.error_buffer = []; // array para armazenar os logs coletados antes de enviar para o servidor
        this.init();

        if (!this.api_url) {
            console.error("Nenhuma API fornecida. Os logs não serão enviados para o servidor.")
        }
    }

    init() {
        this.setBrowser();
        if (this.log_uncaught) {
            this.uncaughtLogger();
        }
        this.startBuffering();
    }

    /* Seta um Interval no tempo especificado e a cada intervalo, 
    verifica se há logs no buffer e os envia para o servidor */
    startBuffering() {
        setInterval(async () => {
            if (this.error_buffer.length) {
                try {
                    let xhr = new XMLHttpRequest();
                    xhr.open("POST", this.api_url);
                    xhr.setRequestHeader("Accept", "application/json");
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(this.error_buffer));
                    while (this.error_buffer.pop()) { } // limpa o buffer
                    console.log("buffer flushed");
                } catch (error) {
                    console.log('error in buffering', error)
                }
            }
        }, this.interval);
    }

    /* Define a variável que irá armazenar o tipo de navegador que está sendo utilizado.
    Primeiro tentamos obter a versão do navegador fazendo uma comparação de recursos. Como backup, utilizamos o User Agent no final */
    setBrowser() {
        if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
            this.browser = "opera";
        } else if (typeof InstallTrigger !== 'undefined') {
            this.browser = "firefox"
        } else if (/constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification))) {
            this.browser = "safari"
        } else if (/*@cc_on!@*/false || !!document.documentMode) {
            this.browser = "IE"
        } else if (!!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)) {
            this.browser = "chrome"
        }
        if (!this.browser) {
            let browser_name = undefined;
            let isIE = /*@cc_on!@*/false || !!document.documentMode;
            let isEdge = !isIE && !!window.StyleMedia;
            if (navigator.userAgent.indexOf("Chrome") != -1 && !isEdge) {
                browser_name = 'chrome';
            }
            else if (navigator.userAgent.indexOf("Safari") != -1 && !isEdge) {
                browser_name = 'safari';
            }
            else if (navigator.userAgent.indexOf("Firefox") != -1) {
                browser_name = 'firefox';
            }
            else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) //IF IE > 10
            {
                browser_name = 'ie';
            }
            else if (isEdge) {
                browser_name = 'edge';
            }
            this.browser = browser_name;
        }
    }

    /* Cria um evento para monitorar todos os erros não tratados */
    uncaughtLogger() {
        window.onerror = (message, source, lineno, colno, error) => {
            if (this.isWhitelisted(message)) return; // chama uma white list de erros declarada abaixo. Útil caso tenha algum erro que não tenha valor ser coletado
            let newError = {
                message: message,
                source: this.source,
                line: lineno,
                column: colno,
                app_version: this.app_version,
                browser: this.browser,
            }
            this.error_buffer.push(newError);
            console.log("Uncaught exception on", newError);
        }
    }

    logError(error, objects = null) {
        if (this.isWhitelisted(error.message)) return;
        for (let i in objects) {
            if (typeof (objects[i]) === "object") {
                objects[i] = JSON.stringify(objects[i]);
            }
        }
        if (objects && objects.length && typeof (objects) === "object") {
            objects = JSON.stringify(objects);
        }
        let lineno, colno;
        let stack = error.stack.split("\n");
        let error_stack;
        for (let i in stack) {
            if (stack[i].includes(".js:")) {
                error_stack = stack[i];
                break;
            }
        }
        error_stack = error_stack.split(":");
        lineno = Array.from(error_stack[error_stack.length - 2]);
        colno = Array.from(error_stack[error_stack.length - 1]);
        lineno = lineno.filter(x => !isNaN(x));
        colno = colno.filter(x => !isNaN(x));
        lineno = lineno.join('');
        colno = colno.join('');
        let newError = {
            message: error.message,
            source: this.source,
            line: lineno,
            column: colno,
            app_version: this.app_version,
            browser: this.browser,
            objects: objects
        }
        this.error_buffer.push(newError);
        console.log("Caught error on ", newError);
    }

    isWhitelisted(message) {
        let allowed = ["FocusTrap: Element must have at least one focusable child"];

        for (let i in allowed) {
            if (message.includes(allowed[i])) {
                return true;
            }
        }
        return false;
    }
}

export { ErrorLogger };