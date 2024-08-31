class HttpError extends Error {
    constructor (message, errorCode) {
        super(message); //adds a message property to the created error
        this.code = errorCode;
    }

}

module.exports = HttpError;