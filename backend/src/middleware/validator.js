// const createHttpError = require("http-errors");
// //* Include joi to check error type
// const Joi = require("joi");
//* Include all validators


import Validators from "../validators/index.js";

export default function (validator) {
    //! If validator is not exist, throw err
    if (!Validators.hasOwnProperty(validator))
        throw new Error(`'${validator}' validator is not exist`);

    return async function (req, res, next) {
        try {
            let validated;

            switch (req.method) {
                case 'GET':
                    validated = await Validators[validator].validateAsync(req.query);
                    req.params = validated;
                    break;
                case 'POST':
                case 'PUT':
                case 'PATCH':
                    validated = await Validators[validator].validateAsync(req.body);
                    req.body = validated;
                    break;
                case 'DELETE':
                    validated = await Validators[validator].validateAsync(req.params);
                    req.params = validated;
                    break;
                default:
                    throw new Error(`Unsupported HTTP method: ${req.method}`);
            }

            next();
        } catch (err) {
            // Pass err to next
            if (err.isJoi) {
                res.status(422).json({
                    err: err,
                    status: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    err: err,
                    status: "error",
                    message: "Internal server error",
                });
            }
        }
    };

};